const httpStatus = require('http-status').default;
const User = require('../../shared/models/user.model');
const ApiError = require('../../utils/ApiError');

const createUser = async (userBody) => {
  if (await User.isEmailTaken(userBody.email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  if (await User.isPhoneTaken(userBody.phone)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Phone number already taken');
  }
  return User.create(userBody);
};

const getUserById = async (id) => User.findById(id);
const getUserByPhone = async (phone) => User.findOne({ phone });

const updateUserById = async (userId, updateBody) => {
  const user = await getUserById(userId);
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  if (updateBody.email && (await User.isEmailTaken(updateBody.email, userId))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  Object.assign(user, updateBody);
  await user.save();
  return user;
};

const formatProfile = (user) => ({
  id: user._id,
  firstName: user.firstName || user.name?.split(' ')[0] || '',
  lastName: user.lastName || user.name?.split(' ').slice(1).join(' ') || '',
  name: user.name,
  email: user.email,
  phone: user.phone,
  avatarUrl: user.avatarUrl,
  location: user.location,
  kycStatus: user.kycStatus,
  isPhoneVerified: user.isPhoneVerified,
  role: user.role,
  referralCode: user.referralCode,
  totalInvites: user.totalInvites,
  rewardsEarned: user.rewardsEarned,
  notificationCount: user.notificationCount,
  favorites: user.favorites,
});

const toggleFavorite = async (userId, carId) => {
  const user = await getUserById(userId);
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');

  const idx = user.favorites.findIndex((f) => f.toString() === carId.toString());
  if (idx >= 0) user.favorites.splice(idx, 1);
  else user.favorites.push(carId);

  await user.save();
  return { favorites: user.favorites, added: idx < 0 };
};

module.exports = {
  createUser,
  getUserById,
  getUserByPhone,
  updateUserById,
  formatProfile,
  toggleFavorite,
};
