import React, { useState, useEffect } from 'react';
import { Users, Phone, Mail, MapPin, Clock, AlertCircle, Loader, CheckCircle } from 'lucide-react';
import { ridesAPI } from '../services/api';

/**
 * PassengerList Component
 * Displays all passengers in a ride with their status and details
 */
export default function PassengerList({
  rideId,
  isRider = false,
  onPassengerStatusChange = null,
  passengers: initialPassengers = null,
  autoRefresh = true,
  refreshInterval = 5000
}) {
  const [passengers, setPassengers] = useState(initialPassengers || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [updatingPassengerId, setUpdatingPassengerId] = useState(null);

  // Fetch passengers
  const fetchPassengers = async () => {
    if (!rideId) return;

    try {
      setLoading(true);
      setError(null);
      const response = await ridesAPI.getRidePassengers(rideId);
      if (response.passengers) {
        setPassengers(response.passengers);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch passengers');
      console.error('Error fetching passengers:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount
  useEffect(() => {
    if (!initialPassengers) {
      fetchPassengers();
    }
  }, [rideId, initialPassengers]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || !rideId) return;

    const timer = setInterval(fetchPassengers, refreshInterval);
    return () => clearInterval(timer);
  }, [rideId, autoRefresh, refreshInterval]);

  // Update passenger status (for riders only)
  const handleStatusUpdate = async (passengerId, newStatus) => {
    if (!rideId || !isRider) return;

    try {
      setUpdatingPassengerId(passengerId);
      setError(null);

      const response = await ridesAPI.updatePassengerStatus(rideId, passengerId, newStatus);

      if (response.success) {
        // Update local state
        setPassengers(prev =>
          prev.map(p =>
            p.passenger_id === passengerId
              ? { ...p, passenger_status: newStatus }
              : p
          )
        );

        // Call parent callback
        if (onPassengerStatusChange) {
          onPassengerStatusChange(passengerId, newStatus);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to update passenger status');
      console.error('Error updating status:', err);
    } finally {
      setUpdatingPassengerId(null);
    }
  };

  // Status badge styling
  const getStatusBadgeStyle = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
      accepted: 'bg-blue-100 text-blue-800 border border-blue-300',
      picked_up: 'bg-purple-100 text-purple-800 border border-purple-300',
      dropped_off: 'bg-green-100 text-green-800 border border-green-300',
      cancelled: 'bg-red-100 text-red-800 border border-red-300'
    };
    return styles[status] || styles.pending;
  };

  // Status icon
  const getStatusIcon = (status) => {
    const icons = {
      pending: <Clock className="w-4 h-4" />,
      accepted: <CheckCircle className="w-4 h-4" />,
      picked_up: <Users className="w-4 h-4" />,
      dropped_off: <CheckCircle className="w-4 h-4" />,
      cancelled: <AlertCircle className="w-4 h-4" />
    };
    return icons[status] || icons.pending;
  };

  // Status display text
  const getStatusText = (status) => {
    const texts = {
      pending: 'Waiting for pickup',
      accepted: 'Confirmed',
      picked_up: 'Picked up',
      dropped_off: 'Completed',
      cancelled: 'Cancelled'
    };
    return texts[status] || status;
  };

  if (!rideId) {
    return (
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-sm">
        <p className="font-semibold">No ride selected</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg md:text-xl font-bold text-slate-900 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          Passengers ({passengers.length})
        </h3>
        <p className="text-sm text-slate-600 mt-1">
          {isRider ? 'Manage passenger pickups and dropoffs' : 'View other passengers on this ride'}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Refresh Button */}
      <button
        onClick={fetchPassengers}
        disabled={loading}
        className="mb-4 px-3 py-1 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
      >
        {loading ? (
          <>
            <Loader className="w-3 h-3 animate-spin" />
            Updating...
          </>
        ) : (
          '🔄 Refresh'
        )}
      </button>

      {/* Passengers List */}
      <div className="space-y-3">
        {passengers.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-lg border border-slate-200">
            <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-600 text-sm">No passengers yet</p>
          </div>
        ) : (
          passengers.map((passenger, index) => (
            <div
              key={passenger.id || passenger.passenger_id}
              className="p-4 border border-slate-200 rounded-lg bg-white hover:shadow-md transition-shadow"
            >
              {/* Passenger Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                      {index + 1}
                    </div>
                    <h4 className="font-bold text-slate-900">
                      {passenger.full_name || 'Unknown Passenger'}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Passenger ID: {passenger.passenger_id}
                  </p>
                </div>

                {/* Fare Display */}
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">
                    ₹{parseFloat(passenger.fare_amount || 0).toFixed(2)}
                  </p>
                  <p className="text-xs text-slate-600">fare</p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="mb-3">
                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusBadgeStyle(
                    passenger.passenger_status
                  )}`}
                >
                  {getStatusIcon(passenger.passenger_status)}
                  {getStatusText(passenger.passenger_status)}
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                {passenger.phone && (
                  <div className="flex items-center gap-2 text-slate-700">
                    <Phone className="w-4 h-4 text-slate-500 flex-shrink-0" />
                    <span className="truncate">{passenger.phone}</span>
                  </div>
                )}
                {passenger.email && (
                  <div className="flex items-center gap-2 text-slate-700">
                    <Mail className="w-4 h-4 text-slate-500 flex-shrink-0" />
                    <span className="truncate text-xs">{passenger.email}</span>
                  </div>
                )}
              </div>

              {/* Location Details */}
              {(passenger.pickup_location || passenger.dropoff_location) && (
                <div className="space-y-2 mb-3 text-sm">
                  {passenger.pickup_location && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-600">Pickup</p>
                        <p className="text-slate-900 line-clamp-1">{passenger.pickup_location}</p>
                      </div>
                    </div>
                  )}
                  {passenger.dropoff_location && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-600">Dropoff</p>
                        <p className="text-slate-900 line-clamp-1">{passenger.dropoff_location}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Status Update Buttons (Rider Only) */}
              {isRider && passenger.passenger_status !== 'dropped_off' && passenger.passenger_status !== 'cancelled' && (
                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-200">
                  {passenger.passenger_status !== 'accepted' && (
                    <button
                      onClick={() => handleStatusUpdate(passenger.passenger_id, 'accepted')}
                      disabled={updatingPassengerId === passenger.passenger_id}
                      className="flex-1 min-w-[100px] px-3 py-1.5 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg transition-colors disabled:opacity-50 font-semibold"
                    >
                      {updatingPassengerId === passenger.passenger_id ? '...' : 'Accept'}
                    </button>
                  )}

                  {passenger.passenger_status !== 'picked_up' && (
                    <button
                      onClick={() => handleStatusUpdate(passenger.passenger_id, 'picked_up')}
                      disabled={updatingPassengerId === passenger.passenger_id}
                      className="flex-1 min-w-[100px] px-3 py-1.5 text-xs bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-lg transition-colors disabled:opacity-50 font-semibold"
                    >
                      {updatingPassengerId === passenger.passenger_id ? '...' : 'Picked Up'}
                    </button>
                  )}

                  {passenger.passenger_status !== 'dropped_off' && (
                    <button
                      onClick={() => handleStatusUpdate(passenger.passenger_id, 'dropped_off')}
                      disabled={updatingPassengerId === passenger.passenger_id}
                      className="flex-1 min-w-[100px] px-3 py-1.5 text-xs bg-green-100 text-green-700 hover:bg-green-200 rounded-lg transition-colors disabled:opacity-50 font-semibold"
                    >
                      {updatingPassengerId === passenger.passenger_id ? '...' : 'Dropped Off'}
                    </button>
                  )}
                </div>
              )}

              {/* Status for passengers */}
              {!isRider && (
                <div className="text-xs text-slate-600 mt-2 pt-2 border-t border-slate-200">
                  Last updated: {passenger.updated_at 
                    ? new Date(passenger.updated_at).toLocaleString() 
                    : 'Just now'}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
