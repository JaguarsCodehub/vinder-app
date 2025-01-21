const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

// Authentication Routes
router.post('/register', authController.register);  // Register new user
router.post('/login', authController.login);        // Login user
router.post('/logout', authController.logout);      // Logout user 

module.exports = router;