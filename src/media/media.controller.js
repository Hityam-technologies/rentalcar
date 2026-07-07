const mongoose = require('mongoose');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status').default;

const getMedia = catchAsync(async (req, res) => {
  const { filename } = req.params;
  
  if (!mongoose.connection.db) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Database connection not ready');
  }

  const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: 'uploads'
  });

  // Find the file to get its content type
  const files = await bucket.find({ filename }).toArray();
  if (!files || files.length === 0) {
    throw new ApiError(httpStatus.NOT_FOUND, 'File not found');
  }

  const file = files[0];
  if (file.contentType) {
    res.set('Content-Type', file.contentType);
  }

  const downloadStream = bucket.openDownloadStreamByName(filename);
  downloadStream.on('error', () => {
    res.status(httpStatus.NOT_FOUND).send({ message: 'File not found' });
  });

  downloadStream.pipe(res);
});

module.exports = { getMedia };
