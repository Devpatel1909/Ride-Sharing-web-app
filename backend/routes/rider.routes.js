const express = require('express');
const router = express.Router();
const riderController = require('../controllers/rider.controller');
const dashboardController = require('../controllers/dashboard.controller');
const { authenticateRider } = require('../middleware/rider.middleware');

// Auth routes
router.post('/signup', riderController.signup);
router.post('/login', riderController.login);
router.get('/profile', authenticateRider, riderController.getProfile);

// Dashboard routes
router.get('/dashboard/stats', authenticateRider, dashboardController.getRiderStats);
router.get('/dashboard/pending-requests', authenticateRider, dashboardController.getPendingRequests);
router.post('/dashboard/availability', authenticateRider, dashboardController.updateAvailability);
router.get('/dashboard/recent-activity', authenticateRider, dashboardController.getRecentActivity);

// Ride management routes
router.post('/rides/accept/:rideId', authenticateRider, dashboardController.acceptRide);
router.post('/rides/reject/:rideId', authenticateRider, dashboardController.rejectRide);

module.exports = router;