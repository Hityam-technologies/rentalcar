const httpStatus = require('http-status').default;
const moment = require('moment');
const config = require('../../config/env');
const User = require('../../shared/models/user.model');
const OTP = require('../../shared/models/otp.model');
const Token = require('../../shared/models/token.model');
const ApiError = require('../../utils/ApiError');
const { generateOTP, hashOTP, verifyOTP } = require('../../utils/otp.util');
const { generateToken, verifyToken } = require('../../utils/jwt.util');

const loginUserWithEmailAndPassword = async (email, password) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.isPasswordMatch(password))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
  }
  return user;
};

const sendOTP = async (phone, type) => {
  const existingOtp = await OTP.findOne({ phone, type });
  if (existingOtp) {
    const cooldownMinutes = config.otp.cooldownMinutes;
    if (moment().diff(moment(existingOtp.lastResentAt), 'minutes') < cooldownMinutes) {
      throw new ApiError(httpStatus.TOO_MANY_REQUESTS, `Please wait ${cooldownMinutes} minute before requesting another OTP`);
    }
  }

  const otp = generateOTP();
  const hashedOtp = await hashOTP(otp);
  const expiresAt = moment().add(config.otp.expiryMinutes, 'minutes').toDate();

  await OTP.findOneAndUpdate(
    { phone, type },
    { otp: hashedOtp, expiresAt, attempts: 0, lastResentAt: new Date() },
    { upsert: true, new: true }
  );

  console.log(`[OTP] Sent ${otp} to ${phone} for ${type}`);
  return otp;
};

const verifyOTPService = async (phone, otp, type) => {
  const otpDoc = await OTP.findOne({ phone, type });
  if (!otpDoc) throw new ApiError(httpStatus.NOT_FOUND, 'OTP not found or expired');
  if (moment().isAfter(otpDoc.expiresAt)) throw new ApiError(httpStatus.BAD_REQUEST, 'OTP expired');
  if (otpDoc.attempts >= config.otp.maxAttempts) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Max attempts reached. Please request a new OTP.');
  }

  const isValid = await verifyOTP(otp, otpDoc.otp);
  if (!isValid) {
    otpDoc.attempts += 1;
    await otpDoc.save();
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid OTP');
  }

  await OTP.deleteOne({ _id: otpDoc._id });
  return true;
};

const sendForgotPasswordOtp = async (phone) => {
  const user = await User.findOne({ phone });
  if (user) {
    await sendOTP(phone, 'password_reset');
  }
  return {
    message: 'If an account exists with this phone number, a password reset OTP has been sent.',
  };
};

const resetPasswordWithOtp = async (phone, otp, newPassword) => {
  await verifyOTPService(phone, otp, 'password_reset');
  const user = await User.findOne({ phone }).select('+password');
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  user.password = newPassword;
  await user.save();
  return user;
};

const saveToken = async (token, userId, expires, type, blacklisted = false) => {
  const tokenDoc = await Token.create({
    token,
    user: userId,
    expires: expires.toDate(),
    type,
    blacklisted,
  });
  return tokenDoc;
};

const generateAuthTokens = async (user) => {
  const { access, refresh } = config.jwt;
  const accessTokenExpires = moment().add(access.amount, access.unit);
  const accessToken = generateToken(user.id, accessTokenExpires.toDate(), 'access');
  const refreshTokenExpires = moment().add(refresh.amount, refresh.unit);
  const refreshToken = generateToken(user.id, refreshTokenExpires.toDate(), 'refresh', config.jwt.refreshSecret);

  await saveToken(refreshToken, user.id, refreshTokenExpires, 'refresh');

  return {
    access: { token: accessToken, expires: accessTokenExpires.toDate() },
    refresh: { token: refreshToken, expires: refreshTokenExpires.toDate() },
  };
};

const refreshAuthTokens = async (refreshToken) => {
  try {
    const refreshTokenDoc = await verifyToken(refreshToken, 'refresh', config.jwt.refreshSecret);
    const user = await User.findById(refreshTokenDoc.sub);
    if (!user) {
      throw new Error();
    }
    const tokenDoc = await Token.findOne({ token: refreshToken, type: 'refresh', user: user.id, blacklisted: false });
    if (!tokenDoc) {
      throw new Error();
    }
    await Token.deleteOne({ _id: tokenDoc._id });
    return generateAuthTokens(user);
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
  }
};

const logout = async (refreshToken) => {
  const refreshTokenDoc = await Token.findOne({ token: refreshToken, type: 'refresh', blacklisted: false });
  if (!refreshTokenDoc) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Not found');
  }
  await Token.deleteOne({ _id: refreshTokenDoc._id });
};

module.exports = {
  loginUserWithEmailAndPassword,
  sendOTP,
  verifyOTPService,
  sendForgotPasswordOtp,
  resetPasswordWithOtp,
  generateAuthTokens,
  refreshAuthTokens,
  logout,
};
