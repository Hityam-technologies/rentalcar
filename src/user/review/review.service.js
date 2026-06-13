const httpStatus = require('http-status').default;
const Review = require('../../shared/models/review.model');
const Car = require('../../shared/models/car.model');
const ApiError = require('../../utils/ApiError');

const createReview = async (userId, body) => {
  const { carId, bookingId, rating, comment } = body;
  const review = await Review.create({ user: userId, car: carId, booking: bookingId, rating, comment });

  const stats = await Review.aggregate([
    { $match: { car: review.car } },
    { $group: { _id: '$car', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  if (stats[0]) {
    await Car.findByIdAndUpdate(carId, { rating: stats[0].avgRating, reviewCount: stats[0].count });
  }
  return review;
};

const getCarReviews = async (carId) => Review.find({ car: carId }).populate('user', 'name avatarUrl');

module.exports = { createReview, getCarReviews };
