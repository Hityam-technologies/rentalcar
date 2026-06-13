const httpStatus = require('http-status').default;
const Booking = require('../../shared/models/booking.model');
const Car = require('../../shared/models/car.model');
const ApiError = require('../../utils/ApiError');
const { mapAdminBookingStatus } = require('../../shared/utils/carFormatter.util');
const { formatCarDetail } = require('../../shared/utils/carFormatter.util');

const formatAdminBookingList = (booking) => ({
  id: booking._id,
  bookingId: booking.bookingId,
  clientName: booking.user?.name || 'Unknown',
  clientAvatar: booking.user?.avatarUrl || '',
  carName: booking.car?.name || 'Unknown',
  status: mapAdminBookingStatus(booking.status),
  dateRange: { start: booking.startDate, end: booking.endDate },
  price: booking.financials?.total || booking.totalPrice,
  durationDays: booking.durationDays,
});

const getAllBookings = async (filter = {}) => {
  const query = {};
  if (filter.status) query.status = filter.status;
  const bookings = await Booking.find(query).populate('user', 'name avatarUrl email phone kycStatus').populate('car').sort({ createdAt: -1 });
  return bookings.map(formatAdminBookingList);
};

const getBookingById = async (id) => {
  const booking = await Booking.findById(id).populate('user', 'name avatarUrl email phone kycStatus').populate('car');
  if (!booking) throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found');

  return {
    id: booking._id,
    bookingId: booking.bookingId,
    status: mapAdminBookingStatus(booking.status),
    client: {
      name: booking.user?.name,
      avatar: booking.user?.avatarUrl,
      phone: booking.user?.phone,
      email: booking.user?.email,
      clientVerified: booking.user?.kycStatus === 'Verified',
    },
    car: booking.car ? formatCarDetail(booking.car) : null,
    tripItinerary: {
      pickupLocation: booking.pickupLocation,
      dropoffLocation: booking.dropoffLocation,
      durationDays: booking.durationDays,
      startDate: booking.startDate,
      endDate: booking.endDate,
    },
    aiIntelligence: {
      tenantRisk: booking.aiRiskTier || 'Low Risk · Tier 1',
      assetUtilization: booking.aiUtilizationInsight || 'Optimal utilization for this vehicle class',
    },
    financialBreakdown: booking.financials || {
      baseRate: booking.totalPrice,
      insurance: 0,
      tax: 0,
      deposit: 500,
      total: booking.totalPrice,
    },
  };
};

const updateBookingStatus = async (id, status, adminAction) => {
  const booking = await Booking.findById(id);
  if (!booking) throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found');

  const statusMap = {
    Approve: 'approved',
    Approved: 'approved',
    Decline: 'declined',
    Declined: 'declined',
    Complete: 'completed',
    Completed: 'completed',
    Cancel: 'cancelled',
  };

  const newStatus = statusMap[status] || statusMap[adminAction] || status.toLowerCase();
  booking.status = newStatus;

  if (newStatus === 'approved') {
    booking.status = 'approved';
    await Car.findByIdAndUpdate(booking.car, { status: 'On Trip', isAvailable: false });
  }
  if (newStatus === 'declined' || newStatus === 'cancelled') {
    await Car.findByIdAndUpdate(booking.car, { status: 'Available', isAvailable: true });
  }
  if (newStatus === 'completed') {
    await Car.findByIdAndUpdate(booking.car, { status: 'Available', isAvailable: true });
  }

  await booking.save();
  return getBookingById(id);
};

module.exports = { getAllBookings, getBookingById, updateBookingStatus };
