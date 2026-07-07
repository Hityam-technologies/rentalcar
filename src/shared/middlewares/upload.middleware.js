const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { GridFsStorage } = require('multer-gridfs-storage');
const config = require('../../config/env');

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const imageStorage = new GridFsStorage({
  url: config.mongodb.uri,
  options: { useNewUrlParser: true, useUnifiedTopology: true },
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const filename = `car-${unique}${path.extname(file.originalname)}`;
      resolve({
        filename: filename,
        bucketName: 'uploads'
      });
    });
  }
});

const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../../uploads/videos');
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `video-${unique}${path.extname(file.originalname)}`);
  },
});

const uploadCarImages = multer({
  storage: imageStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'), false);
  },
});

const uploadVideo = multer({
  storage: videoStorage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) cb(null, true);
    else cb(new Error('Only video files are allowed'), false);
  },
});

const optionalCarImages = (req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('multipart/form-data')) {
    return uploadCarImages.array('images', 10)(req, res, next);
  }
  return next();
};

const optionalVideo = (req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('multipart/form-data')) {
    return uploadVideo.single('video')(req, res, next);
  }
  return next();
};

module.exports = { uploadCarImages, uploadVideo, optionalCarImages, optionalVideo };
