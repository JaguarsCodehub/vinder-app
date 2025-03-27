const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from parent directory
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path} - Body:`, req.body);
    next();
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('MongoDB Connected'))
.catch(err => console.log('MongoDB Connection Error:', err));

// Test route
app.get('/', (req, res) => {
    res.send('Vinder API is running');
});

// Import and use routes
const authRoutes = require('../routes/auth');
const preferencesRoutes = require('../routes/preferences');
const venuesRoutes = require('../routes/venues');
const bookingRoutes = require('../routes/bookings');

app.use('/api/auth', authRoutes);
app.use('/api/preferences', preferencesRoutes); // Updated mount path
app.use('/api/venues', venuesRoutes);
app.use('/api/bookings', bookingRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ 
        message: 'Something broke!', 
        error: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

// Export the Express API
module.exports = app;