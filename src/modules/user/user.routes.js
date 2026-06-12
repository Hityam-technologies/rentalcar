const express = require('express');
const auth = require('../../middlewares/auth.middleware');
const userController = require('./user.controller');

const router = express.Router();

router.get('/me', auth(), userController.getMe);
router.patch('/me', auth(), userController.updateMe);

module.exports = router;
