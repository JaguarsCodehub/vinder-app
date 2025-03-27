const Venue = require('../models/Venue');
const UserPreference = require('../models/UserPreference');
const mbxClient = require('@mapbox/mapbox-sdk');
const mbxTilequery = require('@mapbox/mapbox-sdk/services/tilequery');
const mongoose = require('mongoose');

const baseClient = mbxClient({ accessToken: process.env.MAPBOX_ACCESS_TOKEN });
const tilequeryService = mbxTilequery(baseClient);

// Test Mapbox connection
const testMapboxConnection = async () => {
    try {
        // Test with a simple tilequery for Mumbai
        const response = await fetch(
            `https://api.mapbox.com/v4/mapbox.mapbox-streets-v8/tilequery/72.8777,19.0759.json?radius=1000&limit=1&layers=poi_label&access_token=${process.env.MAPBOX_ACCESS_TOKEN}`
        );
        
        const data = await response.json();
        console.log('Mapbox test response:', {
            status: response.status,
            features: data.features?.length || 0
        });
        return response.ok;
    } catch (error) {
        console.error('Mapbox test failed:', error);
        return false;
    }
};

// Get venues near a location using Mapbox
exports.getNearbyVenues = async (req, res) => {
    try {
        const { longitude, latitude, radius = 30 } = req.query;
        
        // Test Mapbox connection first
        console.log('Testing Mapbox connection...');
        const isMapboxWorking = await testMapboxConnection();
        if (!isMapboxWorking) {
            return res.status(500).json({ message: 'Mapbox API is not working correctly' });
        }
        
        // Validate coordinates
        if (!longitude || !latitude) {
            console.error('Missing coordinates:', { longitude, latitude });
            return res.status(400).json({ message: 'Missing coordinates' });
        }

        const coords = [parseFloat(longitude), parseFloat(latitude)];
        
        // Validate parsed coordinates
        if (isNaN(coords[0]) || isNaN(coords[1])) {
            console.error('Invalid coordinates:', { longitude, latitude });
            return res.status(400).json({ message: 'Invalid coordinates' });
        }

        console.log('Searching with coordinates:', { longitude: coords[0], latitude: coords[1], radius });

        // Convert radius from kilometers to meters
        const radiusInMeters = parseInt(radius) * 1000;

        // For larger radii, we'll use a grid-based approach to get better coverage
        const gridSize = Math.min(Math.ceil(radiusInMeters / 20000), 4); // Max 4x4 grid
        const latStep = (radiusInMeters / 111000) / gridSize; // Convert meters to rough degrees
        const lngStep = (radiusInMeters / (111000 * Math.cos(coords[1] * Math.PI / 180))) / gridSize;

        const searchPoints = [];
        for (let i = -gridSize/2; i <= gridSize/2; i++) {
            for (let j = -gridSize/2; j <= gridSize/2; j++) {
                searchPoints.push({
                    longitude: coords[0] + j * lngStep,
                    latitude: coords[1] + i * latStep,
                    radius: radiusInMeters / (gridSize * 1.5) // Overlap the circles a bit
                });
            }
        }

        // Make requests for each search point in parallel
        const searchPromises = searchPoints.map(async point => {
            try {
                const response = await fetch(
                    `https://api.mapbox.com/v4/mapbox.mapbox-streets-v8/tilequery/${point.longitude},${point.latitude}.json?radius=${point.radius}&limit=50&layers=poi_label&access_token=${process.env.MAPBOX_ACCESS_TOKEN}`
                );

                if (!response.ok) {
                    console.error(`Mapbox API error for point ${point.longitude},${point.latitude}:`, await response.text());
                    return [];
                }

                const data = await response.json();
                return data.features || [];
            } catch (error) {
                console.error(`Error fetching venues for point ${point.longitude},${point.latitude}:`, error);
                return [];
            }
        });

        const featureArrays = await Promise.all(searchPromises);
        
        // Combine all features, removing duplicates based on name and coordinates
        const uniqueFeatures = new Map();
        featureArrays.flat().forEach(feature => {
            const key = `${feature.properties.name}-${feature.geometry.coordinates[0]}-${feature.geometry.coordinates[1]}`;
            if (!uniqueFeatures.has(key) && isRelevantVenue(feature)) {
                uniqueFeatures.set(key, feature);
            }
        });

        console.log('Raw Mapbox response:', {
            totalFeatures: uniqueFeatures.size,
            searchPoints: searchPoints.length
        });

        // Transform features to venues
        const venues = [];
        for (const feature of uniqueFeatures.values()) {
            const venue = transformMapboxFeature(feature);
            if (venue) {
                venues.push(venue);
            }
        }

        // Sort venues by distance
        venues.sort((a, b) => (a.distance || 0) - (b.distance || 0));
        console.log(`Found ${venues.length} unique venues`);

        // Save venues to database and collect their IDs
        const venuesWithIds = [];
        if (venues.length > 0) {
            try {
                for (const venue of venues) {
                    // Try to find existing venue
                    let existingVenue = await Venue.findOne({
                        'location.coordinates': venue.location.coordinates,
                        name: venue.name
                    });

                    if (existingVenue) {
                        // Update existing venue
                        Object.assign(existingVenue, venue);
                        await existingVenue.save();
                        venuesWithIds.push(existingVenue);
                    } else {
                        // Create new venue
                        const newVenue = new Venue(venue);
                        await newVenue.save();
                        venuesWithIds.push(newVenue);
                    }
                }
                console.log(`Successfully processed ${venuesWithIds.length} venues`);
            } catch (error) {
                console.error('Error saving venues:', error);
            }
        }
        
        res.json(venuesWithIds);
    } catch (error) {
        console.error('Mapbox API Error:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ message: error.message });
    }
};

// Check if a venue is relevant based on its properties
function isRelevantVenue(feature) {
    const properties = feature.properties || {};
    const class_ = (properties.class || '').toLowerCase();
    const maki = (properties.maki || '').toLowerCase();
    const name = (properties.name || '').toLowerCase();
    const type = (properties.type || '').toLowerCase();
    const category = (properties.category || '').toLowerCase();

    // List of relevant venue types
    const relevantClasses = [
        'food_and_drink',
        'restaurant',
        'cafe',
        'fast_food',
        'entertainment',
        'leisure',
        'shopping',
        'sports',
        'arts_and_entertainment',
        'retail',
        'recreation',
        'attraction',
        'commercial',
        'service',
        'landmark',
        'shop',
        'amenity',
        'tourism'
    ];

    const relevantMaki = [
        'restaurant',
        'cafe',
        'fast-food',
        'bar',
        'shopping',
        'mall',
        'cinema',
        'theatre',
        'amusement_park',
        'museum',
        'park',
        'stadium',
        'gym',
        'sports',
        'gaming',
        'shop',
        'store',
        'market',
        'department_store',
        'supermarket',
        'convenience',
        'clothing_store',
        'electronics_store'
    ];

    // Keywords to look for in names
    const relevantKeywords = [
        // Shopping & Retail
        'mall', 'plaza', 'market', 'store', 'shop', 'retail',
        'outlet', 'complex', 'center', 'mart', 'emporium',
        'supermarket', 'hypermarket', 'shopping',

        // Entertainment
        'theatre', 'cinema', 'movie', 'entertainment',
        'game', 'play', 'arcade', 'bowling', 'casino',
        'club', 'lounge', 'karaoke',

        // Food & Dining
        'restaurant', 'cafe', 'coffee', 'food', 'dining',
        'bistro', 'pizzeria', 'bakery', 'kitchen',
        'eatery', 'diner', 'grill', 'buffet',

        // Sports & Recreation
        'sport', 'gym', 'fitness', 'yoga', 'stadium',
        'arena', 'court', 'pool', 'swimming',
        'recreation', 'play', 'games',

        // Culture & Tourism
        'museum', 'gallery', 'art', 'exhibition',
        'cultural', 'heritage', 'historic', 'tourist',
        'attraction', 'landmark', 'monument',

        // Services & Amenities
        'salon', 'spa', 'wellness', 'center',
        'clinic', 'hospital', 'medical', 'pharmacy',
        'bank', 'service', 'office'
    ];

    // Check if it's a relevant venue
    return (
        relevantClasses.includes(class_) ||
        relevantMaki.includes(maki) ||
        relevantKeywords.some(keyword => 
            name.includes(keyword) || 
            type.includes(keyword) || 
            category.includes(keyword)
        )
    );
}

// Transform a single Mapbox feature to our venue format
function transformMapboxFeature(feature) {
    const properties = feature.properties || {};
    const coordinates = feature.geometry?.coordinates || [0, 0];
    
    // Get a more specific category
    const category = determineCategory(feature);
    
    // Enhance description based on venue type
    let description = properties.name || 'Unnamed Venue';
    if (properties.type) description += ` - ${properties.type}`;
    if (category === 'shopping') description += ' 🛍️';
    if (category === 'restaurant') description += ' 🍽️';
    if (category === 'entertainment') description += ' 🎭';
    if (category === 'sports') description += ' 🏃';
    
    // Generate random rating and price range
    const rating = (Math.random() * 2 + 3).toFixed(1);
    const priceRange = generateRandomPriceRange();
    
    return {
        name: properties.name || 'Unnamed Venue',
        description,
        location: {
            type: 'Point',
            coordinates: coordinates
        },
        address: {
            street: properties.address || '',
            city: 'Mumbai',
            state: 'Maharashtra',
            zipCode: ''
        },
        category,
        rating,
        priceRange,
        distance: properties.tilequery?.distance // Distance in meters from search point
    };
}

// Helper function to determine venue category
function determineCategory(feature) {
    const properties = feature.properties || {};
    const type = (properties.type || '').toLowerCase();
    const category = (properties.category || '').toLowerCase();

    // Direct mappings
    if (type.includes('restaurant') || type.includes('food') || category.includes('food')) return 'restaurant';
    if (type.includes('park') || category.includes('park')) return 'park';
    if (type.includes('arcade') || type.includes('game')) return 'arcade';
    if (type.includes('cinema') || type.includes('movie') || type.includes('theater')) return 'movie_theater';
    if (type.includes('cafe') || type.includes('coffee')) return 'cafe';
    if (type.includes('mall') || type.includes('shop') || type.includes('store')) return 'shopping';
    if (type.includes('gym') || type.includes('fitness')) return 'fitness';
    if (type.includes('hospital') || type.includes('clinic') || type.includes('medical')) return 'healthcare';
    if (type.includes('school') || type.includes('college') || type.includes('university')) return 'education';
    if (type.includes('salon') || type.includes('spa')) return 'beauty';
    if (type.includes('hotel') || type.includes('lodging')) return 'hotel';
    if (type.includes('sports') || type.includes('stadium')) return 'sports';
    if (type.includes('service')) return 'services';

    // Entertainment venues
    const entertainmentKeywords = [
        'entertainment', 'club', 'bar', 'pub', 'lounge', 'karaoke',
        'bowling', 'theatre', 'concert', 'music', 'dance', 'amusement'
    ];
    if (entertainmentKeywords.some(keyword => type.includes(keyword) || category.includes(keyword))) {
        return 'entertainment';
    }

    // Default to 'other' if no specific category matches
    return 'other';
}

// Helper function to generate random price range
function generateRandomPriceRange() {
    const ranges = ['$', '$$', '$$$', '$$$$'];
    return ranges[Math.floor(Math.random() * ranges.length)];
}

// Get recommended venues based on user preferences
exports.getRecommendedVenues = async (req, res) => {
    try {
        const { longitude, latitude, radius = 5000 } = req.query;
        const userId = req.user.id;

        // Get user preferences
        const userPreferences = await UserPreference.findOne({ user: userId });
        if (!userPreferences) {
            return res.status(404).json({ message: 'User preferences not found' });
        }

        // Create query based on user preferences
        const query = {
            location: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [parseFloat(longitude), parseFloat(latitude)]
                    },
                    $maxDistance: parseInt(radius)
                }
            },
            category: { $in: userPreferences.preferredCategories }
        };

        const venues = await Venue.find(query).limit(20);
        res.json(venues);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get venue details
exports.getVenueDetails = async (req, res) => {
    try {
        const venue = await Venue.findById(req.params.id);
        if (!venue) {
            return res.status(404).json({ message: 'Venue not found' });
        }
        res.json(venue);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Add review to venue
exports.addReview = async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const userId = req.user.id;
        const venueId = req.params.id;

        const venue = await Venue.findById(venueId);
        if (!venue) {
            return res.status(404).json({ message: 'Venue not found' });
        }

        venue.reviews.push({
            user: userId,
            rating,
            comment
        });

        // Update average rating
        const totalRating = venue.reviews.reduce((sum, review) => sum + review.rating, 0);
        venue.rating = totalRating / venue.reviews.length;

        await venue.save();
        res.json(venue);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};