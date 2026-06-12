const httpStatus = require('http-status').default;
const catchAsync = require('../../utils/catchAsync');
const carService = require('./car.service');
const ApiError = require('../../utils/ApiError');

const createCar = catchAsync(async (req, res) => {
  const car = await carService.createCar(req.body);
  res.status(httpStatus.CREATED).send(car);
});

const getCars = catchAsync(async (req, res) => {
  const filter = {
    priceMin: req.query.priceMin,
    priceMax: req.query.priceMax,
    type: req.query.type,
    brand: req.query.brand,
    isAvailable: req.query.isAvailable,
  };
  
  const cars = await carService.queryCars(filter, {});
  res.send({ results: cars.length, data: cars });
});

const getNearbyCars = catchAsync(async (req, res) => {
  const lat = req.query.lat;
  const lng = req.query.lng;
  const maxDistance = req.query.maxDistance;
  
  if (!lat || !lng) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Latitude and longitude are required for nearby search');
  }
  
  const filter = { lat, lng, maxDistance, ...req.query };
  const cars = await carService.queryCars(filter, {});
  res.send({ results: cars.length, data: cars });
});

const getCar = catchAsync(async (req, res) => {
  const car = await carService.getCarById(req.params.carId);
  if (!car) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Car not found');
  }
  res.send(car);
});

const updateCar = catchAsync(async (req, res) => {
  const car = await carService.updateCarById(req.params.carId, req.body);
  res.send(car);
});

const deleteCar = catchAsync(async (req, res) => {
  await carService.deleteCarById(req.params.carId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createCar,
  getCars,
  getNearbyCars,
  getCar,
  updateCar,
  deleteCar,
};
