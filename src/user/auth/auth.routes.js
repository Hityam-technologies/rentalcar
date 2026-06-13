const express = require('express');
const validate = require('../../middlewares/validate.middleware');
const authValidation = require('./auth.validation');
const authController = require('./auth.controller');

const router = express.Router();

router.post('/register', validate(authValidation.register), authController.register);
router.post('/verify-registration', validate(authValidation.verifyOtp), authController.verifyRegistration);
router.post('/login', validate(authValidation.login), authController.login);
router.post('/send-login-otp', validate(authValidation.sendOtp), authController.sendLoginOtp);
router.post('/login-with-otp', validate(authValidation.verifyOtp), authController.loginWithOtp);
router.post('/otp/send', validate(authValidation.sendOtp), authController.sendLoginOtp);

router.post('/forgot-password/send-otp', validate(authValidation.forgotPasswordSendOtp), authController.sendForgotPasswordOtp);
router.post('/forgot-password', validate(authValidation.forgotPasswordSendOtp), authController.sendForgotPasswordOtp);
router.post('/forgot-password/reset', validate(authValidation.resetPassword), authController.resetPassword);
router.post('/reset-password', validate(authValidation.resetPassword), authController.resetPassword);

module.exports = router;
