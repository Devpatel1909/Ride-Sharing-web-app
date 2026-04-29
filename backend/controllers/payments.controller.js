const pool = require('../db/Connect_to_sql');
const {
  emitRideAccepted,
  emitPaymentStatusUpdate,
} = require('../config/socket');

const stripeKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeKey ? require('stripe')(stripeKey) : null;

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const SUCCESS_URL = process.env.STRIPE_SUCCESS_URL || `${FRONTEND_URL}/payment/success`;
const CANCEL_URL = process.env.STRIPE_CANCEL_URL || `${FRONTEND_URL}/payment/cancel`;
const PAYMENT_FAILURE_POLICY = String(process.env.PAYMENT_FAILURE_POLICY || 'cancel').toLowerCase() === 'reopen'
  ? 'reopen'
  : 'cancel';

const nonCashMethods = new Set(['upi', 'card', 'wallet']);

const isNonCashMethod = (method) => nonCashMethods.has(String(method || '').toLowerCase());

async function createCheckoutSessionForRide(ride) {
  if (!stripe) {
    throw new Error('Stripe is not configured. Add STRIPE_SECRET_KEY in backend env.');
  }

  const amount = Math.max(0, Math.round(Number(ride.fare || 0) * 100));
  if (!amount) {
    throw new Error('Invalid ride fare for payment');
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'inr',
          unit_amount: amount,
          product_data: {
            name: `Ride #${ride.id}`,
            description: `${ride.pickup_location} -> ${ride.destination}`,
          },
        },
      },
    ],
    success_url: `${SUCCESS_URL}?rideId=${ride.id}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${CANCEL_URL}?rideId=${ride.id}&session_id={CHECKOUT_SESSION_ID}`,
    metadata: {
      rideId: String(ride.id),
      passengerId: String(ride.passenger_id),
      riderId: String(ride.rider_id || ''),
      paymentMethod: String(ride.payment_method || 'card'),
    },
  });

  await pool.query(
    `UPDATE rides
     SET stripe_session_id = $1,
         payment_status = 'pending',
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $2`,
    [session.id, ride.id]
  );

  return session;
}

exports.createCheckoutSessionForRide = createCheckoutSessionForRide;

