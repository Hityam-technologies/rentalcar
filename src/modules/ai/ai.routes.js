const express = require('express');
const auth = require('../../middlewares/auth.middleware');
const aiController = require('./ai.controller');

const router = express.Router();

// Role-based AI assistant
// Admins get insights, Users get booking help
router.post('/chat', auth(), aiController.getAssistantResponse);

// Advanced AI Features
router.get('/recommendations', auth('user'), aiController.getRecommendations);
router.get('/admin/pricing-suggestions', auth('admin'), aiController.getPricingSuggestions);

module.exports = router;
