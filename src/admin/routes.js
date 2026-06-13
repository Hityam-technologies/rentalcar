const express = require('express');
const dashboardRoute = require('./dashboard/dashboard.routes');
const carRoute = require('./car/car.routes');
const bookingRoute = require('./booking/booking.routes');
const peopleRoute = require('./people/people.routes');
const revenueRoute = require('./revenue/revenue.routes');
const aiRoute = require('./ai/ai.routes');
const analyticsRoute = require('./analytics/analytics.routes');

const router = express.Router();

router.use('/dashboard', dashboardRoute);
router.use('/cars', carRoute);
router.use('/bookings', bookingRoute);
router.use('/', peopleRoute);
router.use('/revenue', revenueRoute);
router.use('/ai', aiRoute);
router.use('/', analyticsRoute);

module.exports = router;
