const catchAsync = require('../../utils/catchAsync');
const dashboardService = require('../dashboard/dashboard.service');

const getRevenue = catchAsync(async (req, res) => {
  const revenue = await dashboardService.getRevenueAnalytics();
  res.send(revenue);
});

module.exports = { getRevenue };
