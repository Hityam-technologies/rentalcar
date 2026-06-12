const express = require('express');
const auth = require('../../middlewares/auth.middleware');
const carController = require('./car.controller');

const router = express.Router();

// User routes (Public or logged in user)
router.get('/', carController.getCars);
router.get('/nearby', carController.getNearbyCars); // e.g., /nearby?lat=xx&lng=xx
router.get('/:carId', carController.getCar);

// Admin routes
router.post('/', auth('admin'), carController.createCar);
router.patch('/:carId', auth('admin'), carController.updateCar);
router.delete('/:carId', auth('admin'), carController.deleteCar);

module.exports = router;
