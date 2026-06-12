const jwt = require('jsonwebtoken');
const httpStatus = require('http-status').default;
const ApiError = require('../utils/ApiError');
const User = require('../modules/user/user.model');
const catchAsync = require('../utils/catchAsync');

const auth = (...requiredRights) => catchAsync(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub);

    if (!user) {
      return next(new ApiError(httpStatus.UNAUTHORIZED, 'User not found'));
    }

    req.user = user;

    if (requiredRights.length) {
      const userRights = [user.role]; // Simple role-based check
      const hasRequiredRights = requiredRights.every((requiredRight) => userRights.includes(requiredRight));
      if (!hasRequiredRights) {
        return next(new ApiError(httpStatus.FORBIDDEN, 'Forbidden'));
      }
    }

    next();
  } catch (error) {
    return next(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));
  }
});

module.exports = auth;
