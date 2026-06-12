const httpStatus = require('http-status').default; // I should install http-status
const userService = require('../user/user.service');
const OTP = require('./otp.model');
const User = require('../user/user.model');
const ApiError = require('../../utils/ApiError');
const { generateOTP, hashOTP, verifyOTP } = require('../../utils/otp.util');
const { generateToken } = require('../../utils/jwt.util');
const moment = require('moment');

/**
 * Login with username and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<User>}
 */
const loginUserWithEmailAndPassword = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user || !(await user.isPasswordMatch(password))) {
    throw new ApiError(401, 'Incorrect email or password');
  }
  return user;
};

/**
 * Generate and send OTP
 * @param {string} phone
 * @param {string} type - 'registration' or 'login'
 */
const sendOTP = async (phone, type) => {
  // Check cooldown
  const existingOtp = await OTP.findOne({ phone, type });
  if (existingOtp) {
    const cooldownMinutes = parseInt(process.env.OTP_COOLDOWN_MINUTES || 1);
    if (moment().diff(moment(existingOtp.lastResentAt), 'minutes') < cooldownMinutes) {
      throw new ApiError(429, `Please wait ${cooldownMinutes} minute before requesting another OTP`);
    }
  }

  const otp = generateOTP();
  const hashedOtp = await hashOTP(otp);
  const expiresAt = moment().add(process.env.OTP_EXPIRY_MINUTES || 5, 'minutes').toDate();

  await OTP.findOneAndUpdate(
    { phone, type },
    {
      otp: hashedOtp,
      expiresAt,
      attempts: 0,
      lastResentAt: new Date(),
    },
    { upsate: true, new: true, upsert: true }
  );

  // In production, send SMS here. For now, we log it.
  console.log(`[OTP] Sent ${otp} to ${phone} for ${type}`);
  return otp;
};

/**
 * Verify OTP
 * @param {string} phone
 * @param {string} otp
 * @param {string} type
 */
const verifyOTPService = async (phone, otp, type) => {
  const otpDoc = await OTP.findOne({ phone, type });

  if (!otpDoc) {
    throw new ApiError(404, 'OTP not found or expired');
  }

  if (moment().isAfter(otpDoc.expiresAt)) {
    throw new ApiError(400, 'OTP expired');
  }

  if (otpDoc.attempts >= (process.env.OTP_MAX_ATTEMPTS || 5)) {
    throw new ApiError(400, 'Max attempts reached. Please request a new OTP.');
  }

  const isValid = await verifyOTP(otp, otpDoc.otp);
  if (!isValid) {
    otpDoc.attempts += 1;
    await otpDoc.save();
    throw new ApiError(400, 'Invalid OTP');
  }

  // OTP verified, delete it
  await OTP.deleteOne({ _id: otpDoc._id });
  return true;
};

/**
 * Generate auth tokens
 * @param {User} user
 * @returns {Promise<Object>}
 */
const generateAuthTokens = async (user) => {
  const accessTokenExpires = moment().add(15, 'minutes'); // Use env if available
  const accessToken = generateToken(user.id, accessTokenExpires.toDate(), 'access');

  const refreshTokenExpires = moment().add(7, 'days');
  const refreshToken = generateToken(user.id, refreshTokenExpires.toDate(), 'refresh', process.env.JWT_REFRESH_SECRET);

  return {
    access: {
      token: accessToken,
      expires: accessTokenExpires.toDate(),
    },
    refresh: {
      token: refreshToken,
      expires: refreshTokenExpires.toDate(),
    },
  };
};

module.exports = {
  loginUserWithEmailAndPassword,
  sendOTP,
  verifyOTPService,
  generateAuthTokens,
};
