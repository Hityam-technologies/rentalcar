const express = require('express');
const auth = require('../../middlewares/auth.middleware');
const reviewController = require('./review.controller');

const router = express.Router();

router.post('/', auth(), reviewController.createReview);
router.get('/car/:carId', reviewController.getCarReviews);

module.exports = router;
