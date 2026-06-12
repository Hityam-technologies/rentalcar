const httpStatus = require('http-status').default;
const Review = require('./review.model');
const Booking = require('../booking/booking.model');
const ApiError = require('../../utils/ApiError');

const createReview = async (userId, body) => {
  const { carId, bookingId, rating, comment } = body;

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found');
  }

  if (booking.user.toString() !== userId.toString()) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Not authorized to review this booking');
  }

  if (booking.car.toString() !== carId.toString()) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Car does not match the booking');
  }

  if (booking.status !== 'completed') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'You can only review a completed booking');
  }

  // Check if review already exists
  const existingReview = await Review.findOne({ booking: bookingId });
  if (existingReview) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Review already exists for this booking');
  }

  const review = await Review.create({
    user: userId,
    car: carId,
    booking: bookingId,
    rating,
    comment,
  });

  return review;
};

const getCarReviews = async (carId) => {
  return Review.find({ car: carId }).populate('user', 'firstName lastName');
};

module.exports = {
  createReview,
  getCarReviews,
};
