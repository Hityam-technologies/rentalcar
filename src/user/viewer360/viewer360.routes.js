const express = require('express');
const viewer360Controller = require('./viewer360.controller');

const router = express.Router();

router.get('/:carId/url', viewer360Controller.getViewerUrl);
router.get('/:carId', viewer360Controller.getSpinData);

module.exports = router;
