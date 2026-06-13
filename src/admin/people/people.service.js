const httpStatus = require('http-status').default;
const User = require('../../shared/models/user.model');
const Booking = require('../../shared/models/booking.model');
const Staff = require('../../shared/models/staff.model');
const ApiError = require('../../utils/ApiError');

const getClients = async () => {
  const users = await User.find({ role: { $in: ['user', 'host'] } }).sort({ createdAt: -1 });
  const clients = await Promise.all(
    users.map(async (user) => {
      const [metrics, currentBooking, pastCount] = await Promise.all([
        Booking.aggregate([
          { $match: { user: user._id, status: { $in: ['confirmed', 'current', 'completed', 'approved'] } } },
          { $group: { _id: null, totalBookings: { $sum: 1 }, totalRevenue: { $sum: '$totalPrice' } } },
        ]),
        Booking.findOne({ user: user._id, status: { $in: ['pending', 'approved', 'confirmed', 'current'] } }).populate('car', 'name'),
        Booking.countDocuments({ user: user._id, status: 'completed' }),
      ]);

      return {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        tier: user.tier,
        joinedDate: user.joinedDate || user.createdAt,
        totalBookings: metrics[0]?.totalBookings || 0,
        totalRevenue: metrics[0]?.totalRevenue || 0,
        kycStatus: user.kycStatus,
        kycDetail: user.kycDetail,
        currentBooking: currentBooking
          ? { carName: currentBooking.car?.name, status: currentBooking.status, startDate: currentBooking.startDate }
          : null,
        pastBookingsCount: pastCount,
        recentNote: user.recentNote,
      };
    })
  );
  return clients;
};

const getClientById = async (id) => {
  const clients = await getClients();
  const client = clients.find((c) => c.id.toString() === id.toString());
  if (!client) throw new ApiError(httpStatus.NOT_FOUND, 'Client not found');
  return client;
};

const getStaff = async () => {
  const staff = await Staff.find().sort({ createdAt: -1 });
  return staff.map((s) => ({
    id: s._id,
    name: s.name,
    role: s.role,
    phone: s.phone,
    status: s.status,
    salary: s.salary,
    pendingPayout: s.pendingPayout,
    logs: s.logs,
    overview: s.overview,
    joinedDate: s.joinedDate,
  }));
};

const getStaffById = async (id) => {
  const staff = await Staff.findById(id);
  if (!staff) throw new ApiError(httpStatus.NOT_FOUND, 'Staff not found');
  return staff;
};

const registerStaffPayout = async (staffId, body) => {
  const staff = await Staff.findById(staffId);
  if (!staff) throw new ApiError(httpStatus.NOT_FOUND, 'Staff not found');

  const log = {
    date: new Date(),
    type: body.type || 'Payout',
    amount: body.amount,
    status: body.status || 'Completed',
  };
  staff.logs.push(log);
  staff.pendingPayout = Math.max(0, staff.pendingPayout - (body.amount || 0));
  await staff.save();
  return staff;
};

module.exports = { getClients, getClientById, getStaff, getStaffById, registerStaffPayout };
