const pool = require('../db/Connect_to_sql');
const { emitRideAccepted } = require('../config/socket');

// Get rider dashboard statistics
exports.getRiderStats = async (req, res) => {
  try {
    const riderId = req.rider?.riderId || req.user?.userId;

    if (!riderId) {
      return res.status(401).json({ error: 'Unauthorized - Rider ID not found' });
    }

    // Get rider statistics from database (PostgreSQL)
    const statsQuery = `
      SELECT 
        total_rides,
        total_earnings,
        rating,
        is_online
      FROM riders
      WHERE id = $1
    `;

    const statsResult = await pool.query(statsQuery, [riderId]);

    if (statsResult.rows.length === 0) {
      return res.status(404).json({ error: 'Rider not found' });
    }

    const stats = statsResult.rows[0];

    // Get total unique passengers
    const passengersQuery = `
      SELECT COUNT(DISTINCT passenger_id) as total_passengers
      FROM rides
      WHERE rider_id = $1 AND status = 'completed'
    `;

    const passengersResult = await pool.query(passengersQuery, [riderId]);
    const totalPassengers = passengersResult.rows[0]?.total_passengers || 0;

    res.json({
      success: true,
      stats: {
        totalRides: stats.total_rides || 0,
        totalEarnings: parseFloat(stats.total_earnings) || 0,
        passengers: parseInt(totalPassengers),
        rating: parseFloat(stats.rating) || 5.0,
        isOnline: stats.is_online || false
      }
    });

  } catch (error) {
    console.error('Error fetching rider stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
};

// Get pending ride requests for rider
exports.getPendingRequests = async (req, res) => {
  try {
    const riderId = req.rider?.riderId || req.user?.userId;

    if (!riderId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get pending ride requests (PostgreSQL)
    const query = `
      SELECT 
        r.id,
        r.pickup_location,
        r.destination,
        r.distance,
        r.fare,
        r.ride_type,
        r.vehicle_type,
        r.requested_at,
        u.full_name as passenger_name,
        u.email as passenger_email,
        EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - r.requested_at))/60 as minutes_ago
      FROM rides r
      JOIN users u ON r.passenger_id = u.id
      WHERE r.status = 'pending'
      ORDER BY r.requested_at DESC
      LIMIT 20
    `;

    const result = await pool.query(query);

    const requests = result.rows.map(row => ({
      id: row.id,
      passenger: row.passenger_name,
      email: row.passenger_email,
      pickup: row.pickup_location,
      dropoff: row.destination,
      distance: `${parseFloat(row.distance).toFixed(1)} km`,
      fare: `₹${parseFloat(row.fare).toFixed(0)}`,
      rideType: row.ride_type,
      vehicleType: row.vehicle_type,
      time: row.minutes_ago < 1 ? 'Just now' : 
            row.minutes_ago < 60 ? `${Math.floor(row.minutes_ago)} mins ago` : 
            `${Math.floor(row.minutes_ago / 60)} hours ago`,
      requestedAt: row.requested_at
    }));

    res.json({
      success: true,
      requests
    });

  } catch (error) {
    console.error('Error fetching pending requests:', error);
    res.status(500).json({ error: 'Failed to fetch pending requests' });
  }
};

// Update rider availability status
exports.updateAvailability = async (req, res) => {
  try {
    const riderId = req.rider?.riderId || req.user?.userId;
    const { isOnline, currentLocation } = req.body;

    if (!riderId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let query, params;

    if (currentLocation) {
      query = `
        UPDATE riders 
        SET is_online = $1, current_location = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING is_online, current_location
      `;
      params = [isOnline, currentLocation, riderId];
    } else {
      query = `
        UPDATE riders 
        SET is_online = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING is_online, current_location
      `;
      params = [isOnline, riderId];
    }

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Rider not found' });
    }

    res.json({
      success: true,
      isOnline: result.rows[0].is_online,
      currentLocation: result.rows[0].current_location
    });

  } catch (error) {
    console.error('Error updating availability:', error);
    res.status(500).json({ error: 'Failed to update availability' });
  }
};

// Get recent activity (completed rides)
exports.getRecentActivity = async (req, res) => {
  try {
    const riderId = req.rider?.riderId || req.user?.userId;

    if (!riderId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const query = `
      SELECT 
        r.id,
        r.pickup_location,
        r.destination,
        r.distance,
        r.fare,
        r.ride_type,
        r.vehicle_type,
        r.status,
        r.completed_at,
        u.full_name as passenger_name
      FROM rides r
      JOIN users u ON r.passenger_id = u.id
      WHERE r.rider_id = $1 AND r.status IN ('completed', 'in-progress')
      ORDER BY r.completed_at DESC NULLS LAST, r.requested_at DESC
      LIMIT 10
    `;

    const result = await pool.query(query, [riderId]);

    const activities = result.rows.map(row => ({
      id: row.id,
      passenger: row.passenger_name,
      pickup: row.pickup_location,
      destination: row.destination,
      distance: `${parseFloat(row.distance).toFixed(1)} km`,
      fare: `₹${parseFloat(row.fare).toFixed(0)}`,
      rideType: row.ride_type,
      vehicleType: row.vehicle_type,
      status: row.status,
      completedAt: row.completed_at
    }));

    res.json({
      success: true,
      activities
    });

  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({ error: 'Failed to fetch recent activity' });
  }
};

// Accept ride request
exports.acceptRide = async (req, res) => {
  try {
    const riderId = req.rider?.riderId || req.user?.userId;
    const { rideId } = req.params;

    if (!riderId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if ride exists and is pending
    const checkQuery = `
      SELECT id, status, passenger_id
      FROM rides
      WHERE id = $1
    `;

    const checkResult = await pool.query(checkQuery, [rideId]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    if (checkResult.rows[0].status !== 'pending') {
      return res.status(400).json({ error: 'Ride is not available for acceptance' });
    }

    // Update ride status to accepted
    const updateQuery = `
      UPDATE rides
      SET 
        rider_id = $1,
        status = 'accepted',
        accepted_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;

    const updateResult = await pool.query(updateQuery, [riderId, rideId]);

    // Create notification for passenger
    const notificationQuery = `
      INSERT INTO notifications (user_id, rider_id, type, title, message, ride_id)
      VALUES ($1, $2, 'ride_accepted', 'Ride Accepted', 'Your ride has been accepted by the driver', $3)
    `;

    await pool.query(notificationQuery, [
      checkResult.rows[0].passenger_id,
      riderId,
      rideId
    ]);

    // Fetch rider info to include in socket notification
    const riderInfoResult = await pool.query(
      `SELECT id, first_name, last_name, phone, vehicle_type, vehicle_model, vehicle_plate, current_location FROM riders WHERE id = $1`,
      [riderId]
    );
    const riderInfo = riderInfoResult.rows[0] || {};

    // Emit ride-accepted to the passenger via Socket.IO
    const passengerId = checkResult.rows[0].passenger_id;
    emitRideAccepted(passengerId, {
      rideId,
      riderId,
      riderName: `${riderInfo.first_name || ''} ${riderInfo.last_name || ''}`.trim(),
      riderPhone: riderInfo.phone || '',
      vehicleType: riderInfo.vehicle_type || '',
      vehicleModel: riderInfo.vehicle_model || '',
      vehiclePlate: riderInfo.vehicle_plate || '',
      riderLocation: riderInfo.current_location || null,
    });

    res.json({
      success: true,
      message: 'Ride accepted successfully',
      ride: updateResult.rows[0]
    });

  } catch (error) {
    console.error('Error accepting ride:', error);
    res.status(500).json({ error: 'Failed to accept ride' });
  }
};

// Reject ride request
exports.rejectRide = async (req, res) => {
  try {
    const riderId = req.rider?.riderId || req.user?.userId;
    const { rideId } = req.params;

    if (!riderId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if ride exists
    const checkQuery = `
      SELECT id, status, passenger_id
      FROM rides
      WHERE id = $1 AND status = 'pending'
    `;

    const checkResult = await pool.query(checkQuery, [rideId]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Ride not found or already processed' });
    }

    res.json({
      success: true,
      message: 'Ride rejected successfully'
    });

  } catch (error) {
    console.error('Error rejecting ride:', error);
    res.status(500).json({ error: 'Failed to reject ride' });
  }
};

