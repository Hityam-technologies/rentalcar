const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const httpStatus = require('http-status').default;
const morgan = require('morgan');
const routes = require('./routes');
const { errorConverter, errorHandler } = require('./middlewares/error.middleware');
const ApiError = require('./utils/ApiError');
const rateLimit = require('express-rate-limit');
const viewer360Routes = require('./modules/viewer360/viewer360.routes');

const path = require('path');

const app = express();

// ... existing code ...

// Set security HTTP headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "script-src": ["'self'", "'unsafe-inline'", "https://code.jquery.com", "https://unpkg.com"],
        "img-src": ["'self'", "data:", "blob:", "http://localhost:5000", "/uploads/"],
      },
    },
  })
);

// Serve static files from uploads folder
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Parse json request body
app.use(express.json());

// Parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// Enable cors
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
});
app.use('/api', limiter);

// API routes
app.use('/api', routes);
app.use('/', viewer360Routes);

// Send back a 404 error for any unknown api request
app.use((req, res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, 'Not found'));
});

// Convert error to ApiError, if needed
app.use(errorConverter);

// Handle error
app.use(errorHandler);

module.exports = app;
