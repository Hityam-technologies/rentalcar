const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../../middlewares/auth.middleware');
const viewer360Controller = require('./viewer360.controller');

const router = express.Router();

// Configure multer for video uploads
const uploadDir = path.join(__dirname, '../../../uploads/videos');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Admin endpoint to upload video
router.post('/api/admin/cars/:carId/viewer360/upload', auth('admin'), upload.single('video'), viewer360Controller.uploadVideo);

// Public JSON data endpoint
router.get('/api/viewer360/:carId', viewer360Controller.getSpinData);

// Public HTML viewer endpoint
router.get('/viewer360/:carId', viewer360Controller.renderViewerPage);

module.exports = router;
