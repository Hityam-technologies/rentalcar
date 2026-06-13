const httpStatus = require('http-status').default;
const Car = require('../../shared/models/car.model');
const ApiError = require('../../utils/ApiError');
const { formatCarListItem, formatCarDetail } = require('../../shared/utils/carFormatter.util');

const buildQuery = (filter) => {
  const query = {};
  if (filter.priceMax) query.pricePerDay = { ...query.pricePerDay, $lte: Number(filter.priceMax) };
  if (filter.priceMin) query.pricePerDay = { ...query.pricePerDay, $gte: Number(filter.priceMin) };
  if (filter.type) query.type = new RegExp(filter.type, 'i');
  if (filter.category) query.category = new RegExp(filter.category, 'i');
  if (filter.brand) query.brand = new RegExp(filter.brand, 'i');
  if (filter.search) {
    query.$or = [
      { name: new RegExp(filter.search, 'i') },
      { brand: new RegExp(filter.search, 'i') },
      { type: new RegExp(filter.search, 'i') },
      { subtitle: new RegExp(filter.search, 'i') },
    ];
  }
  if (filter.isAvailable !== undefined) {
    query.isAvailable = filter.isAvailable === 'true' || filter.isAvailable === true;
  }
  if (filter.status) query.status = filter.status;

  let geoQuery = null;
  if (filter.lat && filter.lng) {
    const lat = parseFloat(filter.lat);
    const lng = parseFloat(filter.lng);
    const radiusInMeters = filter.maxDistance ? parseFloat(filter.maxDistance) : 50000;
    if (!isNaN(lat) && !isNaN(lng)) {
      geoQuery = {
        location: {
          $near: {
            $geometry: { type: 'Point', coordinates: [lng, lat] },
            $maxDistance: radiusInMeters,
          },
        },
      };
    }
  }
  return geoQuery ? { ...query, ...geoQuery } : query;
};

const queryCars = async (filter) => {
  const cars = await Car.find(buildQuery(filter));
  return cars.map(formatCarListItem);
};

const getCarById = async (id) => {
  const car = await Car.findById(id);
  if (!car) throw new ApiError(httpStatus.NOT_FOUND, 'Car not found');
  return formatCarDetail(car);
};

module.exports = { queryCars, getCarById, buildQuery };
