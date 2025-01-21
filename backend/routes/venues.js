const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const venueController = require('../controllers/venueController');

// Public route - no auth required
router.get('/nearby', venueController.getNearbyVenues);

// Protected routes - auth required
router.get('/recommended', auth, venueController.getRecommendedVenues);
router.get('/:id', venueController.getVenueDetails);
router.post('/:id/reviews', auth, venueController.addReview);

module.exports = router;
