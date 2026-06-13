const express = require('express');
const auth = require('../../middlewares/auth.middleware');
const revenueController = require('./revenue.controller');

const router = express.Router();

router.get('/', auth('admin'), revenueController.getRevenue);

module.exports = router;
