const httpStatus = require('http-status').default;
const catchAsync = require('../../utils/catchAsync');
const ApiError = require('../../utils/ApiError');
const viewer360Service = require('../../shared/services/viewer360.service');

const uploadVideo = catchAsync(async (req, res) => {
  if (!req.file) throw new ApiError(httpStatus.BAD_REQUEST, 'Please upload a video file');
  const car = await viewer360Service.processVideoTo360(req.params.carId, req.file);
  const urls = viewer360Service.buildViewerUrls(car);
  res.send({
    message: 'Video processed successfully and 360 viewer images updated',
    car: {
      id: car._id,
      name: car.name,
      spinImages: car.spinImages,
      frameCount: car.spinImages.length,
      ...urls,
    },
  });
});

module.exports = { uploadVideo };
