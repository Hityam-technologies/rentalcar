const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    car: { type: mongoose.SchemaTypes.ObjectId, ref: 'Car', required: true },
    type: { type: String, enum: ['Registration', 'Insurance', 'PUC'], required: true },
    documentUrl: { type: String, required: true },
    expiryDate: { type: Date },
    status: { type: String, enum: ['Valid', 'Expired', 'Rejected'], default: 'Valid' },
  },
  { timestamps: true }
);

const CarDocument = mongoose.model('CarDocument', documentSchema);
module.exports = CarDocument;
