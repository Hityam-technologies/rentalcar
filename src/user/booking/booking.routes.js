const express = require('express');
const auth = require('../../middlewares/auth.middleware');
const bookingController = require('./booking.controller');
const adminBookingController = require('../../admin/booking/booking.controller');

const router = express.Router();

router.get('/', auth('admin'), adminBookingController.getAllBookings);
router.post('/', auth(), bookingController.createBooking);
router.get('/me', auth(), bookingController.getMyBookings);
router.get('/my-trips', auth(), bookingController.getMyTrips);
router.get('/:id', auth(), bookingController.getBooking);
router.post('/:bookingId/cancel', auth(), bookingController.cancelBooking);

module.exports = router;
