const httpStatus = require('http-status').default;
const catchAsync = require('../../utils/catchAsync');
const aiService = require('./ai.service');

const getAssistantResponse = catchAsync(async (req, res) => {
  const { prompt } = req.body;
  const userId = req.user._id;
  const userRole = req.user.role;

  const result = await aiService.processAiResponse(userId, userRole, prompt);

  res.send(result);
});

const getRecommendations = catchAsync(async (req, res) => {
  const recommendations = await aiService.getAIRecommendations(req.user._id);
  res.send(recommendations);
});

const getPricingSuggestions = catchAsync(async (req, res) => {
  const suggestions = await aiService.suggestPricingOptimizations();
  res.send({ suggestions });
});

module.exports = {
  getAssistantResponse,
  getRecommendations,
  getPricingSuggestions,
};
