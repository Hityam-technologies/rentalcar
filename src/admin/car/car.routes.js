const express = require('express');
const auth = require('../../middlewares/auth.middleware');
const { optionalCarImages } = require('../../shared/middlewares/upload.middleware');
const carController = require('./car.controller');

const router = express.Router();

router.get('/', auth('admin'), carController.getCars);
router.post('/', auth('admin'), optionalCarImages, carController.createCar);
router.post('/ai-predictions/refresh-all', auth('admin'), carController.refreshAIPredictions);

router.get('/:carId', auth('admin'), carController.getCar);
router.patch('/:carId', auth('admin'), optionalCarImages, carController.updateCar);
router.put('/:carId', auth('admin'), optionalCarImages, carController.updateCar);
router.delete('/:carId', auth('admin'), carController.deleteCar);
router.get('/:carId/documents', auth('admin'), carController.getCarDocuments);
module.exports = router;
