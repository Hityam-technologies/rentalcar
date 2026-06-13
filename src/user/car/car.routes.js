const express = require('express');
const carController = require('./car.controller');

const router = express.Router();

router.get('/', carController.getCars);
router.get('/nearby', carController.getNearbyCars);
router.get('/:carId', carController.getCar);

module.exports = router;
