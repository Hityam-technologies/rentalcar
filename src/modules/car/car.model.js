const mongoose = require('mongoose');

const carSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    brand: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      trim: true,
    },
    pricePerDay: {
      type: Number,
      required: true,
      min: 0,
    },
    fuelType: {
      type: String,
      required: true,
      trim: true,
    },
    transmission: {
      type: String,
      required: true,
      trim: true,
    },
    seatingCapacity: {
      type: Number,
      required: true,
      min: 1,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    images: {
      type: [String],
      required: true,
      validate: {
        validator: function (v) {
          return v && v.length > 0;
        },
        message: 'A car must have at least one image.',
      },
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    spinImages: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// geospatial index for $near queries
carSchema.index({ location: '2dsphere' });

const Car = mongoose.model('Car', carSchema);

module.exports = Car;
