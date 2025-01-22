const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Venue = require('../models/Venue');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');

// Get available time slots for a venue on a specific date
router.get('/venues/:venueId/time-slots', auth, async (req, res) => {
    try {
        const { venueId } = req.params;
        const { date } = req.query;

        if (!date) {
            return res.status(400).json({ message: 'Date parameter is required' });
        }

        console.log('Looking up venue:', venueId);
        let venue;
        
        try {
            // First try to find by ObjectId
            if (mongoose.Types.ObjectId.isValid(venueId)) {
                venue = await Venue.findById(venueId);
                console.log('Tried ObjectId lookup:', venue ? 'found' : 'not found');
            }
            
            // If not found or invalid ObjectId, try finding by string ID
            if (!venue) {
                venue = await Venue.findOne({ _id: venueId });
                console.log('Tried string ID lookup:', venue ? 'found' : 'not found');
            }
        } catch (err) {
            console.error('Error finding venue:', err);
            return res.status(500).json({ message: 'Error finding venue' });
        }

        if (!venue) {
            console.log('Venue not found:', venueId);
            return res.status(404).json({ message: 'Venue not found' });
        }

        // Parse the date and set it to midnight for proper date comparison
        const bookingDate = new Date(date);
        bookingDate.setHours(0, 0, 0, 0);
        const nextDay = new Date(bookingDate);
        nextDay.setDate(nextDay.getDate() + 1);

        console.log('Searching for bookings between:', bookingDate, 'and', nextDay);

        // Get existing bookings for the date
        const existingBookings = await Booking.find({
            venue: venue._id,
            date: {
                $gte: bookingDate,
                $lt: nextDay
            },
            status: 'confirmed'
        });

        console.log('Found existing bookings:', existingBookings.length);

        // Generate time slots from 10 AM to 9 PM
        const timeSlots = [];
        for (let hour = 10; hour < 21; hour++) {
            const startTime = `${hour.toString().padStart(2, '0')}:00`;
            const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
            
            // Check if slot is already booked
            const isBooked = existingBookings.some(booking => 
                booking.timeSlot.start === startTime && 
                booking.timeSlot.end === endTime
            );

            if (!isBooked) {
                timeSlots.push({
                    start: startTime,
                    end: endTime
                });
            }
        }

        console.log('Returning available time slots:', timeSlots.length);
        res.json(timeSlots);
    } catch (error) {
        console.error('Error in time slots:', error);
        res.status(500).json({ message: error.message });
    }
});

// Create a new booking
router.post('/', auth, async (req, res) => {
    try {
        const { venueId, date, timeSlot, price } = req.body;

        const booking = new Booking({
            venue: venueId,
            user: req.user.userId,
            date: new Date(date),
            timeSlot,
            price
        });

        const savedBooking = await booking.save();
        res.status(201).json(savedBooking);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Get user's bookings
router.get('/my-bookings', auth, async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.user.userId })
            .populate('venue')
            .sort({ createdAt: -1 });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update booking status
router.patch('/:id/status', auth, async (req, res) => {
    try {
        const { status } = req.body;
        const booking = await Booking.findById(req.params.id);
        
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        if (booking.user.toString() !== req.user.userId) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        booking.status = status;
        const updatedBooking = await booking.save();
        res.json(updatedBooking);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;
