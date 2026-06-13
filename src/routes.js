const express = require('express');
const userRoutes = require('./user/routes');
const adminRoutes = require('./admin/routes');

const router = express.Router();

router.use('/', userRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
