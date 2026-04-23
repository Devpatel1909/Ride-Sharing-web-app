const express = require('express');
const router = express.Router();
const paymentsController = require('../controllers/payments.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

router.post('/stripe/webhook', paymentsController.handleStripeWebhook);
router.post('/ride/:rideId/cancel', authenticateToken, paymentsController.cancelPendingPayment);

module.exports = router;
