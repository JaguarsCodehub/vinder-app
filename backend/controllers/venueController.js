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
        
        const rawResponse = await response.text();
        console.log('Mapbox raw response:', rawResponse);
        const data = JSON.parse(rawResponse);
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
        const { longitude, latitude, radius = 30, limit = 20, page = 1 } = req.query;
        
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

        console.log('Searching with coordinates:', { longitude, latitude, radius, limit, page });

        // Calculate the actual limit to fetch based on page and limit
        const apiLimit = Math.min(parseInt(limit), 50); // Cap at 50 venues per request

        try {
            const mapboxUrl = `https://api.mapbox.com/v4/mapbox.mapbox-streets-v8/tilequery/${coords[0]},${coords[1]}.json?radius=${radius}&limit=${apiLimit}&layers=poi_label&access_token=${process.env.MAPBOX_ACCESS_TOKEN}`;
            console.log('Fetching from Mapbox URL:', mapboxUrl);
            
            const response = await fetch(mapboxUrl);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Mapbox API error:', errorText);
                throw new Error(`Mapbox API error: ${response.status}`);
            }

            let rawResponse;
            try {
                rawResponse = await response.text();
                console.log('Raw Mapbox response:', rawResponse);
            } catch (error) {
                console.error('Error reading response:', error);
                throw new Error('Failed to read Mapbox response');
            }

            let data;
            try {
                data = JSON.parse(rawResponse);
            } catch (error) {
                console.error('Error parsing JSON:', error);
                console.error('Raw response that failed to parse:', rawResponse);
                throw new Error('Failed to parse Mapbox response as JSON');
            }
            
            // Process venues more efficiently
            const venues = (data.features || [])
                .filter(feature => isRelevantVenue(feature))
                .map(feature => transformMapboxFeature(feature));

            const totalVenues = venues.length;
            console.log(`Found ${totalVenues} venues`);

            // Return paginated results with metadata
            return res.json({
                venues,
                pagination: {
                    page: parseInt(page),
                    limit: apiLimit,
                    total: totalVenues,
                    hasMore: totalVenues === apiLimit // If we got exactly the limit, there might be more
                }
            });
        } catch (error) {
            console.error('Error fetching venues:', error);
            return res.status(500).json({ 
                message: 'Error fetching venues', 
                error: error.message,
                type: error.name
            });
        }
    } catch (error) {
        console.error('Unexpected error:', error);
        return res.status(500).json({ 
            message: 'Unexpected error occurred', 
            error: error.message,
            type: error.name
        });
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
