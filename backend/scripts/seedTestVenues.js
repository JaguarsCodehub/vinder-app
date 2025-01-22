const mongoose = require('mongoose');
const Venue = require('../models/Venue');
require('dotenv').config();

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB Atlas');
}).catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});

// Test venues data
const testVenues = [
    {
        _id: new mongoose.Types.ObjectId(),
        name: "Test Venue 1",
        description: "A test venue for development",
        location: {
            type: "Point",
            coordinates: [72.8777, 19.0759] // Mumbai coordinates
        },
        address: {
            street: "Test Street 1",
            city: "Mumbai",
            state: "Maharashtra",
            zipCode: "400001"
        },
        category: "restaurant",
        rating: 4.5,
        priceRange: "$$"
    },
    {
        _id: new mongoose.Types.ObjectId(),
        name: "Test Venue 2",
        description: "Another test venue",
        location: {
            type: "Point",
            coordinates: [72.8775, 19.0757]
        },
        address: {
            street: "Test Street 2",
            city: "Mumbai",
            state: "Maharashtra",
            zipCode: "400001"
        },
        category: "entertainment",
        rating: 4.0,
        priceRange: "$$$"
    }
];

// Function to seed test venues
async function seedTestVenues() {
    try {
        // Clear existing venues
        await Venue.deleteMany({});
        console.log('Cleared existing venues');

        // Insert test venues
        const venues = await Venue.insertMany(testVenues);
        console.log(`Added ${venues.length} test venues`);
        
        // Log the IDs for reference
        venues.forEach(venue => {
            console.log(`Venue "${venue.name}" created with ID: ${venue._id}`);
        });

        console.log('Seeding completed successfully');
    } catch (error) {
        console.error('Error seeding venues:', error);
    } finally {
        mongoose.disconnect();
    }
}

// Run the seeding
seedTestVenues();
