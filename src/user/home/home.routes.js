const express = require('express');
const auth = require('../../middlewares/auth.middleware');
const homeController = require('./home.controller');

const router = express.Router();

router.get('/feed', auth({ optional: true }), homeController.getHomeFeed);

module.exports = router;
