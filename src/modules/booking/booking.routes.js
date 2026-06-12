const express = require('express');
const auth = require('../../middlewares/auth.middleware');
const bookingController = require('./booking.controller');

const router = express.Router();

// User routes
router.post('/', auth(), bookingController.createBooking);
router.get('/me', auth(), bookingController.getMyBookings);
router.post('/:bookingId/cancel', auth(), bookingController.cancelBooking); // user or admin can cancel

// Admin routes
router.get('/', auth('admin'), bookingController.getAllBookings);

module.exports = router;
