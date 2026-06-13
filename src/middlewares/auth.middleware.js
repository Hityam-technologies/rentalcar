const jwt = require('jsonwebtoken');
const httpStatus = require('http-status').default;
const config = require('../config/env');
const ApiError = require('../utils/ApiError');
const User = require('../shared/models/user.model');
const catchAsync = require('../utils/catchAsync');

const auth = (...requiredRights) => catchAsync(async (req, res, next) => {
  const options = typeof requiredRights[0] === 'object' && requiredRights[0] !== null ? requiredRights[0] : null;
  const roles = options ? [] : requiredRights;
  const optional = options?.optional === true;

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    if (optional) return next();
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, config.jwt.secret);
    const user = await User.findById(payload.sub);

    if (!user) {
      if (optional) return next();
      return next(new ApiError(httpStatus.UNAUTHORIZED, 'User not found'));
    }

    req.user = user;

    if (roles.length) {
      const hasRequiredRights = roles.every((role) => [user.role].includes(role));
      if (!hasRequiredRights) {
        return next(new ApiError(httpStatus.FORBIDDEN, 'Forbidden'));
      }
    }

    next();
  } catch (error) {
    if (optional) return next();
    return next(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));
  }
});

module.exports = auth;
