const catchAsync = require('../../utils/catchAsync');
const aiService = require('./ai.service');

const chat = catchAsync(async (req, res) => {
  const message = req.body.message || req.body.prompt;
  const result = await aiService.processUserChat(req.user._id, message, req.body.context || {});
  res.send(result);
});

const getRecommendations = catchAsync(async (req, res) => {
  const recommendations = await aiService.getRecommendations(req.user._id);
  res.send(recommendations);
});

module.exports = { chat, getRecommendations };
