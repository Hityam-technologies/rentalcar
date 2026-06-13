const mongoose = require('mongoose');

const otpSchema = mongoose.Schema(
  {
    phone: { type: String, required: true, index: true },
    otp: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    lastResentAt: { type: Date, default: Date.now },
    type: { type: String, enum: ['registration', 'login', 'password_reset'], required: true },
  },
  { timestamps: true }
);

const OTP = mongoose.model('OTP', otpSchema);
module.exports = OTP;
