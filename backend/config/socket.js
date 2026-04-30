const { Server } = require('socket.io');

let io;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log('⚡ Client connected:', socket.id);

    // Rider goes online
    socket.on('rider-online', (riderId) => {
      socket.join(`rider-${riderId}`);
      console.log(`🚗 Rider ${riderId} is now online`);
    });

    // Rider goes offline
    socket.on('rider-offline', (riderId) => {
      socket.leave(`rider-${riderId}`);
      console.log(`🚗 Rider ${riderId} is now offline`);
    });

    // Passenger joins room
    socket.on('passenger-join', (passengerId) => {
      socket.join(`passenger-${passengerId}`);
      console.log(`👤 Passenger ${passengerId} joined`);
    });

    // ── Ride tracking room ──────────────────────────────────────────────────
    // Both rider and passenger join ride-{rideId} room after ride is accepted
    socket.on('join-ride', ({ rideId, role }) => {
      socket.join(`ride-${rideId}`);
      console.log(`🗺️  ${role} joined ride room: ride-${rideId}`);
      // Notify others in the room that this party has connected
      socket.to(`ride-${rideId}`).emit('party-connected', { role });
    });

    // Location update - relay to the OTHER party in the ride room
    socket.on('location-update', ({ rideId, lat, lng, role }) => {
      socket.to(`ride-${rideId}`).emit('location-update', { lat, lng, role });
    });

    // Ride status change (in-progress, completed) - relay to whole room
    socket.on('ride-status-change', ({ rideId, status }) => {
      io.to(`ride-${rideId}`).emit('ride-status-change', { rideId, status });
    });

    // ── Shared Ride Events ──────────────────────────────────────────────────
    // Passenger searches for shared rides
    socket.on('search-shared-rides', (passengerId) => {
      socket.join(`passenger-search-${passengerId}`);
      console.log(`🔍 Passenger ${passengerId} is searching for shared rides`);
    });

    // Leave shared ride search
    socket.on('leave-shared-search', (passengerId) => {
      socket.leave(`passenger-search-${passengerId}`);
      console.log(`👤 Passenger ${passengerId} stopped searching`);
    });

    // Disconnect handler
    socket.on('disconnect', () => {
      console.log('❌ Client disconnected:', socket.id);
    });
  });

  return io;
};

// Emit new ride request to specific nearby riders
const emitNewRideRequest = (riderId, rideData) => {
  if (io) {
    io.to(`rider-${riderId}`).emit('new-ride-request', rideData);
    console.log(`📢 Ride request sent to rider ${riderId}:`, rideData.id);
  }
};

// Emit ride accepted to specific passenger
const emitRideAccepted = (passengerId, rideData) => {
  if (io) {
    io.to(`passenger-${passengerId}`).emit('ride-accepted', rideData);
    console.log(`✅ Ride accepted notification sent to passenger ${passengerId}`);
  }
};

// Ask passenger to complete payment after rider acceptance
const emitPaymentRequired = (passengerId, payload) => {
  if (io) {
    io.to(`passenger-${passengerId}`).emit('ride-payment-required', payload);
    console.log(`💳 Payment required notification sent to passenger ${passengerId}`);
  }
};

// Notify rider/passenger payment state transitions
const emitPaymentStatusUpdate = ({ rideId, passengerId, riderId, paymentStatus, rideStatus, message }) => {
  if (!io) return;

  const payload = { rideId, paymentStatus, rideStatus, message };
  if (passengerId) {
    io.to(`passenger-${passengerId}`).emit('ride-payment-status', payload);
  }
  if (riderId) {
    io.to(`rider-${riderId}`).emit('ride-payment-status', payload);
  }
  console.log(`💸 Ride ${rideId} payment status: ${paymentStatus}`);
};

// Emit ride status update
const emitRideStatusUpdate = (rideId, status, userId, riderId) => {
  if (io) {
    if (userId) {
      io.to(`passenger-${userId}`).emit('ride-status-updated', { rideId, status });
    }
    if (riderId) {
      io.to(`rider-${riderId}`).emit('ride-status-updated', { rideId, status });
    }
    console.log(`🔄 Ride ${rideId} status updated to: ${status}`);
  }
};

// Emit new shared ride available to passengers searching
const emitSharedRideAvailable = (rideData) => {
  if (io) {
    // Broadcast to all passengers searching for shared rides
    io.emit('shared-ride-available', rideData);
    console.log(`📢 New shared ride #${rideData.id} broadcast to all searching passengers`);
  }
};

// Notify rider when passenger joins shared ride
const emitPassengerJoinedSharedRide = (rideId, riderId, passengerData) => {
  if (io) {
    io.to(`ride-${rideId}`).emit('passenger-joined-shared-ride', {
      rideId,
      passenger: passengerData,
      totalPassengers: passengerData.totalPassengers,
      newFare: passengerData.fare,
      timestamp: new Date()
    });
    console.log(`👥 Passenger ${passengerData.passengerId} joined shared ride #${rideId}`);
  }
};

// Notify all passengers in ride when status updates
const emitPassengerStatusUpdate = (rideId, passengerId, status, passengerName) => {
  if (io) {
    io.to(`ride-${rideId}`).emit('passenger-status-updated', {
      rideId,
      passengerId,
      passengerName,
      status,
      timestamp: new Date()
    });
    console.log(`🔄 Passenger ${passengerId} status in ride #${rideId} updated to: ${status}`);
  }
};

// Notify upcoming pickups in shared ride
const emitPickupSequence = (rideId, passengers) => {
  if (io) {
    io.to(`ride-${rideId}`).emit('pickup-sequence', {
      rideId,
      passengers: passengers.map(p => ({
        passengerId: p.passenger_id,
        passengerName: p.full_name,
        status: p.passenger_status,
        pickupLocation: p.pickup_location,
        pickupLat: p.pickup_lat,
        pickupLng: p.pickup_lng
      })),
      timestamp: new Date()
    });
    console.log(`🗺️  Pickup sequence for ride #${rideId} updated`);
  }
};

// Notify passengers about ride cancellation
const emitSharedRideCancelled = (rideId, reason) => {
  if (io) {
    io.to(`ride-${rideId}`).emit('shared-ride-cancelled', {
      rideId,
      reason,
      timestamp: new Date()
    });
    console.log(`❌ Shared ride #${rideId} cancelled: ${reason}`);
  }
};

// Get socket instance
const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

module.exports = {
  initializeSocket,
  emitNewRideRequest,
  emitRideAccepted,
  emitPaymentRequired,
  emitPaymentStatusUpdate,
  emitRideStatusUpdate,
  emitSharedRideAvailable,
  emitPassengerJoinedSharedRide,
  emitPassengerStatusUpdate,
  emitPickupSequence,
  emitSharedRideCancelled,
  getIO
};
