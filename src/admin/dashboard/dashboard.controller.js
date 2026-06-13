const catchAsync = require('../../utils/catchAsync');
const dashboardService = require('./dashboard.service');

const getStats = catchAsync(async (req, res) => {
  const stats = await dashboardService.getDashboardStats();
  res.send(stats);
});

const getInsights = catchAsync(async (req, res) => {
  const insights = await dashboardService.getDashboardInsights();
  res.send(insights);
});

module.exports = { getStats, getInsights };
