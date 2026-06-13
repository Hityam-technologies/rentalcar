const moment = require('moment');
const Booking = require('../../shared/models/booking.model');
const Car = require('../../shared/models/car.model');
const User = require('../../shared/models/user.model');

const pctChange = (current, previous) => {
  if (!previous) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
};

const getLast7Days = () => {
  const days = [];
  for (let i = 6; i >= 0; i--) days.push(moment().subtract(i, 'days').format('YYYY-MM-DD'));
  return days;
};

const getDashboardStats = async () => {
  const todayStart = moment().startOf('day').toDate();
  const todayEnd = moment().endOf('day').toDate();
  const yesterdayStart = moment().subtract(1, 'day').startOf('day').toDate();
  const yesterdayEnd = moment().subtract(1, 'day').endOf('day').toDate();
  const weekAgo = moment().subtract(7, 'days').startOf('day').toDate();

  const [
    todayRevenue,
    yesterdayRevenue,
    todayBookings,
    yesterdayBookings,
    totalCars,
    availableCars,
    onRentCars,
    inServiceCars,
    weekBookings,
    weekRevenue,
    returnsToday,
  ] = await Promise.all([
    Booking.aggregate([
      { $match: { createdAt: { $gte: todayStart, $lte: todayEnd }, status: { $in: ['confirmed', 'current', 'completed', 'approved'] } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]),
    Booking.aggregate([
      { $match: { createdAt: { $gte: yesterdayStart, $lte: yesterdayEnd }, status: { $in: ['confirmed', 'current', 'completed', 'approved'] } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]),
    Booking.countDocuments({ createdAt: { $gte: todayStart, $lte: todayEnd } }),
    Booking.countDocuments({ createdAt: { $gte: yesterdayStart, $lte: yesterdayEnd } }),
    Car.countDocuments(),
    Car.countDocuments({ status: 'Available' }),
    Car.countDocuments({ status: 'On Trip' }),
    Car.countDocuments({ status: 'In Service' }),
    Booking.find({ createdAt: { $gte: weekAgo } }),
    Booking.aggregate([
      { $match: { createdAt: { $gte: weekAgo }, status: { $in: ['confirmed', 'current', 'completed', 'approved'] } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$totalPrice' }, bookings: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Booking.countDocuments({ endDate: { $gte: todayStart, $lte: todayEnd }, status: { $in: ['confirmed', 'current', 'approved'] } }),
  ]);

  const revToday = todayRevenue[0]?.total || 0;
  const revYesterday = yesterdayRevenue[0]?.total || 0;
  const days = getLast7Days();

  const bookingsByDay = days.map((d) => {
    const found = weekRevenue.find((w) => w._id === d);
    return found?.bookings || 0;
  });
  const revenueByDay = days.map((d) => {
    const found = weekRevenue.find((w) => w._id === d);
    return found?.revenue || 0;
  });
  const sparkline = revenueByDay.map((v) => (revToday ? v / Math.max(revToday, 1) : 0));

  const utilization = totalCars ? Math.round((onRentCars / totalCars) * 100) : 0;

  return {
    heroStats: {
      todayRevenue: revToday,
      todayRevenueDelta: pctChange(revToday, revYesterday),
      bookingsToday: todayBookings,
      bookingsTodayDelta: pctChange(todayBookings, yesterdayBookings),
      fleetUtilization: utilization,
      fleetUtilizationDelta: 2,
    },
    sparklineData: sparkline,
    quickStats: {
      totalCars,
      availableCars,
      carsOnRent: onRentCars,
      returnsExpectedToday: returnsToday,
    },
    weeklyTrends: {
      labels: days.map((d) => moment(d).format('ddd')),
      bookings: bookingsByDay,
      revenue: revenueByDay,
    },
    fleetSegments: [
      { label: 'Available', value: availableCars, color: '#10B981' },
      { label: 'On Rent', value: onRentCars, color: '#4F46E5' },
      { label: 'In Service', value: inServiceCars, color: '#F59E0B' },
    ],
  };
};

const getDashboardInsights = async () => {
  const [topCars, recentBookings, popularType] = await Promise.all([
    Booking.aggregate([
      { $match: { status: { $in: ['confirmed', 'current', 'completed', 'approved'] } } },
      { $group: { _id: '$car', revenue: { $sum: '$totalPrice' }, bookings: { $sum: 1 } } },
      { $lookup: { from: 'cars', localField: '_id', foreignField: '_id', as: 'car' } },
      { $unwind: '$car' },
      { $project: { name: '$car.name', revenue: 1, bookings: 1 } },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
    ]),
    Booking.find().sort({ createdAt: -1 }).limit(5).populate('user', 'name avatarUrl').populate('car', 'name'),
    Car.aggregate([{ $group: { _id: '$type', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 1 }]),
  ]);

  const trending = popularType[0]?._id || 'SUV';

  return {
    aiInsights: [
      { label: 'Trending', value: trending, subtext: 'High demand this week', action: 'View Fleet', confidence: 0.87, gradient: ['#4F46E5', '#7C3AED'] },
      { label: 'Pricing Tip', value: '+8%', subtext: 'Raise weekend SUV rates', action: 'Apply', confidence: 0.72, gradient: ['#059669', '#10B981'] },
      { label: 'Peak Window', value: 'Fri 4PM', subtext: 'Expected booking surge', action: 'Schedule', confidence: 0.91, gradient: ['#F59E0B', '#EF4444'] },
    ],
    alerts: [
      { type: 'warning', message: `Low ${trending} Availability`, severity: 'medium' },
    ],
    topCars: topCars.map((c, i) => ({ rank: i + 1, name: c.name, revenue: c.revenue, bookings: c.bookings })),
    recentBookings: recentBookings.map((b) => ({
      id: b._id,
      clientInitials: b.user?.name?.split(' ').map((n) => n[0]).join('') || 'U',
      clientName: b.user?.name,
      carName: b.car?.name,
      status: b.status,
      timeElapsed: moment(b.createdAt).fromNow(),
    })),
  };
};

const getRevenueAnalytics = async () => {
  const weekAgo = moment().subtract(7, 'days').startOf('day').toDate();
  const days = getLast7Days();

  const [dailyRevenue, demographics] = await Promise.all([
    Booking.aggregate([
      { $match: { createdAt: { $gte: weekAgo }, status: { $in: ['confirmed', 'current', 'completed', 'approved'] } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$totalPrice' } } },
      { $sort: { _id: 1 } },
    ]),
    User.aggregate([
      { $match: { role: 'user' } },
      { $group: { _id: '$tier', count: { $sum: 1 } } },
    ]),
  ]);

  const totalUsers = demographics.reduce((s, d) => s + d.count, 0) || 1;

  return {
    weeklyData: days.map((d) => {
      const found = dailyRevenue.find((r) => r._id === d);
      return { day: moment(d).format('ddd'), revenue: found?.revenue || 0 };
    }),
    dailyData: days.map((d) => {
      const found = dailyRevenue.find((r) => r._id === d);
      return found?.revenue || 0;
    }),
    demographics: [
      { label: 'Ages 18-25', percentage: 35 },
      { label: 'Ages 26-35', percentage: 40 },
      { label: 'Ages 36+', percentage: 25 },
    ],
    tierBreakdown: demographics.map((d) => ({
      tier: d._id || 'Standard',
      percentage: Math.round((d.count / totalUsers) * 100),
    })),
  };
};

module.exports = { getDashboardStats, getDashboardInsights, getRevenueAnalytics };
