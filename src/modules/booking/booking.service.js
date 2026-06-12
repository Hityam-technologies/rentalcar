const mongoose = require('mongoose');
const httpStatus = require('http-status').default;
const Booking = require('./booking.model');
const Car = require('../car/car.model');
const ApiError = require('../../utils/ApiError');
const { calculateTotalRentalPrice } = require('../../utils/pricing.util');

const checkAvailability = async (carId, startDate, endDate) => {
  // Find any bookings for this car that overlap with the requested dates and are not cancelled
  const overlappingBookings = await Booking.find({
    car: carId,
    status: { $ne: 'cancelled' },
    $and: [
      { startDate: { $lte: endDate } },
      { endDate: { $gte: startDate } }
    ]
  });
  
  return overlappingBookings.length === 0;
};

const createBooking = async (userId, bookingBody) => {
  const { carId, startDate, endDate } = bookingBody;

  const reqStartDate = new Date(startDate);
  const reqEndDate = new Date(endDate);

  if (reqStartDate >= reqEndDate) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'End date must be after start date');
  }

  // Start a session for the transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Check if car exists and is available
    const car = await Car.findById(carId).session(session);
    if (!car) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Car not found');
    }

    if (!car.isAvailable) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Car is currently marked as unavailable');
    }

    // Check overlapping bookings
    // We search for overlapping bookings within the transaction session
    const overlappingBookings = await Booking.find({
      car: carId,
      status: { $ne: 'cancelled' },
      $and: [
        { startDate: { $lte: reqEndDate } },
        { endDate: { $gte: reqStartDate } }
      ]
    }).session(session);

    if (overlappingBookings.length > 0) {
      throw new ApiError(httpStatus.CONFLICT, 'Car is already booked for the specified dates');
    }

    // Calculate total price
    const totalPrice = calculateTotalRentalPrice(car.pricePerDay, reqStartDate, reqEndDate);

    const booking = await Booking.create([{
      user: userId,
      car: carId,
      startDate: reqStartDate,
      endDate: reqEndDate,
      totalPrice: totalPrice,
      status: 'pending',
      paymentStatus: 'pending'
    }], { session });

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    return booking[0];
  } catch (error) {
    // If anything fails, abort the transaction
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const getUserBookings = async (userId) => {
  return Booking.find({ user: userId }).populate('car');
};

const getAllBookings = async () => {
  return Booking.find().populate('user').populate('car');
};

const getBookingById = async (id) => {
  return Booking.findById(id).populate('car');
};

const cancelBooking = async (bookingId, userId, userRole) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found');
  }

  // Only the user who made the booking or an admin can cancel it
  if (booking.user.toString() !== userId.toString() && userRole !== 'admin') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Not authorized to cancel this booking');
  }

  if (booking.status === 'cancelled') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Booking is already cancelled');
  }

  booking.status = 'cancelled';
  await booking.save();
  return booking;
};

module.exports = {
  createBooking,
  getUserBookings,
  getAllBookings,
  getBookingById,
  cancelBooking,
};
