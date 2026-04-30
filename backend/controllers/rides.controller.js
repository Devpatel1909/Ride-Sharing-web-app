const pool = require('../db/Connect_to_sql');
const Stripe = require('stripe');
const { notifyRidersForRide } = require('../services/ride-notification.service');
const { broadcastSharedRideAvailable, notifyPassengerJoined, notifyPassengerStatusChanged, broadcastPickupSequence } = require('../services/shared-ride-notification.service');

const VALID_PAYMENT_METHODS = ['cash', 'upi', 'card', 'wallet'];
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  return new Stripe(process.env.STRIPE_SECRET_KEY);
};

const runTimedQuery = async (label, query, params = [], executor = pool) => {
  const start = process.hrtime.bigint();

  try {
    const result = await executor.query(query, params);
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    console.log(`[db] ${label} completed in ${durationMs.toFixed(2)}ms (rows: ${result.rowCount})`);
    return result;
  } catch (error) {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    console.error(`[db] ${label} failed after ${durationMs.toFixed(2)}ms`, {
      code: error.code,
      message: error.message
    });
    throw error;
  }
};

const responseCache = new Map();
const inFlightLoads = new Map();

const getCachedResponse = (key) => {
  const entry = responseCache.get(key);
  if (!entry) return null;

  if (entry.expiresAt <= Date.now()) {
    responseCache.delete(key);
    return null;
  }

  return entry.value;
};

const setCachedResponse = (key, value, ttlMs) => {
  responseCache.set(key, {
    value,
    expiresAt: Date.now() + ttlMs
  });
};

const clearResponseCache = (prefix = '') => {
  if (!prefix) {
    responseCache.clear();
    inFlightLoads.clear();
    return;
  }

  for (const key of responseCache.keys()) {
    if (key.startsWith(prefix)) {
      responseCache.delete(key);
    }
  }

  for (const key of inFlightLoads.keys()) {
    if (key.startsWith(prefix)) {
      inFlightLoads.delete(key);
    }
  }
};

const getCachedOrLoadResponse = async (key, ttlMs, loader) => {
  const cached = getCachedResponse(key);
  if (cached) {
    return cached;
  }

  if (inFlightLoads.has(key)) {
    return inFlightLoads.get(key);
  }

  const loadPromise = (async () => {
    const value = await loader();
    setCachedResponse(key, value, ttlMs);
    return value;
  })().finally(() => {
    inFlightLoads.delete(key);
  });

  inFlightLoads.set(key, loadPromise);
  return loadPromise;
};

