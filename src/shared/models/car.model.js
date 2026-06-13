const mongoose = require('mongoose');

const carSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.SchemaTypes.ObjectId, ref: 'User' },
    name: { type: String, required: true, trim: true },
    subtitle: { type: String, default: '', trim: true },
    brand: { type: String, required: true, trim: true },
    type: { type: String, required: true, trim: true },
    category: { type: String, default: '', trim: true },
    bodyType: { type: String, default: '', trim: true },
    status: {
      type: String,
      enum: ['Available', 'On Trip', 'In Service', 'Pending Approval'],
      default: 'Available',
    },
    rating: { type: Number, default: 4.5, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    images: { type: [String], default: [] },
    view360Url: { type: String, default: '' },
    spinImages: { type: [String], default: [] },
    location: {
      type: { type: String, enum: ['Point'] },
      coordinates: { type: [Number] },
    },
    locationLabel: { type: String, default: '' },
    pricePerDay: { type: Number, required: true, min: 0 },
    fuelType: { type: String, default: 'Petrol', trim: true },
    transmission: { type: String, default: 'Automatic', trim: true },
    seatingCapacity: { type: Number, default: 5, min: 1 },
    specs: {
      transmission: { type: String, default: '' },
      fuel: { type: String, default: '' },
      fuelLeft: { type: String, default: '' },
      seats: { type: Number, default: 5 },
      topSpeed: { type: String, default: '' },
      acceleration: { type: String, default: '' },
      drivenKm: { type: Number, default: 0 },
    },
    features: { type: [String], default: [] },
    description: { type: String, default: '' },
    plateNumber: { type: String, default: '' },
    aiTip: { type: String, default: '' },
    aiPrediction: {
      level: { type: String, default: 'Medium' },
      tip: { type: String, default: '' },
      colorTheme: { type: String, default: '#4F46E5' },
    },
    isAvailable: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

carSchema.index({ location: '2dsphere' });

carSchema.pre('save', function () {
  if (!this.specs.transmission) this.specs.transmission = this.transmission;
  if (!this.specs.fuel) this.specs.fuel = this.fuelType;
  if (!this.specs.seats) this.specs.seats = this.seatingCapacity;
  if (this.status === 'Available') this.isAvailable = true;
  else if (['On Trip', 'In Service'].includes(this.status)) this.isAvailable = false;
});

const Car = mongoose.model('Car', carSchema);
module.exports = Car;
