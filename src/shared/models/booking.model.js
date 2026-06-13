const mongoose = require('mongoose');

const financialsSchema = {
  baseRate: { type: Number, default: 0 },
  insurance: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  deposit: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
};

const bookingSchema = new mongoose.Schema(
  {
    bookingId: { type: String, unique: true, sparse: true },
    user: { type: mongoose.SchemaTypes.ObjectId, ref: 'User', required: true },
    car: { type: mongoose.SchemaTypes.ObjectId, ref: 'Car', required: true },
    host: { type: mongoose.SchemaTypes.ObjectId, ref: 'User' },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    durationDays: { type: Number, default: 1 },
    pickupLocation: { type: String, default: '' },
    dropoffLocation: { type: String, default: '' },
    totalPrice: { type: Number, required: true },
    financials: financialsSchema,
    status: {
      type: String,
      enum: ['pending', 'approved', 'current', 'confirmed', 'completed', 'cancelled', 'declined'],
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    aiRiskTier: { type: String, default: 'Low Risk · Tier 1' },
    aiUtilizationInsight: { type: String, default: '' },
  },
  { timestamps: true }
);

bookingSchema.pre('save', function () {
  if (!this.bookingId) {
    this.bookingId = `#B${Math.floor(1000 + Math.random() * 9000)}`;
  }
  if (this.startDate && this.endDate) {
    const ms = this.endDate - this.startDate;
    this.durationDays = Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)));
  }
  if (!this.financials.total && this.totalPrice) {
    this.financials.total = this.totalPrice;
  }
});

const Booking = mongoose.model('Booking', bookingSchema);
module.exports = Booking;
