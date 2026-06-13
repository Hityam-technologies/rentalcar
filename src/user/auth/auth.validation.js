const Joi = require('joi');

const register = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required().min(8),
    name: Joi.string().required(),
    phone: Joi.string().required(),
  }),
};

const login = {
  body: Joi.object().keys({
    email: Joi.string().required(),
    password: Joi.string().required(),
  }),
};

const sendOtp = {
  body: Joi.object().keys({
    phone: Joi.string().required(),
  }),
};

const verifyOtp = {
  body: Joi.object().keys({
    phone: Joi.string().required(),
    otp: Joi.string().required().length(6),
  }),
};

const forgotPasswordSendOtp = {
  body: Joi.object().keys({
    phone: Joi.string().required(),
  }),
};

const resetPassword = {
  body: Joi.object().keys({
    phone: Joi.string().required(),
    otp: Joi.string().required().length(6),
    newPassword: Joi.string().required().min(8),
  }),
};

module.exports = { register, login, sendOtp, verifyOtp, forgotPasswordSendOtp, resetPassword };
