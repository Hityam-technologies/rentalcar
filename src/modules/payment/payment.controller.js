const httpStatus = require('http-status').default;
const catchAsync = require('../../utils/catchAsync');
const paymentService = require('./payment.service');

const createPayment = catchAsync(async (req, res) => {
  const payment = await paymentService.createPayment(req.user._id, req.body);
  res.status(httpStatus.CREATED).send(payment);
});

const verifyPayment = catchAsync(async (req, res) => {
  const { transactionId, status } = req.body;
  const payment = await paymentService.verifyPayment(req.params.paymentId, transactionId, status);
  res.send(payment);
});

const getMyPayments = catchAsync(async (req, res) => {
  const payments = await paymentService.getUserPayments(req.user._id);
  res.send({ results: payments.length, data: payments });
});

module.exports = {
  createPayment,
  verifyPayment,
  getMyPayments,
};
