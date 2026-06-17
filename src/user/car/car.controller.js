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
    transmission: req.query.transmission,
    fuel: req.query.fuel,
    minSeats: req.query.minSeats,
    startDate: req.query.startDate,
    endDate: req.query.endDate,
  };
  
  const options = {
    sortBy: req.query.sortBy,
    order: req.query.order,
    limit: req.query.limit ? parseInt(req.query.limit, 10) : 10,
    page: req.query.page ? parseInt(req.query.page, 10) : 1,
  };

  const result = await carService.queryCars(filter, options);
  res.send(result);
});

const getNearbyCars = catchAsync(async (req, res) => {
  const { lat, lng } = req.query;
  if (!lat || !lng) throw new ApiError(httpStatus.BAD_REQUEST, 'Latitude and longitude are required for nearby search');
  const result = await carService.queryCars({ ...req.query, lat, lng });
  res.send(result);
});

const getCar = catchAsync(async (req, res) => {
  const car = await carService.getCarById(req.params.carId || req.params.id);
  res.send(car);
});

module.exports = { getCars, getNearbyCars, getCar };
