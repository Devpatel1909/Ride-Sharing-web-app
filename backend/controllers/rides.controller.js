const pool = require('../db/Connect_to_sql');
const { emitNewRideRequest, emitRideAccepted } = require('../config/socket');

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

    const RADIUS_KM = 2.0; // Search radius around pickup
    const allVehicleIds = ['bike', 'auto', 'car', 'suv'];

    // Fetch all online riders not currently on an active ride
    const query = `
      SELECT 
        r.id,
        r.first_name,
        r.last_name,
        r.vehicle_type,
        r.vehicle_model,
        r.current_location,
        r.rating
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

    const hasPickupCoords = pickupLat != null && pickupLon != null &&
      !isNaN(parseFloat(pickupLat)) && !isNaN(parseFloat(pickupLon));

    const pLat = parseFloat(pickupLat);
    const pLon = parseFloat(pickupLon);

    // Classify riders: nearby (within radius) vs unknown location
    const nearbyRiders = [];
    const noLocationRiders = [];

    for (const rider of onlineRiders) {
      if (!hasPickupCoords || !rider.current_location) {
        noLocationRiders.push({ ...rider, distanceKm: null });
        continue;
      }
      const coords = parseLocation(rider.current_location);
      if (!coords) {
        noLocationRiders.push({ ...rider, distanceKm: null });
        continue;
      }
      const d = calculateDistance(pLat, pLon, coords.lat, coords.lng);
      if (d <= RADIUS_KM) {
        nearbyRiders.push({ ...rider, distanceKm: parseFloat(d.toFixed(2)) });
      }
    }

    // Build per-vehicle availability
    // If we have pickup coords: only count riders within radius
    // If no pickup coords: use all online riders (unknown location)
    const ridersToCount = hasPickupCoords ? nearbyRiders : [...nearbyRiders, ...noLocationRiders];

    const vehicleAvailability = {};
    for (const v of allVehicleIds) {
      const matching = ridersToCount.filter(r =>
        r.vehicle_type && r.vehicle_type.toLowerCase() === v
      );
      // Sort by distance ascending
      matching.sort((a, b) => (a.distanceKm ?? 99) - (b.distanceKm ?? 99));
      vehicleAvailability[v] = {
        count: matching.length,
        riders: matching.slice(0, 3).map(r => ({
          id: r.id,
          name: `${r.first_name || ''} ${r.last_name || ''}`.trim(),
          vehicleModel: r.vehicle_model || '',
          rating: parseFloat(r.rating) || 5.0,
          distanceKm: r.distanceKm,
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

    console.log(`📍 Availability check: ${totalNearby} riders within ${RADIUS_KM}km of pickup (hasCoords=${hasPickupCoords})`);

    res.json({
      success: true,
      availableVehicles,
      vehicleAvailability,
      sharedAvailable,
      personalAvailable,
      totalNearbyRiders: totalNearby,
      radiusKm: RADIUS_KM,
      hasPickupCoords
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
      pickupCoordinates // { lat, lng }
    } = req.body;

    if (!pickup || !destination || !distance || !fare || !rideType || !vehicleType) {
      return res.status(400).json({ error: 'Missing required fields' });
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

    // Insert the ride into database
    const insertQuery = `
      INSERT INTO rides 
      (passenger_id, pickup_location, destination, distance, fare, ride_type, vehicle_type, status, requested_at) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', CURRENT_TIMESTAMP)
      RETURNING id
    `;

    const insertResult = await pool.query(insertQuery, [
      passengerId, 
      pickup, 
      destination, 
      distance, 
      fare, 
      rideType, 
      vehicleType
    ]);

    const rideId = insertResult.rows[0].id;

    // Get passenger details for notification
    const passengerQuery = `SELECT full_name, phone FROM users WHERE id = $1`;
    const passengerResult = await pool.query(passengerQuery, [passengerId]);
    const passengerName = passengerResult.rows[0]?.full_name || 'Unknown';
    const passengerPhone = passengerResult.rows[0]?.phone || '';

    // Find online riders within 1km radius
    let nearbyRiders = [];
    
    if (pickupLat && pickupLng) {
      // Get all online riders with their locations
      const ridersQuery = `
        SELECT 
          id, 
          current_location, 
          vehicle_type,
          first_name,
          last_name
        FROM riders
        WHERE is_online = true
        AND vehicle_type = $1
        AND id NOT IN (
          SELECT rider_id FROM rides 
          WHERE status IN ('accepted', 'in-progress')
          AND rider_id IS NOT NULL
        )
      `;

      const ridersResult = await pool.query(ridersQuery, [vehicleType]);
      
      // Calculate distance for each rider
      ridersResult.rows.forEach(rider => {
        if (rider.current_location) {
          const riderCoords = parseLocation(rider.current_location);
          if (riderCoords) {
            const distanceToRider = calculateDistance(
              pickupLat, 
              pickupLng, 
              riderCoords.lat, 
              riderCoords.lng
            );
            
            // Only include riders within 1km
            if (distanceToRider <= 1.0) {
              nearbyRiders.push({
                id: rider.id,
                name: `${rider.first_name} ${rider.last_name}`,
                distance: distanceToRider.toFixed(2)
              });
            }
          }
        }
      });
    } else {
      // If coordinates not available, fall back to all online riders
      const ridersQuery = `
        SELECT id, first_name, last_name
        FROM riders
        WHERE is_online = true
        AND vehicle_type = $1
        LIMIT 10
      `;
      const ridersResult = await pool.query(ridersQuery, [vehicleType]);
      nearbyRiders = ridersResult.rows.map(r => ({
        id: r.id,
        name: `${r.first_name} ${r.last_name}`,
        distance: 'unknown'
      }));
    }

    // Send notifications to nearby riders via Socket.IO
    const rideData = {
      id: rideId,
      passenger: passengerName,
      phone: passengerPhone,
      pickup,
      destination,
      distance,
      fare,
      rideType,
      vehicleType,
      requestedAt: new Date()
    };

    // Emit to each nearby rider specifically
    nearbyRiders.forEach(rider => {
      emitNewRideRequest(rider.id, rideData);
    });

    console.log(`📢 Ride request ${rideId} sent to ${nearbyRiders.length} nearby riders`);

    res.json({ 
      success: true, 
      rideId,
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

    const query = `
      UPDATE rides 
      SET 
        status = $1,
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
