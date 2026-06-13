const express = require('express');
const authRoute = require('./auth/auth.routes');
const profileRoute = require('./profile/profile.routes');
const homeRoute = require('./home/home.routes');
const carRoute = require('./car/car.routes');
const bookingRoute = require('./booking/booking.routes');
const hostRoute = require('./host/host.routes');
const paymentRoute = require('./payment/payment.routes');
const reviewRoute = require('./review/review.routes');
const aiRoute = require('./ai/ai.routes');
const viewer360Route = require('./viewer360/viewer360.routes');

const router = express.Router();

router.use('/auth', authRoute);
router.use('/users', profileRoute);
router.use('/home', homeRoute);
router.use('/cars', carRoute);
router.use('/user/cars', carRoute);
router.use('/bookings', bookingRoute);
router.use('/host', hostRoute);
router.use('/payments', paymentRoute);
router.use('/reviews', reviewRoute);
router.use('/ai', aiRoute);
router.use('/user/viewer360', viewer360Route);
router.use('/viewer360', viewer360Route);

module.exports = router;
