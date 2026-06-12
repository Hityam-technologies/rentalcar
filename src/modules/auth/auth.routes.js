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

module.exports = router;
