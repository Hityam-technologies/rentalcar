const jwt = require('jsonwebtoken');
const moment = require('moment'); // I forgot to install moment, I'll use native Date for now or install it.
// Actually, let's just use standard date manipulation to keep it simple or install moment.
// I'll install moment and validator.

const generateToken = (userId, expires, type, secret = process.env.JWT_SECRET) => {
  const payload = {
    sub: userId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(expires.getTime() / 1000),
    type,
  };
  return jwt.sign(payload, secret);
};

const verifyToken = async (token, type) => {
  const payload = jwt.verify(token, process.env.JWT_SECRET);
  if (payload.type !== type) {
    throw new Error('Invalid token type');
  }
  return payload;
};

module.exports = {
  generateToken,
  verifyToken,
};
