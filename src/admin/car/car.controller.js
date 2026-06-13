const httpStatus = require('http-status').default;
const catchAsync = require('../../utils/catchAsync');
const carService = require('./car.service');

const getCars = catchAsync(async (req, res) => {
  const cars = await carService.queryCars(req.query);
  res.send({ results: cars.length, data: cars });
});

const getCar = catchAsync(async (req, res) => {
  const car = await carService.getCarById(req.params.carId || req.params.id);
  res.send(car);
});

const createCar = catchAsync(async (req, res) => {
  const imagePaths = (req.files || []).map((f) => `/uploads/images/${f.filename}`);
  const car = await carService.createCar(req.body, imagePaths);
  res.status(httpStatus.CREATED).send(car);
});

const updateCar = catchAsync(async (req, res) => {
  const imagePaths = (req.files || []).map((f) => `/uploads/images/${f.filename}`);
  const car = await carService.updateCar(req.params.carId || req.params.id, req.body, imagePaths);
  res.send(car);
});

const deleteCar = catchAsync(async (req, res) => {
  await carService.deleteCar(req.params.carId || req.params.id);
  res.status(httpStatus.NO_CONTENT).send();
});

const getCarDocuments = catchAsync(async (req, res) => {
  const docs = await carService.getCarDocuments(req.params.carId || req.params.id);
  res.send({ results: docs.length, data: docs });
});

const refreshAIPredictions = catchAsync(async (req, res) => {
  const updatedCount = await carService.refreshAllAIPredictions();
  res.send({ message: `Successfully refreshed AI predictions for ${updatedCount} cars.` });
});

module.exports = { getCars, getCar, createCar, updateCar, deleteCar, getCarDocuments, refreshAIPredictions };
