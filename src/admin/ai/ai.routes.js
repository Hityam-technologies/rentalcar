const express = require('express');
const auth = require('../../middlewares/auth.middleware');
const aiController = require('./ai.controller');

const router = express.Router();

router.get('/config', auth('admin'), aiController.getConfig);
router.post('/chat', auth('admin'), aiController.chat);

module.exports = router;
