const express = require('express');
const auth = require('../../middlewares/auth.middleware');
const { optionalCarImages, optionalVideo } = require('../../shared/middlewares/upload.middleware');
const hostController = require('./host.controller');

const router = express.Router();

router.get('/dashboard', auth(), hostController.getDashboard);
router.get('/listings', auth(), hostController.getListings);
router.post('/listings', auth(), optionalCarImages, hostController.createListing);
router.put('/listings/:id', auth(), optionalCarImages, hostController.updateListing);
router.get('/cars/:id/documents', auth(), hostController.getCarDocuments);
router.post('/cars/:id/viewer360/upload', auth(), optionalVideo, hostController.upload360Video);

module.exports = router;
