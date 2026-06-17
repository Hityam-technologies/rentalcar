const httpStatus = require('http-status').default;
const Car = require('../../shared/models/car.model');
const Booking = require('../../shared/models/booking.model');
const CarDocument = require('../../shared/models/document.model');
const User = require('../../shared/models/user.model');
const ApiError = require('../../utils/ApiError');
const { formatCarListItem } = require('../../shared/utils/carFormatter.util');

const getDashboard = async (ownerId) => {
  const [cars, earnings] = await Promise.all([
    Car.find({ owner: ownerId }),
    Booking.aggregate([
      { $match: { host: ownerId, status: { $in: ['confirmed', 'current', 'completed', 'approved'] } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]),
  ]);

  const total = cars.length;
  const available = cars.filter((c) => c.status === 'Available').length;
  const rented = cars.filter((c) => c.status === 'On Trip').length;

  return {
    total,
    available,
    rented,
    totalEarnings: earnings[0]?.total || 0,
  };
};

const getListings = async (ownerId, statusFilter) => {
  const query = { owner: ownerId };
  if (statusFilter && statusFilter !== 'all') query.status = statusFilter;
  const cars = await Car.find(query).sort({ createdAt: -1 });
  return cars.map(formatCarListItem);
};

const createListing = async (ownerId, body, imagePaths = []) => {
  const carData = { ...body };
  if (!carData.location?.coordinates?.length) delete carData.location;
  Object.assign(carData, {
    owner: ownerId,
    images: imagePaths.length ? imagePaths : body.images || [],
    specs: body.specs || {},
    features: body.features || [],
    status: body.status || 'Pending Approval',
  });
  const car = await Car.create(carData);
  await User.findByIdAndUpdate(ownerId, { $inc: { 'hostMetrics.totalListings': 1 }, role: 'host' });
  return formatCarListItem(car);
};

const updateListing = async (ownerId, carId, body, imagePaths = []) => {
  const car = await Car.findOne({ _id: carId, owner: ownerId });
  if (!car) throw new ApiError(httpStatus.NOT_FOUND, 'Listing not found');
  Object.assign(car, body);
  if (body.specs) car.markModified('specs');
  if (imagePaths.length) car.images = [...car.images, ...imagePaths];
  await car.save();
  return formatCarListItem(car);
};

const getCarDocuments = async (ownerId, carId) => {
  const car = await Car.findOne({ _id: carId, owner: ownerId });
  if (!car) throw new ApiError(httpStatus.NOT_FOUND, 'Car not found');
  return CarDocument.find({ car: carId });
};

const upload360Video = async (ownerId, carId, videoFile) => {
  const viewer360Service = require('../../shared/services/viewer360.service');
  await viewer360Service.assertCarOwner(carId, ownerId);
  if (!videoFile) throw new ApiError(httpStatus.BAD_REQUEST, 'Please upload a video file');
  const car = await viewer360Service.processVideoTo360(carId, videoFile);
  const urls = viewer360Service.buildViewerUrls(car);
  return {
    message: '360° video processed successfully',
    car: { id: car._id, name: car.name, spinImages: car.spinImages, frameCount: car.spinImages.length, ...urls },
  };
};

module.exports = { getDashboard, getListings, createListing, updateListing, getCarDocuments, upload360Video };
