const httpStatus = require('http-status').default;
const catchAsync = require('../../utils/catchAsync');
const ApiError = require('../../utils/ApiError');
const carService = require('./car.service');

const getCars = catchAsync(async (req, res) => {
  const filter = {
    priceMin: req.query.priceMin,
    priceMax: req.query.priceMax,
    type: req.query.type || req.query.category,
    category: req.query.category,
    brand: req.query.brand,
    search: req.query.search || req.query.q,
    isAvailable: req.query.isAvailable,
    status: req.query.status,
  };
  const cars = await carService.queryCars(filter);
  res.send({ results: cars.length, data: cars });
});

const getNearbyCars = catchAsync(async (req, res) => {
  const { lat, lng } = req.query;
  if (!lat || !lng) throw new ApiError(httpStatus.BAD_REQUEST, 'Latitude and longitude are required for nearby search');
  const cars = await carService.queryCars({ ...req.query, lat, lng });
  res.send({ results: cars.length, data: cars });
});

const getCar = catchAsync(async (req, res) => {
  const car = await carService.getCarById(req.params.carId || req.params.id);
  res.send(car);
});

module.exports = { getCars, getNearbyCars, getCar };
