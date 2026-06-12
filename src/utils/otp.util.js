const crypto = require('crypto');
const bcrypt = require('bcryptjs');

/**
 * Generate a 6-digit OTP
 * @returns {string}
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Hash OTP
 * @param {string} otp
 * @returns {Promise<string>}
 */
const hashOTP = async (otp) => {
  return bcrypt.hash(otp, 8);
};

/**
 * Verify OTP
 * @param {string} otp
 * @param {string} hashedOtp
 * @returns {Promise<boolean>}
 */
const verifyOTP = async (otp, hashedOtp) => {
  return bcrypt.compare(otp, hashedOtp);
};

module.exports = {
  generateOTP,
  hashOTP,
  verifyOTP,
};
