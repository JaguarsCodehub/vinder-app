// Matching Routes
router.get('/potential-matches', matchController.getPotentialMatches);  // Get potential matches
router.post('/swipe/:userId', matchController.handleSwipe);            // Handle swipe (left/right)
router.get('/matches', matchController.getMatches);                    // Get all matches
router.delete('/unmatch/:matchId', matchController.unmatch);           // Unmatch with user 