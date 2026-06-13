const express = require('express');
const catchAsync = require('../../utils/catchAsync');
const viewer360Service = require('../../shared/services/viewer360.service');
const viewer360Controller = require('./viewer360.controller');

const router = express.Router();

router.get('/viewer360/:carId', catchAsync(async (req, res, next) => {
  const car = await viewer360Service.getCarSpinImages(req.params.carId);
  if (!car.has360) return viewer360Controller.renderUnavailablePage(req, res, next);
  return viewer360Controller.renderViewerPage(req, res, next);
}));

module.exports = router;
