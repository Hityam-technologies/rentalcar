const httpStatus = require('http-status').default;
const Booking = require('../../shared/models/booking.model');
const Car = require('../../shared/models/car.model');
const ApiError = require('../../utils/ApiError');
const { calculateTotalRentalPrice } = require('../../utils/pricing.util');
const { formatBookingForUser } = require('../../shared/utils/carFormatter.util');

const computeFinancials = (baseRate) => {
  const insurance = Math.round(baseRate * 0.1);
  const tax = Math.round((baseRate + insurance) * 0.08);
  const total = baseRate + insurance + tax;
  return { baseRate, insurance, tax, deposit: 500, total };
};

const createBooking = async (userId, bookingBody) => {
  const { carId, startDate, endDate, pickupLocation, dropoffLocation } = bookingBody;
  const reqStartDate = new Date(startDate);
  const reqEndDate = new Date(endDate);

  if (reqStartDate >= reqEndDate) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'End date must be after start date');
  }

  const car = await Car.findById(carId);
  if (!car) throw new ApiError(httpStatus.NOT_FOUND, 'Car not found');
  if (!car.isAvailable) throw new ApiError(httpStatus.BAD_REQUEST, 'Car is currently marked as unavailable');

  const overlapping = await Booking.find({
    car: carId,
    status: { $nin: ['cancelled', 'declined'] },
    $and: [{ startDate: { $lte: reqEndDate } }, { endDate: { $gte: reqStartDate } }],
  });

  if (overlapping.length > 0) {
    throw new ApiError(httpStatus.CONFLICT, 'Car is already booked for the specified dates');
  }

  const baseRate = calculateTotalRentalPrice(car.pricePerDay, reqStartDate, reqEndDate);
  const financials = computeFinancials(baseRate);

  const booking = await Booking.create({
    user: userId,
    car: carId,
    host: car.owner,
    startDate: reqStartDate,
    endDate: reqEndDate,
    pickupLocation: pickupLocation || car.locationLabel || '',
    dropoffLocation: dropoffLocation || pickupLocation || car.locationLabel || '',
    totalPrice: financials.total,
    financials,
    status: 'pending',
    paymentStatus: 'pending',
  });

  return booking;
};

const getUserBookings = async (userId) => {
  const bookings = await Booking.find({ user: userId }).populate('car').sort({ createdAt: -1 });
  return bookings.map(formatBookingForUser);
};

const getBookingById = async (bookingId, userId) => {
  const booking = await Booking.findById(bookingId).populate('car');
  if (!booking) throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found');
  if (booking.user.toString() !== userId.toString()) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Not authorized to view this booking');
  }
  return formatBookingForUser(booking);
};

const cancelBooking = async (bookingId, userId, userRole) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found');
  if (booking.user.toString() !== userId.toString() && userRole !== 'admin') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Not authorized to cancel this booking');
  }
  if (booking.status === 'cancelled') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Booking is already cancelled');
  }
  booking.status = 'cancelled';
  await booking.save();
  return formatBookingForUser(await booking.populate('car'));
};

module.exports = { createBooking, getUserBookings, getBookingById, cancelBooking };
