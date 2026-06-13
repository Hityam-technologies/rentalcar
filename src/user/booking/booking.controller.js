const httpStatus = require('http-status').default;
const catchAsync = require('../../utils/catchAsync');
const bookingService = require('./booking.service');

const createBooking = catchAsync(async (req, res) => {
  const booking = await bookingService.createBooking(req.user._id, req.body);
  res.status(httpStatus.CREATED).send(booking);
});

const getMyBookings = catchAsync(async (req, res) => {
  const bookings = await bookingService.getUserBookings(req.user._id);
  res.send({ results: bookings.length, data: bookings });
});

const getMyTrips = catchAsync(async (req, res) => {
  const bookings = await bookingService.getUserBookings(req.user._id);
  res.send({ results: bookings.length, data: bookings });
});

const getBooking = catchAsync(async (req, res) => {
  const booking = await bookingService.getBookingById(req.params.id || req.params.bookingId, req.user._id);
  res.send(booking);
});

const cancelBooking = catchAsync(async (req, res) => {
  const booking = await bookingService.cancelBooking(req.params.bookingId, req.user._id, req.user.role);
  res.send(booking);
});

module.exports = { createBooking, getMyBookings, getMyTrips, getBooking, cancelBooking };
