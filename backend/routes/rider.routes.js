const express = require('express');
const router = express.Router();
const riderController = require('../controllers/rider.controller');
const { authenticateRider } = require('../middleware/rider.middleware');

router.post('/signup', riderController.signup);
router.post('/login', riderController.login);
router.get('/profile', authenticateRider, riderController.getProfile);

module.exports = router;