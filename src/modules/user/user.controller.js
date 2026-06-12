const httpStatus = require('http-status').default;
const catchAsync = require('../../utils/catchAsync');
const userServ = require('./user.service');

const getMe = catchAsync(async (req, res) => {
  res.send(req.user);
});

const updateMe = catchAsync(async (req, res) => {
  const user = await userServ.updateUserById(req.user.id, req.body);
  res.send(user);
});

module.exports = {
  getMe,
  updateMe,
};
