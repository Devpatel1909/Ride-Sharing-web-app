const express = require('express');
const router = express.Router();
const ridesController = require('../controllers/rides.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { authenticateRider } = require('../middleware/rider.middleware');

// Public/Passenger routes
router.post('/check-availability', ridesController.checkAvailability);
router.post('/book', authenticateToken, ridesController.bookRide);
router.get('/:rideId', ridesController.getRideDetails);

// Rider routes
router.put('/:rideId/status', authenticateRider, ridesController.updateRideStatus);

module.exports = router;
