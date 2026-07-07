const express = require('express');
const mediaController = require('./media.controller');

const router = express.Router();

router.get('/:type/:filename', mediaController.getMedia);
router.get('/:filename', mediaController.getMedia); // Fallback

module.exports = router;
