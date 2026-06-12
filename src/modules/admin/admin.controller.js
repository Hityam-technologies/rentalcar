const httpStatus = require('http-status').default;
const catchAsync = require('../../utils/catchAsync');
const User = require('../user/user.model');
const adminService = require('./admin.service');

const getAllUsers = catchAsync(async (req, res) => {
  const users = await User.find({});
  res.send(users);
});

const getRevenueAnalytics = catchAsync(async (req, res) => {
  const analytics = await adminService.getRevenueAnalytics();
  res.send(analytics);
});

const getBookingAnalytics = catchAsync(async (req, res) => {
  const analytics = await adminService.getBookingAnalytics();
  res.send(analytics);
});

const getUserAnalytics = catchAsync(async (req, res) => {
  const analytics = await adminService.getUserAnalytics();
  res.send(analytics);
});

module.exports = {
  getAllUsers,
  getRevenueAnalytics,
  getBookingAnalytics,
  getUserAnalytics,
};
