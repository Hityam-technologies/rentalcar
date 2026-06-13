const Booking = require('../../shared/models/booking.model');
const User = require('../../shared/models/user.model');
const Car = require('../../shared/models/car.model');

const getRevenueAnalytics = async () => {
  const totalRevenue = await Booking.aggregate([
    { $match: { status: { $in: ['confirmed', 'current', 'completed', 'approved'] } } },
    { $group: { _id: null, total: { $sum: '$totalPrice' } } },
  ]);

  const revenuePerCar = await Booking.aggregate([
    { $match: { status: { $in: ['confirmed', 'current', 'completed', 'approved'] } } },
    { $group: { _id: '$car', revenue: { $sum: '$totalPrice' } } },
    { $lookup: { from: 'cars', localField: '_id', foreignField: '_id', as: 'carDetails' } },
    { $unwind: '$carDetails' },
    { $project: { _id: 1, revenue: 1, carName: '$carDetails.name', carBrand: '$carDetails.brand' } },
    { $sort: { revenue: -1 } },
  ]);

  const revenuePerUser = await Booking.aggregate([
    { $match: { status: { $in: ['confirmed', 'current', 'completed', 'approved'] } } },
    { $group: { _id: '$user', totalSpent: { $sum: '$totalPrice' }, bookingCount: { $sum: 1 } } },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'userDetails' } },
    { $unwind: '$userDetails' },
    { $project: { _id: 1, totalSpent: 1, bookingCount: 1, userName: '$userDetails.name', userEmail: '$userDetails.email' } },
    { $sort: { totalSpent: -1 } },
  ]);

  const monthlyRevenue = await Booking.aggregate([
    { $match: { status: { $in: ['confirmed', 'current', 'completed', 'approved'] } } },
    { $group: { _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } }, revenue: { $sum: '$totalPrice' }, bookings: { $sum: 1 } } },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  return {
    totalRevenue: totalRevenue[0]?.total || 0,
    revenuePerCar,
    revenuePerUser,
    monthlyRevenue,
  };
};

const getBookingAnalytics = async () => {
  const statusStats = await Booking.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
  const popularCars = await Booking.aggregate([
    { $group: { _id: '$car', count: { $sum: 1 } } },
    { $lookup: { from: 'cars', localField: '_id', foreignField: '_id', as: 'carDetails' } },
    { $unwind: '$carDetails' },
    { $project: { _id: 1, count: 1, carName: '$carDetails.name', carBrand: '$carDetails.brand' } },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const bookingTrends = await Booking.aggregate([
    { $match: { createdAt: { $gte: thirtyDaysAgo } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  return { totalBookings: await Booking.countDocuments(), statusStats, popularCars, bookingTrends };
};

const getUserAnalytics = async () => {
  const totalUsers = await User.countDocuments({ role: { $in: ['user', 'host'] } });
  const totalAdmins = await User.countDocuments({ role: 'admin' });
  const userGrowth = await User.aggregate([
    { $match: { role: { $in: ['user', 'host'] } } },
    { $group: { _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } }, count: { $sum: 1 } } },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);
  const activeUsersCount = (await Booking.distinct('user')).length;
  return { totalUsers, totalAdmins, activeUsersCount, userGrowth };
};

module.exports = { getRevenueAnalytics, getBookingAnalytics, getUserAnalytics };
