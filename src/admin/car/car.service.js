const httpStatus = require('http-status').default;
const Car = require('../../shared/models/car.model');
const CarDocument = require('../../shared/models/document.model');
const ApiError = require('../../utils/ApiError');
const { formatCarListItem, formatCarDetail } = require('../../shared/utils/carFormatter.util');
const aiPredictionService = require('../../shared/services/aiPrediction.service');

const queryCars = async (filter = {}) => {
  const query = {};
  if (filter.status) query.status = filter.status;
  if (filter.category) query.category = new RegExp(filter.category, 'i');
  if (filter.type) query.type = new RegExp(filter.type, 'i');
  const cars = await Car.find(query).sort({ createdAt: -1 });
  return cars.map(formatCarListItem);
};

const getCarById = async (id) => {
  const car = await Car.findById(id);
  if (!car) throw new ApiError(httpStatus.NOT_FOUND, 'Car not found');
  return formatCarDetail(car);
};

const sanitizeLocation = (body) => {
  const data = { ...body };
  if (!data.location?.coordinates?.length) delete data.location;
  return data;
};

const createCar = async (body, imagePaths = []) => {
  let prediction = null;
  if (!body.aiPrediction) {
    prediction = await aiPredictionService.generateCarPrediction(body);
  }

  const car = await Car.create({
    ...sanitizeLocation(body),
    images: imagePaths.length ? imagePaths : body.images || [],
    specs: body.specs || {},
    features: body.features || [],
    aiPrediction: prediction || body.aiPrediction || { level: 'Medium', tip: 'Steady demand expected', colorTheme: '#4F46E5' },
    aiTip: prediction ? prediction.tip : body.aiTip || '',
  });
  return formatCarDetail(car);
};

const updateCar = async (carId, body, imagePaths = []) => {
  const car = await Car.findById(carId);
  if (!car) throw new ApiError(httpStatus.NOT_FOUND, 'Car not found');
  Object.assign(car, sanitizeLocation(body));
  if (imagePaths.length) car.images = [...car.images, ...imagePaths];

  // Optionally regenerate prediction if not manually updated
  if (!body.aiPrediction) {
    const prediction = await aiPredictionService.generateCarPrediction(car);
    if (prediction) {
      car.aiPrediction = prediction;
      car.aiTip = prediction.tip;
    }
  } else {
    car.aiPrediction = body.aiPrediction;
    if (body.aiTip) car.aiTip = body.aiTip;
  }

  await car.save();
  return formatCarDetail(car);
};

const deleteCar = async (carId) => {
  const car = await Car.findById(carId);
  if (!car) throw new ApiError(httpStatus.NOT_FOUND, 'Car not found');
  await car.deleteOne();
};

const getCarDocuments = async (carId) => CarDocument.find({ car: carId });

const refreshAllAIPredictions = async () => {
  const cars = await Car.find({});
  let updatedCount = 0;
  for (const car of cars) {
    const prediction = await aiPredictionService.generateCarPrediction(car);
    if (prediction) {
      car.aiPrediction = prediction;
      car.aiTip = prediction.tip;
      await car.save();
      updatedCount++;
    }
  }
  return updatedCount;
};

module.exports = { queryCars, getCarById, createCar, updateCar, deleteCar, getCarDocuments, refreshAllAIPredictions };
