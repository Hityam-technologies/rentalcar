const httpStatus = require('http-status').default;
const catchAsync = require('../../utils/catchAsync');
const ApiError = require('../../utils/ApiError');
const authService = require('./auth.service');
const profileService = require('../profile/profile.service');

const register = catchAsync(async (req, res) => {
  const user = await profileService.createUser({ ...req.body, role: 'user' });
  await authService.sendOTP(user.phone, 'registration');
  res.status(httpStatus.CREATED).send({
    message: 'User registered successfully. Please verify your phone with OTP.',
    userId: user._id,
  });
});

const verifyRegistration = catchAsync(async (req, res) => {
  const { phone, otp } = req.body;
  await authService.verifyOTPService(phone, otp, 'registration');
  const user = await profileService.getUserByPhone(phone);
  user.isPhoneVerified = true;
  await user.save();
  const tokens = await authService.generateAuthTokens(user);
  res.send({ user: profileService.formatProfile(user), tokens });
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const user = await authService.loginUserWithEmailAndPassword(email, password);
  if (!user.isPhoneVerified) throw new ApiError(httpStatus.FORBIDDEN, 'Phone not verified');
  const tokens = await authService.generateAuthTokens(user);
  res.send({ user: profileService.formatProfile(user), tokens });
});

const sendLoginOtp = catchAsync(async (req, res) => {
  const { phone } = req.body;
  const user = await profileService.getUserByPhone(phone);
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User not found with this phone number');
  await authService.sendOTP(phone, 'login');
  res.send({ message: 'OTP sent successfully' });
});

const loginWithOtp = catchAsync(async (req, res) => {
  const { phone, otp } = req.body;
  await authService.verifyOTPService(phone, otp, 'login');
  const user = await profileService.getUserByPhone(phone);
  const tokens = await authService.generateAuthTokens(user);
  res.send({ user: profileService.formatProfile(user), tokens });
});

const sendForgotPasswordOtp = catchAsync(async (req, res) => {
  const result = await authService.sendForgotPasswordOtp(req.body.phone);
  res.send(result);
});

const resetPassword = catchAsync(async (req, res) => {
  const { phone, otp, newPassword } = req.body;
  const user = await authService.resetPasswordWithOtp(phone, otp, newPassword);
  const tokens = await authService.generateAuthTokens(user);
  res.send({
    message: 'Password reset successfully',
    user: profileService.formatProfile(user),
    tokens,
  });
});

module.exports = {
  register,
  verifyRegistration,
  login,
  sendLoginOtp,
  loginWithOtp,
  sendForgotPasswordOtp,
  resetPassword,
};
