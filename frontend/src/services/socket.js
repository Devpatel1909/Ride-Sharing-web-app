import io from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

let socket = null;

/**
 * Initialize Socket.IO connection
 * @param {string} token - Auth token for connection
 * @returns {object} Socket.IO instance
 */
export const initializeSocket = (token = null) => {
  if (socket && socket.connected) {
    return socket;
  }

  socket = io(SOCKET_URL, {
    auth: token ? { token } : {},
    reconnection: true,
    reconnectionDelay: 100,
    reconnectionDelayMax: 500,
    reconnectionAttempts: 10,
    transports: ['websocket', 'polling']
  });

  socket.on('connect', () => {
    console.log('✅ Socket.IO connected:', socket.id);
  });

  socket.on('connect_error', (error) => {
    console.error('❌ Socket.IO connection error:', error);
  });

  socket.on('disconnect', () => {
    console.log('❌ Socket.IO disconnected');
  });

  return socket;
};

/**
 * Get existing socket instance
 * @returns {object} Socket.IO instance or null
 */
export const getSocket = () => {
  return socket;
};

/**
 * Disconnect socket
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * Emit search for shared rides
 * @param {number} passengerId - ID of searching passenger
 */
export const searchSharedRides = (passengerId) => {
  if (socket && socket.connected) {
    socket.emit('search-shared-rides', passengerId);
  }
};

/**
 * Leave shared ride search
 * @param {number} passengerId - ID of passenger
 */
export const leaveSharedRideSearch = (passengerId) => {
  if (socket && socket.connected) {
    socket.emit('leave-shared-search', passengerId);
  }
};

/**
 * Join ride room for active ride
 * @param {number} rideId - ID of ride
 * @param {string} role - 'passenger' or 'rider'
 */
export const joinRideRoom = (rideId, role = 'passenger') => {
  if (socket && socket.connected) {
    socket.emit('join-ride', { rideId, role });
  }
};

/**
 * Listen for shared ride available event
 * @param {function} callback - Callback function
 */
export const onSharedRideAvailable = (callback) => {
  if (socket) {
    socket.on('shared-ride-available', callback);
  }
};

/**
 * Listen for passenger joined event
 * @param {function} callback - Callback function
 */
export const onPassengerJoined = (callback) => {
  if (socket) {
    socket.on('passenger-joined-shared-ride', callback);
  }
};

/**
 * Listen for passenger status updated event
 * @param {function} callback - Callback function
 */
export const onPassengerStatusUpdated = (callback) => {
  if (socket) {
    socket.on('passenger-status-updated', callback);
  }
};

/**
 * Listen for pickup sequence event
 * @param {function} callback - Callback function
 */
export const onPickupSequence = (callback) => {
  if (socket) {
    socket.on('pickup-sequence', callback);
  }
};

/**
 * Listen for ride cancelled event
 * @param {function} callback - Callback function
 */
export const onRideCancelled = (callback) => {
  if (socket) {
    socket.on('shared-ride-cancelled', callback);
  }
};

/**
 * Remove event listener
 * @param {string} eventName - Name of event
 * @param {function} callback - Callback to remove
 */
export const offEvent = (eventName, callback) => {
  if (socket) {
    socket.off(eventName, callback);
  }
};

export default {
  initializeSocket,
  getSocket,
  disconnectSocket,
  searchSharedRides,
  leaveSharedRideSearch,
  joinRideRoom,
  onSharedRideAvailable,
  onPassengerJoined,
  onPassengerStatusUpdated,
  onPickupSequence,
  onRideCancelled,
  offEvent
};
