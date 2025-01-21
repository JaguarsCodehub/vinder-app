const mongoose = require('mongoose');

const userPreferenceSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    locationPreference: {
        type: String,
        required: true,
        enum: ['city', 'beach', 'mountains', 'countryside']
    },
    foodPreference: {
        type: String,
        required: true,
        enum: ['local', 'international', 'vegetarian', 'seafood']
    },
    budgetRange: {
        type: String,
        required: true,
        enum: ['budget', 'moderate', 'luxury', 'all']
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('UserPreference', userPreferenceSchema);
