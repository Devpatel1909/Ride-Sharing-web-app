import { useEffect, useCallback, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  initializeSocket,
  getSocket,
  onSharedRideAvailable,
  onPassengerJoined,
  onPassengerStatusUpdated,
  onPickupSequence,
  onRideCancelled,
  offEvent
} from '../services/socket';

/**
 * Hook to use Socket.IO for shared rides
 * Automatically handles connection lifecycle and event listeners
 */
export const useSharedRideSocket = (token = null) => {
  const socketRef = useRef(null);

  // Initialize socket on mount
  useEffect(() => {
    if (token) {
      socketRef.current = initializeSocket(token);
    }

    return () => {
      // Cleanup on unmount - don't disconnect, just remove listeners
      // This allows the socket to persist across component changes
    };
  }, [token]);

  return socketRef.current;
};

/**
 * Hook to listen for shared ride available events
 */
export const useSharedRideAvailable = (callback) => {
  useEffect(() => {
    if (!callback) return;

    const wrappedCallback = (data) => {
      callback(data);
    };

    onSharedRideAvailable(wrappedCallback);

    return () => {
      offEvent('shared-ride-available', wrappedCallback);
    };
  }, [callback]);
};

/**
 * Hook to listen for passenger joined events
 */
export const usePassengerJoined = (rideId, callback) => {
  useEffect(() => {
    if (!callback || !rideId) return;

    const wrappedCallback = (data) => {
      if (data.rideId === rideId) {
        callback(data);
      }
    };

    onPassengerJoined(wrappedCallback);

    return () => {
      offEvent('passenger-joined-shared-ride', wrappedCallback);
    };
  }, [rideId, callback]);
};

/**
 * Hook to listen for passenger status updates
 */
export const usePassengerStatusUpdated = (rideId, callback) => {
  useEffect(() => {
    if (!callback || !rideId) return;

    const wrappedCallback = (data) => {
      if (data.rideId === rideId) {
        callback(data);
      }
    };

    onPassengerStatusUpdated(wrappedCallback);

    return () => {
      offEvent('passenger-status-updated', wrappedCallback);
    };
  }, [rideId, callback]);
};

/**
 * Hook to listen for pickup sequence updates
 */
export const usePickupSequence = (rideId, callback) => {
  useEffect(() => {
    if (!callback || !rideId) return;

    const wrappedCallback = (data) => {
      if (data.rideId === rideId) {
        callback(data);
      }
    };

    onPickupSequence(wrappedCallback);

    return () => {
      offEvent('pickup-sequence', wrappedCallback);
    };
  }, [rideId, callback]);
};

/**
 * Hook to listen for ride cancelled events
 */
export const useRideCancelled = (rideId, callback) => {
  useEffect(() => {
    if (!callback || !rideId) return;

    const wrappedCallback = (data) => {
      if (data.rideId === rideId) {
        callback(data);
      }
    };

    onRideCancelled(wrappedCallback);

    return () => {
      offEvent('shared-ride-cancelled', wrappedCallback);
    };
  }, [rideId, callback]);
};

/**
 * Hook for multiple ride events at once
 */
export const useRideEvents = (rideId, handlers = {}) => {
  const {
    onStatusUpdate = null,
    onPassengerJoin = null,
    onSequenceUpdate = null,
    onCancel = null
  } = handlers;

  usePassengerStatusUpdated(rideId, onStatusUpdate);
  usePassengerJoined(rideId, onPassengerJoin);
  usePickupSequence(rideId, onSequenceUpdate);
  useRideCancelled(rideId, onCancel);
};

/**
 * Main hook for shared ride state management
 * Gets rideId from URL params and manages real-time updates
 */
export const useSharedRide = () => {
  const { rideId } = useParams();
  const [passengerUpdates, setPassengerUpdates] = useState([]);
  const [pickupSequence, setPickupSequence] = useState([]);
  const [rideCancelled, setRideCancelled] = useState(false);

  useRideEvents(rideId, {
    onStatusUpdate: (data) => setPassengerUpdates(prev => [...prev, data]),
    onPassengerJoin: (data) => setPassengerUpdates(prev => [...prev, data]),
    onSequenceUpdate: (data) => setPickupSequence(data.passengers || []),
    onCancel: () => setRideCancelled(true)
  });

  return { passengerUpdates, pickupSequence, rideCancelled };
};

export default {
  useSharedRideSocket,
  useSharedRideAvailable,
  usePassengerJoined,
  usePassengerStatusUpdated,
  usePickupSequence,
  useRideCancelled,
  useRideEvents,
  useSharedRide
};
