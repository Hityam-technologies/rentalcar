const httpStatus = require('http-status').default;
const catchAsync = require('../../utils/catchAsync');
const ApiError = require('../../utils/ApiError');
const authServ = require('./auth.service');
const userServ = require('../user/user.service');

const register = catchAsync(async (req, res) => {
  const user = await userServ.createUser({ ...req.body, role: 'user' });
  // Send OTP for verification
  await authServ.sendOTP(user.phone, 'registration');
  res.status(httpStatus.CREATED).send({ 
    message: 'User registered successfully. Please verify your phone with OTP.',
    userId: user._id 
  });
});

const verifyRegistration = catchAsync(async (req, res) => {
  const { phone, otp } = req.body;
  await authServ.verifyOTPService(phone, otp, 'registration');
  
  const user = await userServ.getUserByPhone(phone);
  user.isPhoneVerified = true;
  await user.save();

  const tokens = await authServ.generateAuthTokens(user);
  res.send({ user, tokens });
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const user = await authServ.loginUserWithEmailAndPassword(email, password);
  if (!user.isPhoneVerified) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Phone not verified');
  }
  const tokens = await authServ.generateAuthTokens(user);
  res.send({ user, tokens });
});

const sendLoginOtp = catchAsync(async (req, res) => {
  const { phone } = req.body;
  const user = await userServ.getUserByPhone(phone);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found with this phone number');
  }
  await authServ.sendOTP(phone, 'login');
  res.send({ message: 'OTP sent successfully' });
});

const loginWithOtp = catchAsync(async (req, res) => {
  const { phone, otp } = req.body;
  await authServ.verifyOTPService(phone, otp, 'login');
  
  const user = await userServ.getUserByPhone(phone);
  const tokens = await authServ.generateAuthTokens(user);
  res.send({ user, tokens });
});

module.exports = {
  register,
  verifyRegistration,
  login,
  sendLoginOtp,
  loginWithOtp,
};
