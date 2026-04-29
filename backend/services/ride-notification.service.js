const pool = require('../db/Connect_to_sql');
const { emitNewRideRequest } = require('../config/socket');

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const parseLocation = (locationString) => {
  try {
    if (!locationString) return null;
    const coordsMatch = locationString.match(/\(([^,]+),\s*([^)]+)\)/);
    if (coordsMatch) {
      return {
        lat: parseFloat(coordsMatch[1]),
        lng: parseFloat(coordsMatch[2])
      };
    }

    const parts = locationString.split(',').map((s) => s.trim());
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

const findNearbyRiders = async ({ vehicleType, pickupCoordinates, selectedRiderId }) => {
  let nearbyRiders = [];
  const pickupLat = pickupCoordinates?.lat;
  const pickupLng = pickupCoordinates?.lng;

  if (selectedRiderId) {
    const specificRiderQuery = `
      SELECT id, first_name, last_name, current_location
      FROM riders
      WHERE id = $1 AND is_online = true
    `;
    const specificResult = await pool.query(specificRiderQuery, [selectedRiderId]);
    if (specificResult.rows.length > 0) {
      const rider = specificResult.rows[0];
      nearbyRiders = [{
        id: rider.id,
        name: `${rider.first_name} ${rider.last_name}`,
        distance: 'selected'
      }];
    }
    return nearbyRiders;
  }

  if (pickupLat && pickupLng) {
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

    ridersResult.rows.forEach((rider) => {
      if (rider.current_location) {
        const riderCoords = parseLocation(rider.current_location);
        if (riderCoords) {
          const distanceToRider = calculateDistance(
            pickupLat,
            pickupLng,
            riderCoords.lat,
            riderCoords.lng
          );
          if (distanceToRider <= 5.0) {
            nearbyRiders.push({
              id: rider.id,
              name: `${rider.first_name} ${rider.last_name}`,
              distance: distanceToRider.toFixed(2)
            });
          }
        } else {
          nearbyRiders.push({ id: rider.id, name: `${rider.first_name} ${rider.last_name}`, distance: 'unknown' });
        }
      } else {
        nearbyRiders.push({ id: rider.id, name: `${rider.first_name} ${rider.last_name}`, distance: 'unknown' });
      }
    });

    return nearbyRiders;
  }

  const ridersQuery = `
    SELECT id, first_name, last_name
    FROM riders
    WHERE is_online = true
    AND vehicle_type = $1
    LIMIT 20
  `;
  const ridersResult = await pool.query(ridersQuery, [vehicleType]);
  nearbyRiders = ridersResult.rows.map((r) => ({
    id: r.id,
    name: `${r.first_name} ${r.last_name}`,
    distance: 'unknown'
  }));

  return nearbyRiders;
};

const notifyRidersForRide = async ({
  rideId,
  passengerId,
  pickup,
  destination,
  distance,
  fare,
  rideType,
  vehicleType,
  pickupCoordinates,
  selectedRiderId
}) => {
  const passengerQuery = 'SELECT full_name, phone FROM users WHERE id = $1';
  const passengerResult = await pool.query(passengerQuery, [passengerId]);
  const passengerName = passengerResult.rows[0]?.full_name || 'Unknown';
  const passengerPhone = passengerResult.rows[0]?.phone || '';

  const nearbyRiders = await findNearbyRiders({
    vehicleType,
    pickupCoordinates,
    selectedRiderId
  });

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

  nearbyRiders.forEach((rider) => {
    emitNewRideRequest(rider.id, rideData);
  });

  console.log(`Ride request ${rideId} sent to ${nearbyRiders.length} nearby riders`);

  return nearbyRiders;
};

module.exports = {
  parseLocation,
  notifyRidersForRide
};
