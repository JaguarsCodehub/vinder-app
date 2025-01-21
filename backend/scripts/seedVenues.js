const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Venue = require('../models/Venue');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Sample venues data (coordinates will be around Mumbai region)
const sampleVenues = [
    {
        name: "Cafe Coffee Day",
        description: "Popular coffee shop chain with comfortable seating",
        location: {
            type: "Point",
            coordinates: [72.8777, 19.0760] // Longitude, Latitude
        },
        address: {
            street: "High Street Phoenix",
            city: "Mumbai",
            state: "Maharashtra",
            zipCode: "400013"
        },
        category: "cafe",
        images: ["https://example.com/ccd.jpg"],
        operatingHours: {
            monday: { open: "08:00", close: "23:00" },
            tuesday: { open: "08:00", close: "23:00" },
            wednesday: { open: "08:00", close: "23:00" },
            thursday: { open: "08:00", close: "23:00" },
            friday: { open: "08:00", close: "23:00" },
            saturday: { open: "08:00", close: "23:00" },
            sunday: { open: "08:00", close: "23:00" }
        },
        priceRange: "$$",
        rating: 4.2
    },
    {
        name: "Phoenix Marketcity",
        description: "Large shopping mall with entertainment options",
        location: {
            type: "Point",
            coordinates: [72.8847, 19.0867]
        },
        address: {
            street: "LBS Marg, Kurla West",
            city: "Mumbai",
            state: "Maharashtra",
            zipCode: "400070"
        },
        category: "shopping",
        images: ["https://example.com/phoenix.jpg"],
        operatingHours: {
            monday: { open: "11:00", close: "21:30" },
            tuesday: { open: "11:00", close: "21:30" },
            wednesday: { open: "11:00", close: "21:30" },
            thursday: { open: "11:00", close: "21:30" },
            friday: { open: "11:00", close: "21:30" },
            saturday: { open: "11:00", close: "22:00" },
            sunday: { open: "11:00", close: "22:00" }
        },
        priceRange: "$$$",
        rating: 4.5
    },
    {
        name: "PVR Cinemas",
        description: "Multiplex cinema showing latest movies",
        location: {
            type: "Point",
            coordinates: [72.8697, 19.0821]
        },
        address: {
            street: "Lower Parel",
            city: "Mumbai",
            state: "Maharashtra",
            zipCode: "400013"
        },
        category: "movie_theater",
        images: ["https://example.com/pvr.jpg"],
        operatingHours: {
            monday: { open: "09:00", close: "01:00" },
            tuesday: { open: "09:00", close: "01:00" },
            wednesday: { open: "09:00", close: "01:00" },
            thursday: { open: "09:00", close: "01:00" },
            friday: { open: "09:00", close: "01:00" },
            saturday: { open: "09:00", close: "01:00" },
            sunday: { open: "09:00", close: "01:00" }
        },
        priceRange: "$$",
        rating: 4.3
    },
    {
        name: "Smaaash",
        description: "Indoor entertainment and gaming arena",
        location: {
            type: "Point",
            coordinates: [72.8712, 19.0763]
        },
        address: {
            street: "Kamala Mills",
            city: "Mumbai",
            state: "Maharashtra",
            zipCode: "400013"
        },
        category: "entertainment",
        images: ["https://example.com/smaaash.jpg"],
        operatingHours: {
            monday: { open: "12:00", close: "22:00" },
            tuesday: { open: "12:00", close: "22:00" },
            wednesday: { open: "12:00", close: "22:00" },
            thursday: { open: "12:00", close: "22:00" },
            friday: { open: "12:00", close: "23:00" },
            saturday: { open: "12:00", close: "23:00" },
            sunday: { open: "12:00", close: "23:00" }
        },
        priceRange: "$$$",
        rating: 4.1
    }
];

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => {
        console.error('MongoDB Connection Error:', err);
        process.exit(1);
    });

// Function to seed venues
async function seedVenues() {
    try {
        // Clear existing venues
        await Venue.deleteMany({});
        console.log('Cleared existing venues');

        // Insert new venues
        const venues = await Venue.insertMany(sampleVenues);
        console.log(`Added ${venues.length} sample venues`);

        // Create 2dsphere index
        await Venue.collection.createIndex({ location: "2dsphere" });
        console.log('Created 2dsphere index for location field');

        console.log('Seeding completed successfully');
    } catch (error) {
        console.error('Error seeding venues:', error);
    } finally {
        mongoose.disconnect();
    }
}

// Run the seeding
seedVenues();
