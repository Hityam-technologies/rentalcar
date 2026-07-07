const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const httpStatus = require('http-status').default;
const Car = require('../models/car.model');
const ApiError = require('../../utils/ApiError');

ffmpeg.setFfmpegPath(require('ffmpeg-static'));
ffmpeg.setFfprobePath(require('ffprobe-static').path);

const MIN_SPIN_FRAMES = 8;
const DEFAULT_FRAME_COUNT = 24;

const config = require('../../config/env');
const getBaseUrl = () => config.baseUrl;

const buildViewerUrls = (car) => {
  const has360 = Array.isArray(car.spinImages) && car.spinImages.length >= MIN_SPIN_FRAMES;
  const base = getBaseUrl();
  return {
    has360,
    view360Url: has360 ? `${base}/viewer360/${car._id}` : '',
    viewerDataUrl: `/api/user/viewer360/${car._id}`,
    legacyDataUrl: `/api/viewer360/${car._id}`,
    frameCount: car.spinImages?.length || 0,
  };
};

const extractFramesFromVideo = async (videoPath, outputFolder, carId, frameCount = DEFAULT_FRAME_COUNT) => {
  if (!fs.existsSync(outputFolder)) fs.mkdirSync(outputFolder, { recursive: true });

  const metadata = await new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, data) => (err ? reject(err) : resolve(data)));
  });

  const duration = metadata.format.duration;
  if (!duration || duration <= 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid video duration');
  }

  const frames = [];
  for (let i = 0; i < frameCount; i++) {
    const timestamp = i * (duration / frameCount);
    const filename = `frame_${carId}_${i}.jpg`;
    const outputPath = path.join(outputFolder, filename);

    await new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .screenshots({ timestamps: [timestamp], filename, folder: outputFolder, size: '1024x?' })
        .on('end', resolve)
        .on('error', reject);
    });

    frames.push(outputPath);
  }

  return frames;
};

const getCarSpinImages = async (carId, { strict = false } = {}) => {
  const car = await Car.findById(carId);
  if (!car) throw new ApiError(httpStatus.NOT_FOUND, 'Car not found');

  const urls = buildViewerUrls(car);
  if (strict && !urls.has360) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Car does not have enough 360-degree images (minimum ${MIN_SPIN_FRAMES} required). Please upload a video first.`
    );
  }

  return {
    id: car._id,
    name: car.name,
    spinImages: car.spinImages || [],
    ...urls,
  };
};

const processVideoTo360 = async (carId, videoFile) => {
  const car = await Car.findById(carId);
  if (!car) throw new ApiError(httpStatus.NOT_FOUND, 'Car not found');

  const outputFolder = path.join(__dirname, '../../../uploads/frames');
  const localFrames = await extractFramesFromVideo(videoFile.path, outputFolder, carId.toString(), DEFAULT_FRAME_COUNT);

  const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: 'uploads'
  });

  const gridFsUrls = [];
  for (const absolutePath of localFrames) {
    const filename = path.basename(absolutePath);
    
    await new Promise((resolve, reject) => {
      fs.createReadStream(absolutePath)
        .pipe(bucket.openUploadStream(filename, { contentType: 'image/jpeg' }))
        .on('error', reject)
        .on('finish', resolve);
    });

    gridFsUrls.push(`/api/media/images/${filename}`);
    
    try {
      fs.unlinkSync(absolutePath);
    } catch (e) {
      console.error('Failed to delete temporary frame file:', e);
    }
  }

  car.spinImages = gridFsUrls;
  car.view360Url = `${getBaseUrl()}/viewer360/${car._id}`;
  await car.save();

  try {
    fs.unlinkSync(videoFile.path);
  } catch (e) {
    console.error('Failed to delete temporary video file:', e);
  }

  return car;
};

const assertCarOwner = async (carId, ownerId) => {
  const car = await Car.findById(carId);
  if (!car) throw new ApiError(httpStatus.NOT_FOUND, 'Car not found');
  if (!car.owner || car.owner.toString() !== ownerId.toString()) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Not authorized to manage this car');
  }
  return car;
};

module.exports = {
  MIN_SPIN_FRAMES,
  getBaseUrl,
  buildViewerUrls,
  getCarSpinImages,
  processVideoTo360,
  assertCarOwner,
};
