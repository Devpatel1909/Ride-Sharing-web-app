const Stripe = require('stripe');
const pool = require('../db/Connect_to_sql');
const { notifyRidersForRide, parseLocation } = require('../services/ride-notification.service');

const getStripe = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  return new Stripe(secretKey);
};

const buildPickupCoordinates = (pickupLocation) => {
  const parsed = parseLocation(pickupLocation);
  if (!parsed) return null;
  return { lat: parsed.lat, lng: parsed.lng };
};

exports.handleStripeWebhook = async (req, res) => {
  let event;

  try {
    const stripe = getStripe();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      return res.status(500).send('STRIPE_WEBHOOK_SECRET is not configured');
    }

    const signature = req.headers['stripe-signature'];
    event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
  } catch (err) {
    console.error('Stripe webhook verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const rideId = parseInt(session.metadata?.rideId, 10);

      if (!rideId) {
        return res.status(200).json({ received: true });
      }

      const updateResult = await pool.query(
        `
          UPDATE rides
          SET
            payment_status = 'completed',
            stripe_session_id = $1,
            stripe_payment_intent_id = $2,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $3
          RETURNING *
        `,
        [session.id, session.payment_intent || null, rideId]
      );

      const ride = updateResult.rows[0];
      if (ride && ride.status === 'pending') {
        const nearbyRiders = await notifyRidersForRide({
          rideId: ride.id,
          passengerId: ride.passenger_id,
          pickup: ride.pickup_location,
          destination: ride.destination,
          distance: ride.distance,
          fare: ride.fare,
          rideType: ride.ride_type,
          vehicleType: ride.vehicle_type,
          pickupCoordinates: buildPickupCoordinates(ride.pickup_location),
          selectedRiderId: ride.selected_rider_id || null
        });

        console.log(`Payment completed for ride ${ride.id}; notified ${nearbyRiders.length} riders.`);
      }
    }

    if (event.type === 'checkout.session.expired') {
      const session = event.data.object;
      const rideId = parseInt(session.metadata?.rideId, 10);

      if (rideId) {
        await pool.query(
          `
            UPDATE rides
            SET payment_status = 'failed', updated_at = CURRENT_TIMESTAMP
            WHERE id = $1 AND payment_status = 'pending'
          `,
          [rideId]
        );
      }
    }

    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object;
      await pool.query(
        `
          UPDATE rides
          SET payment_status = 'failed', updated_at = CURRENT_TIMESTAMP
          WHERE stripe_payment_intent_id = $1
        `,
        [paymentIntent.id]
      );
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error handling Stripe webhook:', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
};

exports.cancelPendingPayment = async (req, res) => {
  try {
    const passengerId = req.user?.userId;
    const { rideId } = req.params;

    if (!passengerId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await pool.query(
      `
        UPDATE rides
        SET payment_status = 'failed', updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
          AND passenger_id = $2
          AND status = 'pending'
          AND payment_status = 'pending'
        RETURNING id
      `,
      [rideId, passengerId]
    );

    if (result.rows.length === 0) {
      return res.json({ success: true, message: 'No pending payment to cancel' });
    }

    return res.json({ success: true, message: 'Pending payment cancelled' });
  } catch (error) {
    console.error('Error cancelling pending payment:', error);
    return res.status(500).json({ error: 'Failed to cancel pending payment' });
  }
};
