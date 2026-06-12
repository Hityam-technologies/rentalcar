const express = require('express');
const auth = require('../../middlewares/auth.middleware');
const paymentController = require('./payment.controller');

const router = express.Router();

router.post('/', auth(), paymentController.createPayment);
router.post('/:paymentId/verify', auth(), paymentController.verifyPayment);
router.get('/me', auth(), paymentController.getMyPayments);

module.exports = router;