exports.createCheckoutSession = async (req, res) => {
  try {
    const passengerId = req.user?.userId;
    const { rideId } = req.body || {};

    if (!passengerId) {
      return res.status(401).json({ error: 'Unauthorized - please login' });
    }

    if (!rideId) {
      return res.status(400).json({ error: 'rideId is required' });
    }

    const rideResult = await pool.query(
      `SELECT id, passenger_id, rider_id, pickup_location, destination, fare, status, payment_method, payment_status
       FROM rides
       WHERE id = $1 AND passenger_id = $2`,
      [rideId, passengerId]
    );

    if (!rideResult.rows.length) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    const ride = rideResult.rows[0];

    if (!isNonCashMethod(ride.payment_method)) {
      return res.status(400).json({ error: 'This ride does not require online payment' });
    }

    if (ride.payment_status === 'completed') {
      return res.status(200).json({
        success: true,
        paymentStatus: 'completed',
        message: 'Payment already completed',
      });
    }

    if (ride.status !== 'accepted' || !ride.rider_id) {
      return res.status(400).json({ error: 'Payment can start only after a rider accepts the ride' });
    }

    const session = await createCheckoutSessionForRide(ride);

    emitPaymentStatusUpdate({
      rideId: ride.id,
      passengerId: ride.passenger_id,
      riderId: ride.rider_id,
      paymentStatus: 'pending',
      message: 'Passenger is completing payment',
    });

    return res.json({
      success: true,
      rideId: ride.id,
      paymentStatus: 'pending',
      checkoutUrl: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return res.status(500).json({ error: error.message || 'Failed to create checkout session' });
  }
};

exports.getPaymentStatus = async (req, res) => {
  try {
    const { rideId } = req.params;
    const passengerId = req.user?.userId;
    const riderId = req.rider?.riderId;

    if (!passengerId && !riderId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const params = [rideId];
    let authClause = '';

    if (passengerId) {
      params.push(passengerId);
      authClause = 'AND r.passenger_id = $2';
    } else {
      params.push(riderId);
      authClause = 'AND r.rider_id = $2';
    }

    const result = await pool.query(
      `SELECT r.id, r.status, r.payment_method, r.payment_status, r.stripe_session_id AS stripe_checkout_session_id,
              r.rider_id, r.passenger_id,
              CONCAT(ri.first_name, ' ', ri.last_name) AS rider_name,
              ri.phone AS rider_phone,
              ri.vehicle_type,
              ri.vehicle_plate AS vehicle_number,
              r.pickup_location,
              r.destination
       FROM rides r
       LEFT JOIN riders ri ON r.rider_id = ri.id
       WHERE r.id = $1 ${authClause}`,
      params
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    return res.json({ success: true, ride: result.rows[0] });
  } catch (error) {
    console.error('Error fetching payment status:', error);
    return res.status(500).json({ error: 'Failed to fetch payment status' });
  }
};

exports.handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    if (stripe && webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } else {
      const payload = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : req.body;
      event = typeof payload === 'string' ? JSON.parse(payload) : payload;
    }
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const rideId = Number(session.metadata?.rideId || session.client_reference_id);

      if (!rideId) {
        return res.status(200).json({ received: true });
      }

      const updateResult = await pool.query(
        `UPDATE rides
         SET payment_status = 'completed',
             stripe_session_id = $1,
             stripe_payment_intent_id = $2,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3
         RETURNING id, passenger_id, rider_id`,
        [session.id, session.payment_intent || null, rideId]
      );

      if (updateResult.rows.length) {
        const updatedRide = updateResult.rows[0];
        const rideInfoResult = await pool.query(
          `SELECT r.id, r.passenger_id, r.rider_id,
                  ri.first_name, ri.last_name, ri.phone, ri.vehicle_type, ri.vehicle_model,
                  ri.vehicle_plate, ri.current_location
           FROM rides r
           LEFT JOIN riders ri ON r.rider_id = ri.id
           WHERE r.id = $1`,
          [rideId]
        );

        const rideInfo = rideInfoResult.rows[0] || {};

        emitPaymentStatusUpdate({
          rideId,
          passengerId: updatedRide.passenger_id,
          riderId: updatedRide.rider_id,
          paymentStatus: 'completed',
          rideStatus: 'accepted',
          message: 'Payment completed successfully',
        });

        // Confirm acceptance to passenger only after payment is complete.
        emitRideAccepted(updatedRide.passenger_id, {
          rideId,
          riderId: updatedRide.rider_id,
          riderName: `${rideInfo.first_name || ''} ${rideInfo.last_name || ''}`.trim(),
          riderPhone: rideInfo.phone || '',
          vehicleType: rideInfo.vehicle_type || '',
          vehicleModel: rideInfo.vehicle_model || '',
          vehiclePlate: rideInfo.vehicle_plate || '',
          riderLocation: rideInfo.current_location || null,
          paymentStatus: 'completed',
        });
      }
    }

    if (event.type === 'checkout.session.expired' || event.type === 'checkout.session.async_payment_failed') {
      const session = event.data.object;
      const rideId = Number(session.metadata?.rideId || session.client_reference_id);

      if (rideId) {
        const rideResult = await pool.query(
          `SELECT id, passenger_id, rider_id, status
           FROM rides
           WHERE id = $1`,
          [rideId]
        );

        if (rideResult.rows.length) {
          const existingRide = rideResult.rows[0];
          let failedRide;

          if (PAYMENT_FAILURE_POLICY === 'reopen') {
            const reopenedResult = await pool.query(
              `UPDATE rides
               SET payment_status = 'failed',
                   status = 'pending',
                   rider_id = NULL,
                   accepted_at = NULL,
                   cancelled_at = NULL,
                   updated_at = CURRENT_TIMESTAMP
               WHERE id = $1
               RETURNING id, passenger_id, rider_id, status`,
              [rideId]
            );
            failedRide = reopenedResult.rows[0];
          } else {
            const cancelledResult = await pool.query(
              `UPDATE rides
               SET payment_status = 'failed',
                   status = 'cancelled',
                   cancelled_at = CURRENT_TIMESTAMP,
                   updated_at = CURRENT_TIMESTAMP
               WHERE id = $1
               RETURNING id, passenger_id, rider_id, status`,
              [rideId]
            );
            failedRide = cancelledResult.rows[0];
          }

          if (!failedRide) {
            failedRide = { ...existingRide, status: existingRide.status || 'pending' };
          }

          emitPaymentStatusUpdate({
            rideId,
            passengerId: failedRide.passenger_id,
            riderId: existingRide.rider_id,
            paymentStatus: 'failed',
            rideStatus: failedRide.status,
            message: PAYMENT_FAILURE_POLICY === 'reopen'
              ? 'Payment failed. Ride has been reopened for matching.'
              : 'Payment failed. Ride has been cancelled.',
          });
        }
      }
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error handling Stripe webhook:', error);
    return res.status(500).json({ error: 'Webhook handling failed' });
  }
};
