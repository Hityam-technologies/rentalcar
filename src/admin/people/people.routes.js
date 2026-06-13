const express = require('express');
const auth = require('../../middlewares/auth.middleware');
const peopleController = require('./people.controller');

const router = express.Router();

router.get('/clients', auth('admin'), peopleController.getClients);
router.get('/clients/:id', auth('admin'), peopleController.getClient);
router.get('/staff', auth('admin'), peopleController.getStaff);
router.get('/staff/:id', auth('admin'), peopleController.getStaffMember);
router.post('/staff/payout', auth('admin'), peopleController.registerPayout);
router.post('/staff/:id/payout', auth('admin'), peopleController.registerPayout);

module.exports = router;
