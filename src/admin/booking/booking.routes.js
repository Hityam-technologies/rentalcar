const express = require('express');
const auth = require('../../middlewares/auth.middleware');
const bookingController = require('./booking.controller');

const router = express.Router();

router.get('/', auth('admin'), bookingController.getAllBookings);
router.get('/:id', auth('admin'), bookingController.getBooking);
router.put('/:id/status', auth('admin'), bookingController.updateStatus);

module.exports = router;
