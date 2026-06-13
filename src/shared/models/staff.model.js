const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    role: { type: String, enum: ['Fleet Manager', 'Mechanic', 'Driver', 'Admin'], default: 'Fleet Manager' },
    phone: { type: String, required: true, trim: true },
    joinedDate: { type: Date, default: Date.now },
    status: { type: String, enum: ['Active', 'On Leave', 'Inactive'], default: 'Active' },
    salary: { type: Number, default: 0 },
    pendingPayout: { type: Number, default: 0 },
    overview: { type: String, default: '' },
    logs: [
      {
        date: { type: Date, default: Date.now },
        type: { type: String, default: 'Payout' },
        amount: { type: Number, default: 0 },
        status: { type: String, default: 'Completed' },
      },
    ],
  },
  { timestamps: true }
);

const Staff = mongoose.model('Staff', staffSchema);
module.exports = Staff;
