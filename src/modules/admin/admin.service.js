const mongoose = require('mongoose');
const Booking = require('../booking/booking.model');
const User = require('../user/user.model');
const Car = require('../car/car.model');

/**
 * Get revenue analytics
 */
const getRevenueAnalytics = async () => {
  // 1. Total Revenue
  const totalRevenue = await Booking.aggregate([
    { $match: { status: { $in: ['confirmed', 'completed'] } } },
    { $group: { _id: null, total: { $sum: '$totalPrice' } } }
  ]);

  // 2. Revenue per car
  const revenuePerCar = await Booking.aggregate([
    { $match: { status: { $in: ['confirmed', 'completed'] } } },
    { $group: { _id: '$car', revenue: { $sum: '$totalPrice' } } },
    { $lookup: { from: 'cars', localField: '_id', foreignField: '_id', as: 'carDetails' } },
    { $unwind: '$carDetails' },
    { $project: { _id: 1, revenue: 1, carName: '$carDetails.name', carBrand: '$carDetails.brand' } },
    { $sort: { revenue: -1 } }
  ]);

  // 3. Revenue per user
  const revenuePerUser = await Booking.aggregate([
    { $match: { status: { $in: ['confirmed', 'completed'] } } },
    { $group: { _id: '$user', totalSpent: { $sum: '$totalPrice' }, bookingCount: { $sum: 1 } } },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'userDetails' } },
    { $unwind: '$userDetails' },
    { $project: { _id: 1, totalSpent: 1, bookingCount: 1, userName: '$userDetails.name', userEmail: '$userDetails.email' } },
    { $sort: { totalSpent: -1 } }
  ]);

  // 4. Monthly revenue (for charts)
  const monthlyRevenue = await Booking.aggregate([
    { $match: { status: { $in: ['confirmed', 'completed'] } } },
    {
      $group: {
        _id: {
          month: { $month: '$createdAt' },
          year: { $year: '$createdAt' }
        },
        revenue: { $sum: '$totalPrice' },
        bookings: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  return {
    totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
    revenuePerCar,
    revenuePerUser,
    monthlyRevenue
  };
};

/**
 * Get booking analytics
 */
const getBookingAnalytics = async () => {
  // 1. Stats by status
  const statusStats = await Booking.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);

  // 2. Most booked cars
  const popularCars = await Booking.aggregate([
    { $group: { _id: '$car', count: { $sum: 1 } } },
    { $lookup: { from: 'cars', localField: '_id', foreignField: '_id', as: 'carDetails' } },
    { $unwind: '$carDetails' },
    { $project: { _id: 1, count: 1, carName: '$carDetails.name', carBrand: '$carDetails.brand' } },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);

  // 3. Overall stats
  const totalBookings = await Booking.countDocuments();
  
  // 4. Booking trends (daily for last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const bookingTrends = await Booking.aggregate([
    { $match: { createdAt: { $gte: thirtyDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  return {
    totalBookings,
    statusStats,
    popularCars,
    bookingTrends
  };
};

/**
 * Get user analytics
 */
const getUserAnalytics = async () => {
  const totalUsers = await User.countDocuments({ role: 'user' });
  const totalAdmins = await User.countDocuments({ role: 'admin' });

  // New users growth (monthly)
  const userGrowth = await User.aggregate([
    { $match: { role: 'user' } },
    {
      $group: {
        _id: {
          month: { $month: '$createdAt' },
          year: { $year: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  // Active users (users who have made at least one booking)
  const activeUsersCount = (await Booking.distinct('user')).length;

  return {
    totalUsers,
    totalAdmins,
    activeUsersCount,
    userGrowth
  };
};

module.exports = {
  getRevenueAnalytics,
  getBookingAnalytics,
  getUserAnalytics,
};
