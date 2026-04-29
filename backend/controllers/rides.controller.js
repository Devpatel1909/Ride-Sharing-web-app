const pool = require('../db/Connect_to_sql');
const Stripe = require('stripe');
const { notifyRidersForRide } = require('../services/ride-notification.service');

const VALID_PAYMENT_METHODS = ['cash', 'upi', 'card', 'wallet'];
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  return new Stripe(process.env.STRIPE_SECRET_KEY);
};

// Helper function to calculate distance between two coordinates (Haversine formula)
// Returns distance in kilometers
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
};

// Parse location string to extract coordinates
// Expected format: "Location Name (lat, lng)" or just "lat, lng"
const parseLocation = (locationString) => {
  try {
    // Try to extract coordinates from parentheses first
    const coordsMatch = locationString.match(/\(([^,]+),\s*([^)]+)\)/);
    if (coordsMatch) {
      return {
        lat: parseFloat(coordsMatch[1]),
        lng: parseFloat(coordsMatch[2])
      };
    }
    
    // Try direct lat, lng format
    const parts = locationString.split(',').map(s => s.trim());
    if (parts.length >= 2) {
      const lat = parseFloat(parts[0]);
      const lng = parseFloat(parts[1]);
      if (!isNaN(lat) && !isNaN(lng)) {
        return { lat, lng };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing location:', error);
    return null;
  }
};

// Check ride availability based on location and distance
exports.checkAvailability = async (req, res) => {
  try {
    const { pickup, destination, distance, pickupLat, pickupLon } = req.body;

    if (!pickup || !destination || !distance) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const allVehicleIds = ['bike', 'auto', 'car', 'suv'];

    // Fetch ALL online riders not currently on an active ride
    // NOTE: checkAvailability shows vehicle options to passenger.
    // We show ALL online riders here — GPS proximity is only used for
    // sorting (nearest first) and for deciding who gets the booking notification.
    const query = `
      SELECT 
        r.id,
        r.first_name,
        r.last_name,
        r.is_online,
        r.vehicle_type,
        r.vehicle_model,
        r.vehicle_color,
        r.vehicle_plate,
        r.current_location,
        r.rating,
        r.profile_photo
      FROM riders r
      WHERE r.is_online = true
      AND r.id NOT IN (
        SELECT rider_id FROM rides 
        WHERE status IN ('accepted', 'in-progress')
        AND rider_id IS NOT NULL
      )
    `;

    const result = await pool.query(query);
    const onlineRiders = result.rows;

    console.log('\n🔍 === RIDER AVAILABILITY CHECK ===');
    console.log(`📊 Total Online Riders Found: ${onlineRiders.length}`);

    const hasPickupCoords = pickupLat != null && pickupLon != null &&
      !isNaN(parseFloat(pickupLat)) && !isNaN(parseFloat(pickupLon));

    const pLat = parseFloat(pickupLat);
    const pLon = parseFloat(pickupLon);

    // Annotate every rider with their distance from pickup (for sorting / display)
    // but do NOT filter any out — all online riders are shown
    const ridersToCount = onlineRiders.map(rider => {
      if (!hasPickupCoords || !rider.current_location) {
        return { ...rider, distanceKm: null };
      }
      const coords = parseLocation(rider.current_location);
      if (!coords) return { ...rider, distanceKm: null };
      const d = calculateDistance(pLat, pLon, coords.lat, coords.lng);
      console.log(`  🏍️  ${rider.first_name} ${rider.last_name} [${rider.vehicle_type || 'no-type'}] → ${d.toFixed(2)} km from pickup`);
      return { ...rider, distanceKm: parseFloat(d.toFixed(2)) };
    });

    const vehicleAvailability = {};
    for (const v of allVehicleIds) {
      const matching = ridersToCount.filter(r =>
        r.vehicle_type && r.vehicle_type.toLowerCase() === v
      );
      // Sort by distance ascending
      matching.sort((a, b) => (a.distanceKm ?? 99) - (b.distanceKm ?? 99));
      vehicleAvailability[v] = {
        count: matching.length,
        riders: matching.map(r => ({
          id: r.id,
          name: `${r.first_name || ''} ${r.last_name || ''}`.trim(),
          vehicleModel: r.vehicle_model || '',
          vehicleColor: r.vehicle_color || '',
          vehiclePlate: r.vehicle_plate || '',
          profilePhoto: r.profile_photo || null,
          rating: parseFloat(r.rating) || 5.0,
          distanceKm: r.distanceKm,
          isOnline: r.is_online === true || r.is_online === 1,
        }))
      };
    }

    // Determine which vehicle types have riders
    // If riders exist but none have a set vehicle_type, mark all as available
    const typedRiders = ridersToCount.filter(r => r.vehicle_type);
    let availableVehicles;
    if (ridersToCount.length === 0) {
      availableVehicles = [];
    } else if (typedRiders.length === 0) {
      // Online riders but no vehicle_type set → mark all as available
      availableVehicles = allVehicleIds;
    } else {
      availableVehicles = allVehicleIds.filter(v => vehicleAvailability[v].count > 0);
    }

    const dist = parseFloat(distance);
    const totalNearby = ridersToCount.length;
    const personalAvailable = totalNearby > 0;
    const sharedAvailable = dist > 5 && totalNearby >= 2;

    console.log(`✅ Available Vehicles: [${availableVehicles.join(', ')}] | Total online riders: ${totalNearby}`);
    console.log('='.repeat(50) + '\n');

    res.json({
      success: true,
      availableVehicles,
      vehicleAvailability,
      sharedAvailable,
      personalAvailable,
      totalNearbyRiders: totalNearby,
      hasPickupCoords,
    });
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({ error: 'Failed to check availability' });
  }
};

// Book a new ride
exports.bookRide = async (req, res) => {
  try {
    const passengerId = req.user?.userId;
    
    if (!passengerId) {
      return res.status(401).json({ error: 'Unauthorized - please login' });
    }

    const { 
      pickup, 
      destination, 
      distance, 
      fare, 
      rideType, 
      vehicleType,
      paymentMethod,
      pickupCoordinates, // { lat, lng }
      selectedRiderId    // optional: passenger-chosen rider
    } = req.body;

    if (!pickup || !destination || !distance || !fare || !rideType || !vehicleType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const normalizedPaymentMethod = String(paymentMethod || '').toLowerCase();
    if (!VALID_PAYMENT_METHODS.includes(normalizedPaymentMethod)) {
      return res.status(400).json({
        error: `Invalid payment method. Allowed values: ${VALID_PAYMENT_METHODS.join(', ')}`
      });
    }

    const numericFare = parseFloat(fare);
    if (!Number.isFinite(numericFare) || numericFare <= 0) {
      return res.status(400).json({ error: 'Invalid fare amount' });
    }

    // Parse pickup coordinates if not provided directly
    let pickupLat, pickupLng;
    if (pickupCoordinates) {
      pickupLat = pickupCoordinates.lat;
      pickupLng = pickupCoordinates.lng;
    } else {
      const parsedCoords = parseLocation(pickup);
      if (parsedCoords) {
        pickupLat = parsedCoords.lat;
        pickupLng = parsedCoords.lng;
      }
    }

    const normalizedPaymentMethod = String(paymentMethod || 'cash').toLowerCase();
    const paymentStatus = normalizedPaymentMethod === 'cash' ? 'completed' : 'pending';

    // Insert the ride into database
    const insertQuery = `
      INSERT INTO rides 
      (passenger_id, pickup_location, destination, distance, fare, ride_type, vehicle_type, payment_method, payment_status, selected_rider_id, status, requested_at) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending', CURRENT_TIMESTAMP)
      RETURNING id
    `;

    const insertResult = await pool.query(insertQuery, [
      passengerId, 
      pickup, 
      destination, 
      distance, 
      fare, 
      rideType, 
      vehicleType,
      normalizedPaymentMethod,
      paymentStatus,
      selectedRiderId || null
    ]);

    const rideId = insertResult.rows[0].id;

    if (normalizedPaymentMethod !== 'cash') {
      const stripe = getStripe();
      if (!stripe) {
        return res.status(500).json({
          error: 'Stripe is not configured. Please set STRIPE_SECRET_KEY in backend environment.'
        });
      }

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: [
          {
            price_data: {
              currency: 'inr',
              product_data: {
                name: `Ride Booking #${rideId}`,
                description: `${pickup} to ${destination}`
              },
              unit_amount: Math.round(numericFare * 100)
            },
            quantity: 1
          }
        ],
        metadata: {
          rideId: String(rideId),
          passengerId: String(passengerId),
          preferredMethod: normalizedPaymentMethod
        },
        success_url: `${FRONTEND_URL}/payment/success?rideId=${rideId}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${FRONTEND_URL}/payment/cancel?rideId=${rideId}`
      });

      await pool.query(
        `
          UPDATE rides
          SET stripe_session_id = $1, updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `,
        [session.id, rideId]
      );

      return res.json({
        success: true,
        rideId,
        requiresPayment: true,
        checkoutUrl: session.url,
        message: 'Ride created. Complete payment to dispatch the request to riders.'
      });
    }

    const nearbyRiders = await notifyRidersForRide({
      rideId,
      passengerId,
      pickup,
      destination,
      distance,
      fare,
      rideType,
      vehicleType,
      pickupCoordinates: pickupLat && pickupLng ? { lat: pickupLat, lng: pickupLng } : null,
      selectedRiderId: selectedRiderId || null
    });

    res.json({ 
      success: true, 
      rideId,
      paymentMethod: normalizedPaymentMethod,
      paymentStatus,
      nearbyRiders: nearbyRiders.length,
      ridersNotified: nearbyRiders.map(r => ({ id: r.id, name: r.name, distance: r.distance })),
      message: `Ride requested! ${nearbyRiders.length} nearby rider(s) notified.` 
    });
  } catch (error) {
    console.error('Error booking ride:', error);
    res.status(500).json({ error: 'Failed to book ride' });
  }
};

