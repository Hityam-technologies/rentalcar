const express = require('express');
const auth = require('../../middlewares/auth.middleware');
const dashboardController = require('./dashboard.controller');

const router = express.Router();

router.get('/stats', auth('admin'), dashboardController.getStats);
router.get('/insights', auth('admin'), dashboardController.getInsights);

module.exports = router;
