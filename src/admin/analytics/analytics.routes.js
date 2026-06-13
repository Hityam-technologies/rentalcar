const express = require('express');
const auth = require('../../middlewares/auth.middleware');
const analyticsController = require('./analytics.controller');

const router = express.Router();

router.get('/users', auth('admin'), analyticsController.getAllUsers);
router.get('/analytics/revenue', auth('admin'), analyticsController.getRevenueAnalytics);
router.get('/analytics/bookings', auth('admin'), analyticsController.getBookingAnalytics);
router.get('/analytics/users', auth('admin'), analyticsController.getUserAnalytics);

module.exports = router;
