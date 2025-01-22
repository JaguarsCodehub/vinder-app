const express = require('express');
const router = express.Router();
const UserPreference = require('../models/UserPreference');
const auth = require('../middleware/auth');

// Get user preferences - Protected route
router.get('/preferences', auth, async (req, res) => {
    try {
        console.log('Fetching preferences for user ID:', req.user.userId);
        const preferences = await UserPreference.findOne({ user: req.user.userId })
            .sort({ createdAt: -1 });
        console.log('Retrieved preferences:', preferences);
        res.status(200).json({
            success: true,
            data: preferences || null
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// Save user preferences - Protected route
router.post('/preferences', auth, async (req, res) => {
    try {
        const { locationPreference, foodPreference, budgetRange } = req.body;
        
        const preference = new UserPreference({
            user: req.user.userId,
            locationPreference,
            foodPreference,
            budgetRange
        });

        const savedPreference = await preference.save();
        res.status(201).json({
            success: true,
            data: savedPreference
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// Get recommendations based on preferences - Protected route
router.get('/recommendations/:preferenceId', auth, async (req, res) => {
    try {
        const preference = await UserPreference.findById(req.params.preferenceId);
        if (!preference) {
            return res.status(404).json({
                success: false,
                error: 'Preferences not found'
            });
        }

        // Here you can add logic to fetch recommendations based on preferences
        // For now, returning a mock response
        const recommendations = {
            city: ['Restaurant Row', 'Central Park', 'Times Square', 'Museums'],
            beach: ['Seafood Shacks', 'Beach Cafes', 'Sunset Points', 'Water Sports'],
            mountains: ['Mountain Lodges', 'Hiking Trails', 'Scenic Points', 'Local Cuisine'],
            countryside: ['Farm Stays', 'Local Markets', 'Wineries', 'Nature Trails']
        };

        res.status(200).json({
            success: true,
            data: recommendations[preference.locationPreference] || []
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
