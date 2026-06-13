const express = require('express');
const auth = require('../../middlewares/auth.middleware');
const profileController = require('./profile.controller');

const router = express.Router();

router.get('/me', auth(), profileController.getMe);
router.patch('/me', auth(), profileController.updateMe);
router.put('/me/favorites', auth(), profileController.toggleFavorite);
router.get('/me/referrals', auth(), profileController.getReferrals);
router.get('/static-pages', profileController.getStaticPages);

module.exports = router;