const rideDetailsCacheKey = (rideId) => `ride-details:${rideId}`;
const ridePassengersCacheKey = (rideId) => `ride-passengers:${rideId}`;
const sharedRidesCacheKey = (passengerId, body) => {
  const { pickupLat, pickupLng, dropoffLat, dropoffLng, vehicleType, maxDistance } = body;
  return `shared-rides:${passengerId}:${[pickupLat, pickupLng, dropoffLat, dropoffLng, vehicleType || '', maxDistance ?? ''].join('|')}`;
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
  const client = await pool.connect();
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
    let pickupLat, pickupLng, dropoffLat, dropoffLng;
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

<<<<<<< HEAD
    // Parse destination coordinates if provided
    if (req.body.destinationCoordinates) {
      dropoffLat = req.body.destinationCoordinates.lat;
      dropoffLng = req.body.destinationCoordinates.lng;
    } else {
      const parsedDestCoords = parseLocation(destination);
      if (parsedDestCoords) {
        dropoffLat = parsedDestCoords.lat;
        dropoffLng = parsedDestCoords.lng;
      }
    }

    await client.query('BEGIN');
=======
    const normalizedPaymentMethod = String(paymentMethod || 'cash').toLowerCase();
    const paymentStatus = normalizedPaymentMethod === 'cash' ? 'completed' : 'pending';
>>>>>>> c3266098c53d87f030e42f01565ece40bef8b30b

    // Insert the ride into database
    const insertQuery = `
      INSERT INTO rides 
      (passenger_id, pickup_location, destination, distance, fare, ride_type, vehicle_type, payment_method, payment_status, selected_rider_id, status, requested_at) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending', CURRENT_TIMESTAMP)
      RETURNING id
    `;

    const insertResult = await client.query(insertQuery, [
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

    // Add the original passenger to ride_passengers table
    const addOriginalPassengerQuery = `
      INSERT INTO ride_passengers 
      (ride_id, passenger_id, pickup_location, dropoff_location, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, fare_amount, passenger_status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'accepted')
    `;

    await client.query(addOriginalPassengerQuery, [
      rideId,
      passengerId,
      pickup,
      destination,
      pickupLat || null,
      pickupLng || null,
      dropoffLat || null,
      dropoffLng || null,
      numericFare
    ]);

    await client.query('COMMIT');

    clearResponseCache('ride-details:');
    clearResponseCache('ride-passengers:');
    clearResponseCache('shared-rides:');

    // We now always return success here, regardless of payment method.
    // Stripe session creation is deferred until a rider accepts the ride.
    const nearbyRiders = await notifyRidersForRide({
      rideId,
      passengerId,
      pickup,
      destination,
      distance,
      fare,
      rideType,
      vehicleType,
      pickupCoordinates: { lat: pickupLat, lng: pickupLng }
    });

    // Broadcast shared ride to nearby passengers
    if (rideType === 'shared') {
      try {
        await broadcastSharedRideAvailable({
          rideId,
          passengerId,
          pickup,
          destination,
          distance,
          fare: numericFare,
          vehicleType,
          pickupCoordinates: { lat: pickupLat, lng: pickupLng },
          maxPassengers: 4, // Default max passengers
          currentPassengers: 1 // Original passenger
        });
      } catch (error) {
        console.error('Error broadcasting shared ride:', error);
        // Don't fail the ride booking if broadcast fails
      }
    }

    return res.json({
      success: true,
      rideId,
      paymentMethod: normalizedPaymentMethod,
      paymentStatus,
      nearbyRiders: nearbyRiders.length,
      message: 'Ride created and riders notified. Waiting for acceptance.'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error booking ride:', error);
    res.status(500).json({ error: 'Failed to book ride' });
  } finally {
    client.release();
  }
};

// Get ride details
exports.getRideDetails = async (req, res) => {
  try {
    const { rideId } = req.params;
    const cacheKey = rideDetailsCacheKey(rideId);
    const ride = await getCachedOrLoadResponse(cacheKey, 15000, async () => {
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

      const result = await runTimedQuery('getRideDetails', query, [rideId]);

      if (result.rows.length === 0) {
        const notFoundError = new Error('Ride not found');
        notFoundError.statusCode = 404;
        throw notFoundError;
      }

      return result.rows[0];
    });

    res.json({ success: true, ride });
  } catch (error) {
    if (error.statusCode === 404) {
      return res.status(404).json({ error: 'Ride not found' });
    }
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

    clearResponseCache('ride-details:');
    clearResponseCache('ride-passengers:');
    clearResponseCache('shared-rides:');

    res.json({ success: true, message: `Ride status updated to ${status}`, ride: result.rows[0] });
  } catch (error) {
    console.error('Error updating ride status:', error);
    res.status(500).json({ error: 'Failed to update ride status' });
  }
};

// Helper function to split fare equally among passengers
const splitFareEqually = (totalFare, numberOfPassengers) => {
  const farePerPassenger = totalFare / numberOfPassengers;
  return parseFloat(farePerPassenger.toFixed(2));
};

// Helper function to get nearby shared rides for a passenger
// Finds rides that are:
// 1. Shared rides
// 2. Still pending or accepted (not started yet)
// 3. Have available seats
// 4. Have similar pickup/dropoff locations
exports.getSharedAvailableRides = async (req, res) => {
  try {
    const passengerId = req.user?.userId;
    
    if (!passengerId) {
      return res.status(401).json({ error: 'Unauthorized - please login' });
    }

    const { pickupLat, pickupLng, dropoffLat, dropoffLng, vehicleType, maxDistance = 2 } = req.body;

    if (!pickupLat || !pickupLng || !dropoffLat || !dropoffLng) {
      return res.status(400).json({ error: 'Missing coordinates' });
    }

    const cacheKey = sharedRidesCacheKey(passengerId, req.body);
    const sharedRidePayload = await getCachedOrLoadResponse(cacheKey, 5000, async () => {
      // Find shared rides that haven't started yet and have available seats
      // Using Haversine formula to find nearby rides
      const query = `
        SELECT 
          r.id,
          r.passenger_id,
          r.rider_id,
          r.pickup_location,
          r.destination,
          r.distance,
          r.fare,
          r.vehicle_type,
          r.status,
          r.current_passengers,
          r.max_passengers,
          u.full_name as original_passenger_name,
          u.profile_picture,
          (
            SELECT COUNT(*) FROM ride_passengers 
            WHERE ride_id = r.id AND passenger_status != 'cancelled'
          ) as joined_passengers,
          (6371 * acos(
            cos(radians($1)) * cos(radians(
              substring_index(substring_index(substring_index(substring_index(r.pickup_location, '(', -1), ',', 1), ')', 1), '.', 1), '.', -1)::float
            )) * cos(radians(
              substring_index(substring_index(substring_index(substring_index(r.pickup_location, '(', -1), ',', -1), ')', 1), '.', 1), '.', -1)::float
            ) - radians($2)) + sin(radians($1)) * sin(radians(
              substring_index(substring_index(substring_index(substring_index(r.pickup_location, '(', -1), ',', 1), ')', 1), '.', 1), '.', -1)::float
            ))
          )) AS distance_km
        FROM rides r
        JOIN users u ON r.passenger_id = u.id
        WHERE r.ride_type = 'shared'
        AND r.status IN ('pending', 'accepted')
        AND r.current_passengers < r.max_passengers
        AND r.passenger_id != $3
        AND ($4::varchar IS NULL OR r.vehicle_type = $4)
        ORDER BY distance_km ASC
        LIMIT 10
      `;

      // Simpler approach: Get all shared rides and filter in JavaScript
      const simpleQuery = `
        SELECT 
          r.id,
          r.passenger_id,
          r.rider_id,
          r.pickup_location,
          r.destination,
          r.distance,
          r.fare,
          r.vehicle_type,
          r.status,
          r.current_passengers,
          r.max_passengers,
          u.full_name as original_passenger_name,
          u.profile_picture,
          (
            SELECT COUNT(*) FROM ride_passengers 
            WHERE ride_id = r.id AND passenger_status != 'cancelled'
          ) as joined_passengers
        FROM rides r
        JOIN users u ON r.passenger_id = u.id
        WHERE r.ride_type = 'shared'
        AND r.status IN ('pending', 'accepted')
        AND r.current_passengers < r.max_passengers
        AND r.passenger_id != $1
        AND r.id NOT IN (
          SELECT ride_id FROM ride_passengers 
          WHERE passenger_id = $1
        )
        ${vehicleType ? 'AND r.vehicle_type = $2' : ''}
        ORDER BY r.requested_at DESC
      `;

      const params = vehicleType ? [passengerId, vehicleType] : [passengerId];
      const result = await runTimedQuery('getSharedAvailableRides', simpleQuery, params);

      const availableRides = result.rows.map(ride => {
        // Parse pickup location coordinates
        const pickupCoords = parseLocation(ride.pickup_location);
        const dropoffCoords = parseLocation(ride.destination);

        // Calculate distance from passenger's pickup to ride's pickup
        let pickupDistance = null;
        if (pickupCoords) {
          pickupDistance = calculateDistance(pickupLat, pickupLng, pickupCoords.lat, pickupCoords.lng);
        }

        return {
          rideId: ride.id,
          originalPassengerId: ride.passenger_id,
          originalPassengerName: ride.original_passenger_name,
          profilePicture: ride.profile_picture,
          pickupLocation: ride.pickup_location,
          destination: ride.destination,
          distance: ride.distance,
          fare: ride.fare,
          vehicleType: ride.vehicle_type,
          status: ride.status,
          riderId: ride.rider_id,
          currentPassengers: parseInt(ride.current_passengers) || 1,
          maxPassengers: ride.max_passengers,
          joinedPassengers: parseInt(ride.joined_passengers) || 0,
          availableSeats: (ride.max_passengers - parseInt(ride.current_passengers) - parseInt(ride.joined_passengers)) || 0,
          pickupDistanceKm: pickupDistance ? parseFloat(pickupDistance.toFixed(2)) : null,
          isNearby: pickupDistance && pickupDistance <= maxDistance
        };
      }).filter(ride => ride.availableSeats > 0);

      return {
        success: true,
        count: availableRides.length,
        rides: availableRides
      };
    });

    res.json(sharedRidePayload);

  } catch (error) {
    console.error('Error fetching shared rides:', error);
    res.status(500).json({ error: 'Failed to fetch shared rides' });
  }
};

// Join an existing shared ride
exports.joinSharedRide = async (req, res) => {
  const client = await pool.connect();
  try {
    const passengerId = req.user?.userId;
    const { rideId } = req.params;
    
    if (!passengerId) {
      return res.status(401).json({ error: 'Unauthorized - please login' });
    }

    const { pickupLocation, dropoffLocation, pickupLat, pickupLng, dropoffLat, dropoffLng } = req.body;

    if (!pickupLocation || !dropoffLocation) {
      return res.status(400).json({ error: 'Missing pickup or dropoff location' });
    }

    await client.query('BEGIN');

    // Check if ride exists and is a shared ride
    const rideQuery = `SELECT * FROM rides WHERE id = $1 AND ride_type = 'shared' AND status IN ('pending', 'accepted')`;
    const rideResult = await runTimedQuery('joinSharedRide:rideLookup', rideQuery, [rideId], client);

    if (rideResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Shared ride not found or not available' });
    }

    const ride = rideResult.rows[0];

    // Check if passenger already joined this ride
    const alreadyJoinedQuery = `
      SELECT * FROM ride_passengers 
      WHERE ride_id = $1 AND passenger_id = $2 AND passenger_status != 'cancelled'
    `;
    const alreadyJoinedResult = await runTimedQuery('joinSharedRide:alreadyJoinedCheck', alreadyJoinedQuery, [rideId, passengerId], client);

    if (alreadyJoinedResult.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'You have already joined this ride' });
    }

    // Check if ride has available seats
    const availableSeatsQuery = `
      SELECT 
        r.max_passengers,
        (SELECT COUNT(*) FROM ride_passengers WHERE ride_id = $1 AND passenger_status != 'cancelled') as joined_count
      FROM rides r
      WHERE r.id = $1
    `;
    const seatsResult = await runTimedQuery('joinSharedRide:availableSeats', availableSeatsQuery, [rideId], client);
    const seatInfo = seatsResult.rows[0];
    
    // Count only from ride_passengers table to avoid double-counting
    const totalPassengers = parseInt(seatInfo.joined_count) || 0;

    if (totalPassengers >= ride.max_passengers) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'No seats available in this ride' });
    }

    // Calculate fare for this passenger (split equally among new total)
    const numberOfPassengersAfterJoin = totalPassengers + 1;
    const farePerPassenger = splitFareEqually(ride.fare, numberOfPassengersAfterJoin);

    // Insert into ride_passengers table
    const insertQuery = `
      INSERT INTO ride_passengers 
      (ride_id, passenger_id, pickup_location, dropoff_location, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, fare_amount, passenger_status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')
      RETURNING *
    `;

    const insertResult = await runTimedQuery('joinSharedRide:insertPassenger', insertQuery, [
      rideId,
      passengerId,
      pickupLocation,
      dropoffLocation,
      pickupLat || null,
      pickupLng || null,
      dropoffLat || null,
      dropoffLng || null,
      farePerPassenger
    ], client);

    // Update ride's current_passengers count
    const updateQuery = `
      UPDATE rides 
      SET current_passengers = current_passengers + 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

    const updatedRideResult = await runTimedQuery('joinSharedRide:updateRideCount', updateQuery, [rideId], client);

    // Update fare for the original ride (split among new total passengers)
    const originalFarePerPassenger = splitFareEqually(ride.fare, numberOfPassengersAfterJoin);
    const updateFareQuery = `
      UPDATE ride_passengers
      SET fare_amount = $1
      WHERE ride_id = $2
    `;

    await runTimedQuery('joinSharedRide:updateFareSplit', updateFareQuery, [originalFarePerPassenger, rideId], client);

    await client.query('COMMIT');

    clearResponseCache('ride-details:');
    clearResponseCache('ride-passengers:');
    clearResponseCache('shared-rides:');

    // Notify all participants about new passenger
    try {
      await notifyPassengerJoined(rideId, passengerId, numberOfPassengersAfterJoin, farePerPassenger);
    } catch (error) {
      console.error('Error notifying passenger joined:', error);
      // Don't fail the join if notification fails
    }

    res.json({
      success: true,
      message: 'Successfully joined shared ride',
      ridePassengerId: insertResult.rows[0].id,
      fare: farePerPassenger,
      totalPassengers: numberOfPassengersAfterJoin,
      ride: updatedRideResult.rows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error joining shared ride:', error);
    res.status(500).json({ error: 'Failed to join shared ride' });
  } finally {
    client.release();
  }
};

// Get all passengers for a ride
exports.getRidePassengers = async (req, res) => {
  try {
    const { rideId } = req.params;
    const payload = await getCachedOrLoadResponse(ridePassengersCacheKey(rideId), 10000, async () => {
      const query = `
        SELECT 
          rp.id,
          rp.passenger_id,
          rp.pickup_location,
          rp.dropoff_location,
          rp.passenger_status,
          rp.fare_amount,
          u.full_name,
          u.phone,
          u.email,
          u.profile_picture
        FROM ride_passengers rp
        JOIN users u ON rp.passenger_id = u.id
        WHERE rp.ride_id = $1 AND rp.passenger_status != 'cancelled'
        ORDER BY rp.created_at ASC
      `;

      const result = await runTimedQuery('getRidePassengers', query, [rideId]);

      return {
        success: true,
        passengerCount: result.rows.length,
        passengers: result.rows
      };
    });

    res.json(payload);
  } catch (error) {
    console.error('Error fetching ride passengers:', error);
    res.status(500).json({ error: 'Failed to fetch ride passengers' });
  }
};

// Update passenger status in a shared ride
exports.updatePassengerStatus = async (req, res) => {
  try {
    const { rideId, passengerId } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'accepted', 'picked_up', 'dropped_off', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const query = `
      UPDATE ride_passengers
      SET passenger_status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE ride_id = $2 AND passenger_id = $3
      RETURNING *
    `;

    const result = await runTimedQuery('updatePassengerStatus', query, [status, rideId, passengerId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Passenger not found in this ride' });
    }

    clearResponseCache('ride-details:');
    clearResponseCache('ride-passengers:');
    clearResponseCache('shared-rides:');

    // Notify all participants about status change
    try {
      await notifyPassengerStatusChanged(rideId, passengerId, status);
      
      // Broadcast pickup sequence if status changed to accepted or picked_up
      if (['accepted', 'picked_up'].includes(status)) {
        await broadcastPickupSequence(rideId);
      }
    } catch (error) {
      console.error('Error notifying status change:', error);
      // Don't fail the status update if notification fails
    }

    res.json({
      success: true,
      message: `Passenger status updated to ${status}`,
      passenger: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating passenger status:', error);
    res.status(500).json({ error: 'Failed to update passenger status' });
  }
};
