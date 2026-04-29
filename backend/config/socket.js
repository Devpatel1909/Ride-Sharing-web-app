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
  emitRideStatusUpdate,
  getIO
};
