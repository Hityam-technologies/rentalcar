const express = require('express');
const auth = require('../../middlewares/auth.middleware');
const { optionalVideo } = require('../../shared/middlewares/upload.middleware');
const viewer360Controller = require('./viewer360.controller');

const router = express.Router();

router.post('/api/admin/cars/:carId/viewer360/upload', auth('admin'), optionalVideo, viewer360Controller.uploadVideo);

module.exports = router;
