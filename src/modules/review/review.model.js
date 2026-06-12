const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
      required: true,
    },
    car: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Car',
      required: true,
    },
    booking: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Booking',
      required: true,
      unique: true, // one review per booking
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
