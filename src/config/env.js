const dotenv = require('dotenv');

dotenv.config();

const parseDuration = (value, fallback) => {
  const expr = value || fallback;
  const match = String(expr).match(/^(\d+)([smhd])$/);
  if (!match) return { amount: 15, unit: 'minutes' };
  const unitMap = { s: 'seconds', m: 'minutes', h: 'hours', d: 'days' };
  return { amount: parseInt(match[1], 10), unit: unitMap[match[2]] };
};

const nodeEnv = process.env.NODE_ENV || 'development';
const port = parseInt(process.env.PORT || '5000', 10);

const validate = () => {
  if (nodeEnv === 'test') return;
  const missing = [];
  if (!process.env.MONGODB_URI) missing.push('MONGODB_URI');
  if (!process.env.JWT_SECRET) missing.push('JWT_SECRET');
  if (!process.env.JWT_REFRESH_SECRET) missing.push('JWT_REFRESH_SECRET');
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

validate();

const config = {
  nodeEnv,
  isDev: nodeEnv === 'development',
  isProd: nodeEnv === 'production',
  isTest: nodeEnv === 'test',
  port,
  get baseUrl() {
    return process.env.BASE_URL || `http://localhost:${port}`;
  },
  mongodb: {
    get uri() {
      return process.env.MONGODB_URI;
    },
    get dbName() {
      return process.env.MONGODB_DB_NAME || 'hityam-rental';
    },
  },
  jwt: {
    get secret() {
      return process.env.JWT_SECRET;
    },
    get refreshSecret() {
      return process.env.JWT_REFRESH_SECRET;
    },
    get access() {
      return parseDuration(process.env.JWT_ACCESS_EXPIRATION, '15m');
    },
    get refresh() {
      return parseDuration(process.env.JWT_REFRESH_EXPIRATION, '7d');
    },
  },
  otp: {
    get expiryMinutes() {
      return parseInt(process.env.OTP_EXPIRY_MINUTES || '5', 10);
    },
    get maxAttempts() {
      return parseInt(process.env.OTP_MAX_ATTEMPTS || '5', 10);
    },
    get cooldownMinutes() {
      return parseInt(process.env.OTP_COOLDOWN_MINUTES || '1', 10);
    },
  },
  get geminiApiKey() {
    return process.env.GEMINI_API_KEY || '';
  },
};

module.exports = config;
