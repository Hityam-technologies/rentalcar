const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const httpStatus = require('http-status').default;
const Car = require('../car/car.model');
const ApiError = require('../../utils/ApiError');

// Use the bundled binaries
ffmpeg.setFfmpegPath(require('ffmpeg-static'));
ffmpeg.setFfprobePath(require('ffprobe-static').path);

const extractFramesFromVideo = async (videoPath, outputFolder, carId, frameCount = 24) => {
  return new Promise((resolve, reject) => {
    // Get video duration to space out frames
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) return reject(new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to probe video file'));

      const duration = metadata.format.duration;
      const interval = duration / frameCount;
      const frames = [];

      let completed = 0;
      for (let i = 0; i < frameCount; i++) {
        const timestamp = i * interval;
        const filename = `frame_${carId}_${i}.jpg`;
        const outputPath = path.join(outputFolder, filename);

        ffmpeg(videoPath)
          .screenshots({
            timestamps: [timestamp],
            filename: filename,
            folder: outputFolder,
            size: '1024x?'
          })
          .on('end', () => {
            completed++;
            frames[i] = `/uploads/frames/${filename}`; // Public URL path
            if (completed === frameCount) {
              resolve(frames);
            }
          })
          .on('error', (err) => {
            console.error(`Error extracting frame at ${timestamp}:`, err);
            reject(new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error during frame extraction'));
          });
      }
    });
  });
};

const getCarSpinImages = async (carId) => {
  const car = await Car.findById(carId);
  if (!car) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Car not found');
  }

  if (!car.spinImages || car.spinImages.length < 8) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Car does not have enough 360-degree images (minimum 8 required). Please upload a video first.');
  }

  return {
    name: car.name,
    spinImages: car.spinImages,
  };
};

const processVideoTo360 = async (carId, videoFile) => {
  const car = await Car.findById(carId);
  if (!car) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Car not found');
  }

  const outputFolder = path.join(__dirname, '../../../uploads/frames');
  if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder, { recursive: true });
  }

  // Extract 24 frames
  const frames = await extractFramesFromVideo(videoFile.path, outputFolder, carId, 24);

  // Update car model
  car.spinImages = frames;
  await car.save();

  // Clean up original video file after processing
  try {
    fs.unlinkSync(videoFile.path);
  } catch (e) {
    console.error('Failed to delete temporary video file:', e);
  }

  return car;
};

module.exports = {
  getCarSpinImages,
  processVideoTo360,
};
