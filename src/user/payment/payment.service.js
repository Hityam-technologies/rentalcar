const httpStatus = require('http-status').default;
const Payment = require('../../shared/models/payment.model');
const Booking = require('../../shared/models/booking.model');
const ApiError = require('../../utils/ApiError');

const createPayment = async (userId, body) => {
  const { bookingId, paymentMethod } = body;
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found');
  if (booking.user.toString() !== userId.toString()) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Not authorized to pay for this booking');
  }
  if (booking.paymentStatus === 'paid') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Booking is already paid');
  }

  return Payment.create({
    user: userId,
    booking: booking._id,
    amount: booking.financials?.total || booking.totalPrice,
    paymentMethod,
    status: 'pending',
  });
};

const verifyPayment = async (paymentId, transactionId, status) => {
  const payment = await Payment.findById(paymentId);
  if (!payment) throw new ApiError(httpStatus.NOT_FOUND, 'Payment not found');
  if (payment.status !== 'pending') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Payment is already processed');
  }

  payment.transactionId = transactionId;
  payment.status = status;
  await payment.save();

  const booking = await Booking.findById(payment.booking);
  if (booking) {
    if (status === 'successful') {
      booking.paymentStatus = 'paid';
      booking.status = 'confirmed';
      await Booking.findByIdAndUpdate(booking.car, { status: 'On Trip', isAvailable: false });
    } else if (status === 'failed') {
      booking.paymentStatus = 'failed';
    }
    await booking.save();
  }
  return payment;
};

const getUserPayments = async (userId) => Payment.find({ user: userId }).populate('booking');

module.exports = { createPayment, verifyPayment, getUserPayments };
