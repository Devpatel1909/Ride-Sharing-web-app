const express = require('express');
const router = express.Router();
const paymentsController = require('../controllers/payments.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { authenticateRider } = require('../middleware/rider.middleware');

router.post('/checkout-session', authenticateToken, paymentsController.createCheckoutSession);
router.get('/status/:rideId', authenticateToken, paymentsController.getPaymentStatus);
router.get('/rider/status/:rideId', authenticateRider, paymentsController.getPaymentStatus);
router.post('/stripe/webhook', paymentsController.handleStripeWebhook);
router.post('/ride/:rideId/cancel', authenticateToken, paymentsController.cancelPendingPayment);

module.exports = router;
