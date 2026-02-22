const express = require('express');
const router = express.Router();
const geocodingController = require('../controllers/geocoding.controller');

// Geocode an address
router.get('/geocode', geocodingController.geocode);

// Get route between two points
router.get('/route', geocodingController.getRoute);

// Reverse geocode coordinates to place/address
router.get('/reverse', geocodingController.reverseGeocode);

module.exports = router;
