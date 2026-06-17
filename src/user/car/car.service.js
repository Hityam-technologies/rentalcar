const httpStatus = require('http-status').default;
const Car = require('../../shared/models/car.model');
const ApiError = require('../../utils/ApiError');
const { formatCarListItem, formatCarDetail } = require('../../shared/utils/carFormatter.util');
const Booking = require('../../shared/models/booking.model');

const buildQuery = (filter) => {
  const query = {};
  if (filter.priceMax) query.pricePerDay = { ...query.pricePerDay, $lte: Number(filter.priceMax) };
  if (filter.priceMin) query.pricePerDay = { ...query.pricePerDay, $gte: Number(filter.priceMin) };
  if (filter.type) query.type = new RegExp(filter.type, 'i');
  if (filter.category) query.category = new RegExp(filter.category, 'i');
  if (filter.brand) query.brand = new RegExp(filter.brand, 'i');
  const andClauses = [];

  if (filter.search) {
    andClauses.push({
      $or: [
        { name: new RegExp(filter.search, 'i') },
        { brand: new RegExp(filter.search, 'i') },
        { type: new RegExp(filter.search, 'i') },
        { subtitle: new RegExp(filter.search, 'i') },
      ]
    });
  }

  if (filter.transmission && filter.transmission !== 'All') {
    andClauses.push({
      $or: [
        { transmission: new RegExp(`^${filter.transmission}`, 'i') },
        { 'specs.transmission': new RegExp(`^${filter.transmission}`, 'i') }
      ]
    });
  }

  if (filter.fuel && filter.fuel !== 'All') {
    andClauses.push({
      $or: [
        { fuelType: new RegExp(`^${filter.fuel}$`, 'i') },
        { 'specs.fuel': new RegExp(`^${filter.fuel}$`, 'i') }
      ]
    });
  }

  if (filter.minSeats && filter.minSeats !== 'All') {
    andClauses.push({
      $or: [
        { seatingCapacity: { $gte: Number(filter.minSeats) } },
        { 'specs.seats': { $gte: Number(filter.minSeats) } }
      ]
    });
  }

  if (andClauses.length > 0) {
    query.$and = andClauses;
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

const queryCars = async (filter, options = { page: 1, limit: 10 }) => {
  const query = buildQuery(filter);

  // Check booking availability if dates are provided
  if (filter.startDate && filter.endDate) {
    const requestedStart = new Date(filter.startDate);
    const requestedEnd = new Date(filter.endDate);

    const overlappingBookings = await Booking.find({
      status: { $in: ['approved', 'current', 'confirmed'] },
      startDate: { $lt: requestedEnd },
      endDate: { $gt: requestedStart }
    }).select('car');

    const bookedCarIds = overlappingBookings.map(b => b.car);
    if (bookedCarIds.length > 0) {
      query._id = { ...query._id, $nin: bookedCarIds };
    }
  }

  const { page, limit, sortBy, order } = options;
  const skip = (page - 1) * limit;

  let sortCriteria = {};
  if (sortBy) {
      sortCriteria[sortBy] = order === 'desc' ? -1 : 1;
  } else {
      sortCriteria['createdAt'] = -1; // Default sort
  }

  const cars = await Car.find(query).sort(sortCriteria).skip(skip).limit(limit);
  const total = await Car.countDocuments(query);

  return {
    results: cars.length,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    data: cars.map(formatCarListItem)
  };
};

const getCarById = async (id) => {
  const car = await Car.findById(id);
  if (!car) throw new ApiError(httpStatus.NOT_FOUND, 'Car not found');
  return formatCarDetail(car);
};

module.exports = { queryCars, getCarById, buildQuery };
