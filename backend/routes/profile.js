// Profile Routes
router.get('/profile/:userId', profileController.getProfile);        // Get user profile
router.put('/profile/:userId', profileController.updateProfile);     // Update profile
router.post('/profile/upload-photo', profileController.uploadPhoto); // Upload profile photo
router.delete('/profile/:userId', profileController.deleteProfile);  // Delete profile 