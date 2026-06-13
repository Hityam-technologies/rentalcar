const catchAsync = require('../../utils/catchAsync');
const User = require('../../shared/models/user.model');
const analyticsService = require('./analytics.service');

const getAllUsers = catchAsync(async (req, res) => {
  const users = await User.find({}).select('-password');
  res.send({ results: users.length, data: users });
});

const getRevenueAnalytics = catchAsync(async (req, res) => {
  res.send(await analyticsService.getRevenueAnalytics());
});

const getBookingAnalytics = catchAsync(async (req, res) => {
  res.send(await analyticsService.getBookingAnalytics());
});

const getUserAnalytics = catchAsync(async (req, res) => {
  res.send(await analyticsService.getUserAnalytics());
});

module.exports = { getAllUsers, getRevenueAnalytics, getBookingAnalytics, getUserAnalytics };
