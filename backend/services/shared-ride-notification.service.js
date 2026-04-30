const pool = require('../db/Connect_to_sql');
const {
  emitSharedRideAvailable,
  emitPassengerJoinedSharedRide,
  emitPassengerStatusUpdate,
  emitPickupSequence,
  emitSharedRideCancelled
} = require('../config/socket');

/**
 * Calculate distance between two geographic coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Parse location string to extract coordinates
 * Expected format: "Location Name (lat, lng)" or "lat, lng"
 * @param {string} locationString - Location string to parse
 * @returns {object|null} Object with lat and lng properties, or null if parsing fails
 */
const parseLocation = (locationString) => {
  try {
    if (!locationString) return null;
    
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

/**
 * Broadcast a new shared ride to nearby passengers
 * @param {object} rideData - Shared ride information
 * @param {number} rideData.rideId - ID of the shared ride
 * @param {number} rideData.passengerId - ID of original passenger (ride creator)
 * @param {string} rideData.pickup - Pickup location name
 * @param {string} rideData.destination - Destination location name
 * @param {number} rideData.distance - Distance in km
 * @param {number} rideData.fare - Total fare
 * @param {string} rideData.vehicleType - Type of vehicle (car, bike, auto)
 * @param {object} rideData.pickupCoordinates - Object with lat, lng of pickup
 * @returns {Promise<void>}
 */
const broadcastSharedRideAvailable = async ({
  rideId,
  passengerId,
  pickup,
  destination,
  distance,
  fare,
  vehicleType,
  pickupCoordinates,
  maxPassengers,
  currentPassengers
}) => {
  try {
    // Get original passenger details
    const passengerQuery = 'SELECT full_name, phone, email FROM users WHERE id = $1';
    const passengerResult = await pool.query(passengerQuery, [passengerId]);
    const passengerName = passengerResult.rows[0]?.full_name || 'Unknown';
    const passengerPhone = passengerResult.rows[0]?.phone || '';
    const passengerEmail = passengerResult.rows[0]?.email || '';

    const pickupLat = pickupCoordinates?.lat;
    const pickupLng = pickupCoordinates?.lng;

    // Prepare ride data for broadcast
    const rideData = {
      id: rideId,
      originalPassenger: passengerName,
      passengerPhone,
      passengerEmail,
      pickup,
      destination,
      distance,
      fare,
      vehicleType,
      currentPassengers,
      maxPassengers,
      availableSeats: maxPassengers - currentPassengers,
      farePerPassenger: (fare / currentPassengers).toFixed(2),
      broadcastedAt: new Date()
    };

    // Emit to all searching passengers
    emitSharedRideAvailable(rideData);

    console.log(`✅ Shared ride #${rideId} broadcasted to searching passengers`);
    console.log(`   Available seats: ${maxPassengers - currentPassengers}/${maxPassengers}`);
    return rideData;
  } catch (error) {
    console.error('Error broadcasting shared ride:', error);
    throw error;
  }
};

/**
 * Notify rider and all passengers when new passenger joins
 * @param {number} rideId - ID of the shared ride
 * @param {number} joiningPassengerId - ID of passenger joining
 * @param {number} totalPassengersAfterJoin - Total passengers after this join
 * @param {number} farePerPassenger - New fare per passenger after split
 * @returns {Promise<void>}
 */
const notifyPassengerJoined = async (rideId, joiningPassengerId, totalPassengersAfterJoin, farePerPassenger) => {
  try {
    // Get joining passenger details
    const joiningQuery = 'SELECT full_name, phone, email FROM users WHERE id = $1';
    const joiningResult = await pool.query(joiningQuery, [joiningPassengerId]);
    const joiningName = joiningResult.rows[0]?.full_name || 'Unknown';
    const joiningPhone = joiningResult.rows[0]?.phone || '';

    const passengerData = {
      passengerId: joiningPassengerId,
      passengerName: joiningName,
      passengerPhone: joiningPhone,
      totalPassengers: totalPassengersAfterJoin,
      fare: farePerPassenger
    };

    // Emit to all in the ride room
    emitPassengerJoinedSharedRide(rideId, null, passengerData);

    console.log(`✅ Passenger ${joiningPassengerId} joined ride #${rideId}`);
    console.log(`   New total: ${totalPassengersAfterJoin} passengers | Fare split: ₹${farePerPassenger}`);
  } catch (error) {
    console.error('Error notifying passenger joined:', error);
    throw error;
  }
};

/**
 * Notify all participants when passenger status changes
 * @param {number} rideId - ID of the shared ride
 * @param {number} passengerId - ID of passenger with status change
 * @param {string} newStatus - New status (pending, accepted, picked_up, dropped_off, cancelled)
 * @returns {Promise<void>}
 */
const notifyPassengerStatusChanged = async (rideId, passengerId, newStatus) => {
  try {
    // Get passenger details
    const passengerQuery = 'SELECT full_name FROM users WHERE id = $1';
    const passengerResult = await pool.query(passengerQuery, [passengerId]);
    const passengerName = passengerResult.rows[0]?.full_name || 'Unknown';

    // Emit status change to all in ride
    emitPassengerStatusUpdate(rideId, passengerId, newStatus, passengerName);

    console.log(`✅ Passenger ${passengerId} in ride #${rideId} status: ${newStatus}`);
  } catch (error) {
    console.error('Error notifying status change:', error);
    throw error;
  }
};

/**
 * Get and broadcast pickup sequence for ride
 * @param {number} rideId - ID of the shared ride
 * @returns {Promise<object>} Pickup sequence data
 */
const broadcastPickupSequence = async (rideId) => {
  try {
    // Get all passengers in ride ordered by status and join time
    const passengersQuery = `
      SELECT 
        rp.passenger_id,
        rp.pickup_location,
        rp.pickup_lat,
        rp.pickup_lng,
        rp.passenger_status,
        u.full_name
      FROM ride_passengers rp
      JOIN users u ON rp.passenger_id = u.id
      WHERE rp.ride_id = $1 AND rp.passenger_status IN ('pending', 'accepted', 'picked_up')
      ORDER BY 
        CASE 
          WHEN rp.passenger_status = 'picked_up' THEN 2
          WHEN rp.passenger_status = 'accepted' THEN 1
          ELSE 0
        END DESC,
        rp.created_at ASC
    `;

    const passengersResult = await pool.query(passengersQuery, [rideId]);
    const passengers = passengersResult.rows;

    // Emit pickup sequence
    emitPickupSequence(rideId, passengers);

    console.log(`✅ Pickup sequence for ride #${rideId} broadcasted (${passengers.length} passengers)`);
    return passengers;
  } catch (error) {
    console.error('Error broadcasting pickup sequence:', error);
    throw error;
  }
};

/**
 * Notify all passengers about ride cancellation
 * @param {number} rideId - ID of the shared ride
 * @param {string} reason - Reason for cancellation
 * @returns {Promise<void>}
 */
const notifyRideCancelled = async (rideId, reason = 'Ride cancelled by driver') => {
  try {
    emitSharedRideCancelled(rideId, reason);
    console.log(`✅ All passengers in ride #${rideId} notified of cancellation`);
  } catch (error) {
    console.error('Error notifying ride cancellation:', error);
    throw error;
  }
};

/**
 * Get ride details with all passengers
 * @param {number} rideId - ID of the shared ride
 * @returns {Promise<object>} Ride details with passengers
 */
const getRideWithPassengers = async (rideId) => {
  try {
    const rideQuery = `
      SELECT 
        r.id,
        r.rider_id,
        r.pickup,
        r.destination,
        r.distance,
        r.fare,
        r.current_passengers,
        r.max_passengers,
        r.status,
        r.ride_type,
        r.vehicle_type
      FROM rides r
      WHERE r.id = $1
    `;

    const rideResult = await pool.query(rideQuery, [rideId]);
    if (rideResult.rows.length === 0) {
      throw new Error(`Ride ${rideId} not found`);
    }

    const ride = rideResult.rows[0];

    const passengersQuery = `
      SELECT 
        rp.id,
        rp.passenger_id,
        rp.pickup_location,
        rp.dropoff_location,
        rp.passenger_status,
        rp.fare_amount,
        u.full_name,
        u.phone
      FROM ride_passengers rp
      JOIN users u ON rp.passenger_id = u.id
      WHERE rp.ride_id = $1 AND rp.passenger_status != 'cancelled'
      ORDER BY rp.created_at ASC
    `;

    const passengersResult = await pool.query(passengersQuery, [rideId]);
    const passengers = passengersResult.rows;

    return {
      ride,
      passengers,
      totalPassengers: passengers.length
    };
  } catch (error) {
    console.error('Error getting ride with passengers:', error);
    throw error;
  }
};

module.exports = {
  calculateDistance,
  parseLocation,
  broadcastSharedRideAvailable,
  notifyPassengerJoined,
  notifyPassengerStatusChanged,
  broadcastPickupSequence,
  notifyRideCancelled,
  getRideWithPassengers
};
