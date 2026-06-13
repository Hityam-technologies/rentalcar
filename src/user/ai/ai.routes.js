const express = require('express');
const auth = require('../../middlewares/auth.middleware');
const aiController = require('./ai.controller');

const router = express.Router();

router.post('/chat', auth(), aiController.chat);
router.get('/recommendations', auth(), aiController.getRecommendations);

module.exports = router;
