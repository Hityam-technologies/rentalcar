const httpStatus = require('http-status').default;
const catchAsync = require('../../utils/catchAsync');
const reviewService = require('./review.service');

const createReview = catchAsync(async (req, res) => {
  const review = await reviewService.createReview(req.user._id, req.body);
  res.status(httpStatus.CREATED).send(review);
});

const getCarReviews = catchAsync(async (req, res) => {
  const reviews = await reviewService.getCarReviews(req.params.carId);
  res.send({ results: reviews.length, data: reviews });
});

module.exports = {
  createReview,
  getCarReviews,
};
