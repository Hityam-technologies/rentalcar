const mongoose = require('mongoose');

const specialOfferSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    subtitle: { type: String, default: '' },
    gradient: { type: [String], default: ['#4F46E5', '#7C3AED'] },
    tag: { type: String, default: '' },
    icon: { type: String, default: 'car' },
    accentColor: { type: String, default: '#4F46E5' },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const SpecialOffer = mongoose.model('SpecialOffer', specialOfferSchema);
module.exports = SpecialOffer;
