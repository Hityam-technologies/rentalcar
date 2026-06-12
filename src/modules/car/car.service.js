const httpStatus = require('http-status').default;
const Car = require('./car.model');
const ApiError = require('../../utils/ApiError');

const createCar = async (carBody) => {
  return Car.create(carBody);
};

const queryCars = async (filter, options) => {
  const query = {};

  if (filter.priceMax) {
    query.pricePerDay = { $lte: filter.priceMax };
  }
  if (filter.priceMin) {
    query.pricePerDay = { ...query.pricePerDay, $gte: filter.priceMin };
  }
  if (filter.type) {
    query.type = filter.type;
  }
  if (filter.brand) {
    query.brand = filter.brand;
  }
  if (filter.isAvailable !== undefined) {
    query.isAvailable = filter.isAvailable === 'true' || filter.isAvailable === true;
  }

  // Handle geospatial query for nearby cars
  let geoQuery = null;
  if (filter.lat && filter.lng) {
    const lat = parseFloat(filter.lat);
    const lng = parseFloat(filter.lng);
    const radiusInMeters = filter.maxDistance ? parseFloat(filter.maxDistance) : 50000; // default 50km

    if (!isNaN(lat) && !isNaN(lng)) {
      geoQuery = {
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [lng, lat], // Mongo expects [longitude, latitude]
            },
            $maxDistance: radiusInMeters,
          },
        },
      };
    }
  }

  const finalQuery = geoQuery ? { ...query, ...geoQuery } : query;
  
  const cars = await Car.find(finalQuery);
  return cars;
};

const getCarById = async (id) => {
  return Car.findById(id);
};

const updateCarById = async (carId, updateBody) => {
  const car = await getCarById(carId);
  if (!car) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Car not found');
  }
  Object.assign(car, updateBody);
  await car.save();
  return car;
};

const deleteCarById = async (carId) => {
  const car = await getCarById(carId);
  if (!car) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Car not found');
  }
  await car.deleteOne();
  return car;
};

module.exports = {
  createCar,
  queryCars,
  getCarById,
  updateCarById,
  deleteCarById,
};
