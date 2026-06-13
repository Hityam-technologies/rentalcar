const catchAsync = require('../../utils/catchAsync');
const aiService = require('./ai.service');

const chat = catchAsync(async (req, res) => {
  const message = req.body.message || req.body.prompt;
  const result = await aiService.processAdminChat(req.user._id, message);
  res.send(result);
});

const getConfig = catchAsync(async (req, res) => {
  res.send(aiService.getInitialData());
});

module.exports = { chat, getConfig };
