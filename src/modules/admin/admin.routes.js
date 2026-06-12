const express = require('express');
const auth = require('../../middlewares/auth.middleware');
const adminController = require('./admin.controller');

const router = express.Router();

router.get('/users', auth('admin'), adminController.getAllUsers);

// Analytics routes
router.get('/analytics/revenue', auth('admin'), adminController.getRevenueAnalytics);
router.get('/analytics/bookings', auth('admin'), adminController.getBookingAnalytics);
router.get('/analytics/users', auth('admin'), adminController.getUserAnalytics);

module.exports = router;
