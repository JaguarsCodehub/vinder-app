const Venue = require('../models/Venue');
const UserPreference = require('../models/UserPreference');
const mbxClient = require('@mapbox/mapbox-sdk');
const mbxTilequery = require('@mapbox/mapbox-sdk/services/tilequery');

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

        const allFeatures = new Set(); // Use Set to avoid duplicates
        
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
        
        // Combine all features, removing duplicates
        featureArrays.forEach(features => {
            features.forEach(feature => {
                if (!allFeatures.has(feature.id)) {
                    allFeatures.add(feature.id);
                }
            });
        });

        // Convert Set back to array and get full feature objects
        const uniqueFeatures = Array.from(allFeatures);
        console.log('Raw Mapbox response:', {
            totalFeatures: uniqueFeatures.length,
            searchPoints: searchPoints.length
        });

        // Filter and transform venues
        const allVenues = new Map();
        const maxVenuesPerCategory = Math.min(Math.ceil(radiusInMeters / 1000) * 2, 50); // Scale with radius, max 50 per category
        const categoryCounts = {};
        
        // First pass: collect all venues
        const potentialVenues = featureArrays
            .flat()
            .filter(feature => isRelevantVenue(feature))
            .map(feature => transformMapboxFeature(feature))
            .filter(venue => venue !== null)
            .sort((a, b) => (a.distance || 0) - (b.distance || 0)); // Sort by distance

        // Second pass: balance categories
        potentialVenues.forEach(venue => {
            const category = venue.category;
            categoryCounts[category] = categoryCounts[category] || 0;

            if (categoryCounts[category] < maxVenuesPerCategory) {
                if (!allVenues.has(venue._id)) {
                    allVenues.set(venue._id, venue);
                    categoryCounts[category]++;
                }
            }
        });

        const venues = Array.from(allVenues.values());
        console.log('Category distribution:', categoryCounts);
        console.log(`Found ${venues.length} unique venues`);
        
        // Generate ratings and price ranges
        venues.forEach(venue => {
            venue.rating = (Math.random() * 2 + 3).toFixed(1);
            venue.priceRange = generateRandomPriceRange();
        });
        
        res.json(venues);
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
    
    return {
        _id: feature.id || `venue_${Math.random().toString(36).substr(2, 9)}`,
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
        rating: '4.0', // Default rating
        priceRange: '$$', // Default price range
        distance: properties.tilequery?.distance // Distance in meters from search point
    };
}

// Helper function to determine venue category
function determineCategory(feature) {
    const properties = feature.properties || {};
    const name = (properties.name || '').toLowerCase();
    const maki = (properties.maki || '').toLowerCase();
    const class_ = (properties.class || '').toLowerCase();
    const type = (properties.type || '').toLowerCase();
    const category = (properties.category || '').toLowerCase();

    // Shopping venues
    if (
        maki === 'shopping' || maki === 'mall' || class_ === 'retail' ||
        ['mall', 'shopping', 'market', 'store', 'shop', 'retail', 'outlet'].some(k => 
            name.includes(k) || type.includes(k) || category.includes(k)
        )
    ) return 'shopping';

    // Entertainment venues
    if (
        maki === 'cinema' || maki === 'theatre' || maki === 'amusement_park' ||
        ['cinema', 'theatre', 'movie', 'entertainment', 'game', 'play', 'arcade'].some(k => 
            name.includes(k) || type.includes(k) || category.includes(k)
        )
    ) return 'entertainment';

    // Sports venues
    if (
        maki === 'stadium' || maki === 'gym' || maki === 'sports' ||
        ['sport', 'gym', 'fitness', 'yoga', 'stadium', 'arena'].some(k => 
            name.includes(k) || type.includes(k) || category.includes(k)
        )
    ) return 'sports';

    // Cultural venues
    if (
        maki === 'museum' || maki === 'monument' ||
        ['museum', 'gallery', 'art', 'exhibition', 'cultural', 'heritage'].some(k => 
            name.includes(k) || type.includes(k) || category.includes(k)
        )
    ) return 'culture';

    // Food venues
    if (name.includes('veg') || name.includes('vegetarian')) 
        return 'vegetarian';
    if (
        name.includes('cafe') || name.includes('coffee') || 
        type === 'Cafe' || maki === 'cafe'
    ) return 'cafe';
    if (
        class_ === 'food_and_drink' || maki === 'restaurant' ||
        ['restaurant', 'dining', 'bistro', 'eatery'].some(k => 
            name.includes(k) || type.includes(k) || category.includes(k)
        )
    ) return 'restaurant';
    if (maki === 'fast-food') 
        return 'fast_food';
    if (
        maki === 'bar' || 
        ['bar', 'pub', 'club', 'lounge'].some(k => 
            name.includes(k) || type.includes(k) || category.includes(k)
        )
    ) return 'nightlife';

    // Services & Others
    if (
        ['salon', 'spa', 'wellness', 'clinic', 'hospital', 'medical'].some(k => 
            name.includes(k) || type.includes(k) || category.includes(k)
        )
    ) return 'services';

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
                        type: 'Point',
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
