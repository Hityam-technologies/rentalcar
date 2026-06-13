const cron = require('node-cron');
const Car = require('../shared/models/car.model');
const aiPredictionService = require('../shared/services/aiPrediction.service');
const logger = require('./logger');

const setupCronJobs = () => {
  // Run every 3 hours: minute 0 of every 3rd hour
  cron.schedule('0 */3 * * *', async () => {
    logger.info('Running scheduled AI prediction updates for all cars...');
    try {
      const cars = await Car.find({});
      for (const car of cars) {
        // Skip cars that are not available or pending? 
        // Let's update all cars to keep predictions fresh based on their specs.
        const prediction = await aiPredictionService.generateCarPrediction(car);
        if (prediction) {
          car.aiPrediction = prediction;
          car.aiTip = prediction.tip;
          await car.save();
        }
      }
      logger.info('Scheduled AI prediction updates completed successfully.');
    } catch (error) {
      logger.error('Error in scheduled AI prediction updates:', error);
    }
  });

  logger.info('Cron jobs initialized successfully.');
};

module.exports = setupCronJobs;
