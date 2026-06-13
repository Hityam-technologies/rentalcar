const catchAsync = require('../../utils/catchAsync');
const homeService = require('./home.service');

const getHomeFeed = catchAsync(async (req, res) => {
  const feed = await homeService.getHomeFeed(req.user || null);
  res.send(feed);
});

module.exports = { getHomeFeed };
