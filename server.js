const config = require('./src/config/env');
const app = require('./src/app');
const connectDB = require('./src/config/db');
const logger = require('./src/config/logger');
const setupCronJobs = require('./src/config/cron');

const PORT = config.port;

// Connect to Database
connectDB().then(() => {
  setupCronJobs();
});

const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

const exitHandler = () => {
  if (server) {
    server.close(() => {
      logger.info('Server closed');
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error) => {
  logger.error(error);
  exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
  logger.info('SIGTERM received');
  if (server) {
    server.close();
  }
});
