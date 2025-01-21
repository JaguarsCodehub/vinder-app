const mongoose = require('mongoose');

const venueSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            required: true,
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: true,
        }
    },
    address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
    },
    category: {
        type: String,
        required: true,
        enum: ['restaurant', 'park', 'arcade', 'movie_theater', 'cafe', 'shopping', 'entertainment']
    },
    images: [{
        type: String, // URLs to venue images
    }],
    operatingHours: {
        monday: { open: String, close: String },
        tuesday: { open: String, close: String },
        wednesday: { open: String, close: String },
        thursday: { open: String, close: String },
        friday: { open: String, close: String },
        saturday: { open: String, close: String },
        sunday: { open: String, close: String }
    },
    priceRange: {
        type: String,
        enum: ['$', '$$', '$$$', '$$$$'],
    },
    rating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0
    },
    reviews: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        rating: Number,
        comment: String,
        date: {
            type: Date,
            default: Date.now
        }
    }],
    amenities: [String],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Create a 2dsphere index for location-based queries
venueSchema.index({ location: '2dsphere' });

const Venue = mongoose.model('Venue', venueSchema);

module.exports = Venue;
