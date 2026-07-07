const httpStatus = require('http-status').default;
const catchAsync = require('../../utils/catchAsync');
const hostService = require('./host.service');

const getDashboard = catchAsync(async (req, res) => {
  const stats = await hostService.getDashboard(req.user._id);
  res.send(stats);
});

const getListings = catchAsync(async (req, res) => {
  const listings = await hostService.getListings(req.user._id, req.query.status);
  res.send({ results: listings.length, data: listings });
});

const createListing = catchAsync(async (req, res) => {
  console.log('createListing req.body:', req.body);
  console.log('createListing req.files:', req.files ? req.files.length : 0);
  if (typeof req.body.specs === 'string') req.body.specs = JSON.parse(req.body.specs);
  if (typeof req.body.features === 'string') req.body.features = JSON.parse(req.body.features);

  const imagePaths = (req.files || []).map((f) => `/api/media/images/${f.filename}`);
  const listing = await hostService.createListing(req.user._id, req.body, imagePaths);
  res.status(httpStatus.CREATED).send(listing);
});

const updateListing = catchAsync(async (req, res) => {
  if (typeof req.body.specs === 'string') req.body.specs = JSON.parse(req.body.specs);
  if (typeof req.body.features === 'string') req.body.features = JSON.parse(req.body.features);

  const imagePaths = (req.files || []).map((f) => `/api/media/images/${f.filename}`);
  const listing = await hostService.updateListing(req.user._id, req.params.id, req.body, imagePaths);
  res.send(listing);
});

const getCarDocuments = catchAsync(async (req, res) => {
  const docs = await hostService.getCarDocuments(req.user._id, req.params.id);
  res.send({ results: docs.length, data: docs });
});

const upload360Video = catchAsync(async (req, res) => {
  const result = await hostService.upload360Video(req.user._id, req.params.id, req.file);
  res.send(result);
});

module.exports = { getDashboard, getListings, createListing, updateListing, getCarDocuments, upload360Video };
