const catchAsync = require('../../utils/catchAsync');
const profileService = require('./profile.service');

const getMe = catchAsync(async (req, res) => {
  res.send(profileService.formatProfile(req.user));
});

const updateMe = catchAsync(async (req, res) => {
  const user = await profileService.updateUserById(req.user.id, req.body);
  res.send(profileService.formatProfile(user));
});

const toggleFavorite = catchAsync(async (req, res) => {
  const result = await profileService.toggleFavorite(req.user._id, req.body.carId);
  res.send(result);
});

const getReferrals = catchAsync(async (req, res) => {
  res.send({
    referralCode: req.user.referralCode,
    totalInvites: req.user.totalInvites,
    rewardsEarned: req.user.rewardsEarned,
  });
});

const getStaticPages = catchAsync(async (req, res) => {
  res.send({
    helpCenter: { title: 'Help Center', url: 'https://hityam.com/help', markdown: '## Help Center\nContact support at support@hityam.com' },
    privacyPolicy: { title: 'Privacy Policy', url: 'https://hityam.com/privacy', markdown: '## Privacy Policy\nWe protect your data.' },
    about: { title: 'About Hityam', url: 'https://hityam.com/about', markdown: '## About\nHityam Rental - Premium car rentals.' },
  });
});

module.exports = { getMe, updateMe, toggleFavorite, getReferrals, getStaticPages };
