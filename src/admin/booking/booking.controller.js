const catchAsync = require('../../utils/catchAsync');
const bookingService = require('./booking.service');

const getAllBookings = catchAsync(async (req, res) => {
  const bookings = await bookingService.getAllBookings(req.query);
  res.send({ results: bookings.length, data: bookings });
});

const getBooking = catchAsync(async (req, res) => {
  const booking = await bookingService.getBookingById(req.params.id || req.params.bookingId);
  res.send(booking);
});

const updateStatus = catchAsync(async (req, res) => {
  const { status, action } = req.body;
  const booking = await bookingService.updateBookingStatus(req.params.id || req.params.bookingId, status, action);
  res.send(booking);
});

module.exports = { getAllBookings, getBooking, updateStatus };