// Get ride details
exports.getRideDetails = async (req, res) => {
  try {
    const { rideId } = req.params;

    const query = `
      SELECT 
        r.*,
        u.full_name as passenger_name,
        u.email as passenger_email,
        u.phone as passenger_phone,
        CONCAT(rider.first_name, ' ', rider.last_name) as rider_name,
        rider.email as rider_email,
        rider.phone as rider_phone,
        rider.vehicle_type,
        rider.vehicle_model,
        rider.vehicle_plate as vehicle_number
      FROM rides r
      JOIN users u ON r.passenger_id = u.id
      LEFT JOIN riders rider ON r.rider_id = rider.id
      WHERE r.id = $1
    `;

    const result = await pool.query(query, [rideId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    res.json({ success: true, ride: result.rows[0] });
  } catch (error) {
    console.error('Error fetching ride details:', error);
    res.status(500).json({ error: 'Failed to fetch ride details' });
  }
};

// Update ride status (for in-progress, completed)
exports.updateRideStatus = async (req, res) => {
  try {
    const { rideId } = req.params;
    const { status } = req.body;

    const validStatuses = ['in-progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const rideCheckResult = await pool.query(
      `SELECT payment_method, payment_status FROM rides WHERE id = $1`,
      [rideId]
    );

    if (!rideCheckResult.rows.length) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    const paymentMethod = String(rideCheckResult.rows[0].payment_method || 'cash').toLowerCase();
    const paymentStatus = String(rideCheckResult.rows[0].payment_status || 'pending').toLowerCase();

    if (status === 'completed' && paymentMethod !== 'cash' && paymentStatus !== 'completed') {
      return res.status(400).json({
        error: 'Cannot complete this ride until passenger payment is completed'
      });
    }

    const query = `
      UPDATE rides 
      SET 
        status = $1,
        payment_status = CASE
          WHEN $1 = 'completed' THEN 'completed'
          WHEN $1 = 'cancelled' THEN 'failed'
          ELSE payment_status
        END,
        completed_at = CASE WHEN $1 = 'completed' THEN CURRENT_TIMESTAMP ELSE completed_at END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;

    const result = await pool.query(query, [status, rideId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    res.json({ success: true, message: `Ride status updated to ${status}`, ride: result.rows[0] });
  } catch (error) {
    console.error('Error updating ride status:', error);
    res.status(500).json({ error: 'Failed to update ride status' });
  }
};
