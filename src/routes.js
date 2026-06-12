const express = require('express');
const authRoute = require('./modules/auth/auth.routes');
const userRoute = require('./modules/user/user.routes');
const adminRoute = require('./modules/admin/admin.routes');
const carRoute = require('./modules/car/car.routes');
const bookingRoute = require('./modules/booking/booking.routes');
const paymentRoute = require('./modules/payment/payment.routes');
const reviewRoute = require('./modules/review/review.routes');
const aiRoute = require('./modules/ai/ai.routes');

const router = express.Router();

const defaultRoutes = [
  { path: '/auth', route: authRoute },
  { path: '/users', route: userRoute },
  { path: '/admin/cars', route: carRoute },
  { path: '/admin', route: adminRoute },
  { path: '/cars', route: carRoute },
  { path: '/user/cars', route: carRoute }, // Aliased for /api/user/cars
  { path: '/bookings', route: bookingRoute },
  { path: '/payments', route: paymentRoute },
  { path: '/reviews', route: reviewRoute },
  { path: '/ai', route: aiRoute },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

module.exports = router;
