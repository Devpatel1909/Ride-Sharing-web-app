const express = require('express');
const router = express.Router();
const ridesController = require('../controllers/rides.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { authenticateRider } = require('../middleware/rider.middleware');

// Public/Passenger routes
router.post('/check-availability', ridesController.checkAvailability);
router.post('/book', authenticateToken, ridesController.bookRide);
router.get('/:rideId', ridesController.getRideDetails);

// Shared ride routes
router.post('/shared-available', authenticateToken, ridesController.getSharedAvailableRides);
router.post('/join-shared/:rideId', authenticateToken, ridesController.joinSharedRide);
router.get('/:rideId/passengers', ridesController.getRidePassengers);
router.put('/:rideId/passengers/:passengerId/status', authenticateRider, ridesController.updatePassengerStatus);

// Rider routes
router.put('/:rideId/status', authenticateRider, ridesController.updateRideStatus);

module.exports = router;
