import React, { useState, useEffect } from 'react';
import { Users, MapPin, Phone, Mail, Clock, MapPinIcon, DollarSign, ChevronRight, Loader } from 'lucide-react';
import { ridesAPI } from '../services/api';
import {
  initializeSocket,
  onSharedRideAvailable,
  searchSharedRides,
  leaveSharedRideSearch,
  offEvent
} from '../services/socket';

/**
 * SharedRideSearch Component
 * Displays available shared rides and allows passengers to join
 */
export default function SharedRideSearch({ 
  onJoinRide = null,
  vehicleType = 'car'
}) {
  const [availableRides, setAvailableRides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRide, setSelectedRide] = useState(null);
  const [joiningRideId, setJoiningRideId] = useState(null);

  // Get user ID from sessionStorage
  const passengerId = sessionStorage.getItem('userId');
  const token = sessionStorage.getItem('token');

  // Initialize Socket.IO on mount
  useEffect(() => {
    if (token) {
      initializeSocket(token);
    }
  }, [token]);

  // Fetch initial available rides
  const fetchAvailableRides = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ridesAPI.getSharedAvailableRides(vehicleType);
      if (response.rides && Array.isArray(response.rides)) {
        setAvailableRides(response.rides);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch available rides');
      console.error('Error fetching rides:', err);
    } finally {
      setLoading(false);
    }
  };

  // Start searching for shared rides with Socket.IO
  const startSearching = () => {
    if (passengerId) {
      setSearching(true);
      searchSharedRides(passengerId);
      
      // Listen for new shared rides
      const handleNewRide = (rideData) => {
        setAvailableRides(prev => {
          const exists = prev.some(r => r.id === rideData.id);
          if (!exists) {
            return [rideData, ...prev];
          }
          return prev;
        });
      };

      onSharedRideAvailable(handleNewRide);
    }
  };

  // Stop searching
  const stopSearching = () => {
    setSearching(false);
    if (passengerId) {
      leaveSharedRideSearch(passengerId);
    }
  };

  // Join a shared ride
  const handleJoinRide = async (ride) => {
    if (!ride || !passengerId) return;

    try {
      setJoiningRideId(ride.id);
      setError(null);

      // Prepare join data
      const joinData = {
        pickupLocation: ride.pickup || 'Unknown Location',
        dropoffLocation: ride.destination || 'Unknown Destination',
        pickupLat: ride.pickup_lat || null,
        pickupLng: ride.pickup_lng || null,
        dropoffLat: ride.dropoff_lat || null,
        dropoffLng: ride.dropoff_lng || null
      };

      // Join the ride
      const response = await ridesAPI.joinSharedRide(ride.id, joinData);

      if (response.success) {
        // Call parent callback if provided
        if (onJoinRide) {
          onJoinRide({
            rideId: ride.id,
            fare: response.fare,
            totalPassengers: response.totalPassengers,
            ride: response.ride
          });
        }

        // Show success message
        alert(`Successfully joined ride! Your fare: ₹${response.fare.toFixed(2)}`);

        // Remove joined ride from list
        setAvailableRides(prev => prev.filter(r => r.id !== ride.id));
        setSelectedRide(null);
      }
    } catch (err) {
      setError(err.message || 'Failed to join ride');
      console.error('Error joining ride:', err);
    } finally {
      setJoiningRideId(null);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2 flex items-center gap-2">
          <Users className="w-8 h-8 text-blue-600" />
          Shared Rides
        </h2>
        <p className="text-slate-600">Save money by sharing rides with other passengers</p>
      </div>

      {/* Search Controls */}
      <div className="mb-6 flex gap-3">
        {!searching ? (
          <>
            <button
              onClick={fetchAvailableRides}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-400 font-semibold transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <Loader className="w-4 h-4 animate-spin" /> : '🔍'}
              {loading ? 'Searching...' : 'Find Shared Rides'}
            </button>
            <button
              onClick={startSearching}
              className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 font-semibold transition-colors"
              title="Real-time search using Socket.IO"
            >
              📡 Live Search
            </button>
          </>
        ) : (
          <button
            onClick={stopSearching}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition-colors"
          >
            ⏹️ Stop Searching
          </button>
        )}
      </div>

      {/* Live Search Indicator */}
      {searching && (
        <div className="mb-4 p-3 bg-cyan-50 border border-cyan-200 rounded-lg flex items-center gap-2 text-cyan-700 text-sm">
          <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
          Live searching for shared rides...
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Available Rides List */}
      <div className="space-y-3">
        {availableRides.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-medium">
              {loading ? 'Searching for shared rides...' : 'No shared rides available'}
            </p>
            <p className="text-slate-500 text-sm mt-1">
              {searching
                ? 'We\'ll notify you when new rides are available'
                : 'Click "Find Shared Rides" to search'}
            </p>
          </div>
        ) : (
          availableRides.map(ride => (
            <div
              key={ride.id}
              className={`p-4 border rounded-lg transition-all hover:shadow-md cursor-pointer ${
                selectedRide?.id === ride.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 bg-white'
              }`}
              onClick={() => setSelectedRide(ride)}
            >
              {/* Ride Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-slate-900">
                    Ride #{ride.id}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {ride.vehicleType || 'car'} · {ride.ride_type || 'shared'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">
                    ₹{typeof ride.farePerPassenger === 'string' 
                      ? ride.farePerPassenger 
                      : (ride.fare / Math.max(1, ride.currentPassengers || 1)).toFixed(2)}
                  </p>
                  <p className="text-xs text-slate-600">per person</p>
                </div>
              </div>

              {/* Route */}
              <div className="mb-3 space-y-2">
                <div className="flex gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700 line-clamp-1">{ride.pickup || ride.pickup_location}</span>
                </div>
                <div className="flex gap-2 text-sm">
                  <MapPinIcon className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700 line-clamp-1">{ride.destination}</span>
                </div>
              </div>

              {/* Passenger Info */}
              <div className="mb-3 p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-600 mb-2 font-semibold">Ride Creator</p>
                {ride.originalPassenger ? (
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">{ride.originalPassenger}</span>
                    </div>
                    {ride.passengerPhone && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <Phone className="w-3 h-3" />
                        {ride.passengerPhone}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-slate-600 text-sm">Details not available</p>
                )}
              </div>

              {/* Ride Details */}
              <div className="grid grid-cols-3 gap-2 mb-3 text-center text-xs">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <div className="font-bold text-blue-700">{ride.currentPassengers || 1}</div>
                  <div className="text-slate-600">Current</div>
                </div>
                <div className="p-2 bg-purple-50 rounded-lg">
                  <div className="font-bold text-purple-700">
                    {(ride.maxPassengers || 4) - (ride.currentPassengers || 1)}
                  </div>
                  <div className="text-slate-600">Available</div>
                </div>
                <div className="p-2 bg-amber-50 rounded-lg">
                  <div className="font-bold text-amber-700">{ride.distance || 25.5} km</div>
                  <div className="text-slate-600">Distance</div>
                </div>
              </div>

              {/* Join Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleJoinRide(ride);
                }}
                disabled={joiningRideId === ride.id || (ride.maxPassengers && ride.currentPassengers >= ride.maxPassengers)}
                className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg disabled:bg-slate-400 font-semibold transition-all flex items-center justify-center gap-2"
              >
                {joiningRideId === ride.id ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Joining...
                  </>
                ) : (ride.maxPassengers && ride.currentPassengers >= ride.maxPassengers) ? (
                  'No Seats Available'
                ) : (
                  <>
                    Join This Ride
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          ))
        )}
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 text-sm">
        <p className="font-semibold mb-1">💡 How Shared Rides Work</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>Find shared rides that match your route</li>
          <li>Fare is split equally among all passengers</li>
          <li>Track other passengers and their status</li>
          <li>Driver decides the pickup sequence</li>
        </ul>
      </div>
    </div>
  );
}
