import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Clock, MapPin, Users, TrendingUp } from 'lucide-react';
import { onPassengerStatusUpdated, onPassengerJoined, onPickupSequence, offEvent } from '../services/socket';

/**
 * RideStatusDisplay Component
 * Real-time display of ride status with Socket.IO integration
 */
export default function RideStatusDisplay({
  rideId,
  isRider = false,
  ride = null,
  passengers = []
}) {
  const [rideStatus, setRideStatus] = useState(ride?.status || 'pending');
  const [totalPassengers, setTotalPassengers] = useState(passengers.length || 1);
  const [pickupSequence, setPickupSequence] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Listen for passenger status updates
  useEffect(() => {
    if (!rideId) return;

    const handleStatusUpdate = (data) => {
      if (data.rideId === rideId) {
        setLastUpdate({
          type: 'status',
          passengerName: data.passengerName,
          status: data.status,
          timestamp: new Date()
        });
      }
    };

    const handlePassengerJoined = (data) => {
      if (data.rideId === rideId) {
        setTotalPassengers(data.totalPassengers);
        setLastUpdate({
          type: 'joined',
          passengerName: data.passenger?.passengerName,
          totalPassengers: data.totalPassengers,
          newFare: data.newFare,
          timestamp: new Date()
        });
      }
    };

    const handlePickupSequence = (data) => {
      if (data.rideId === rideId) {
        setPickupSequence(data.passengers || []);
        setLastUpdate({
          type: 'sequence',
          sequenceUpdated: true,
          timestamp: new Date()
        });
      }
    };

    onPassengerStatusUpdated(handleStatusUpdate);
    onPassengerJoined(handlePassengerJoined);
    onPickupSequence(handlePickupSequence);

    return () => {
      offEvent('passenger-status-updated', handleStatusUpdate);
      offEvent('passenger-joined-shared-ride', handlePassengerJoined);
      offEvent('pickup-sequence', handlePickupSequence);
    };
  }, [rideId]);

  // Get current passenger names for display
  const getCurrentPassengers = () => {
    return passengers
      .filter(p => p.passenger_status !== 'cancelled')
      .slice(0, 3)
      .map(p => p.full_name || p.passengerName)
      .join(', ');
  };

  // Get next pickup
  const getNextPickup = () => {
    if (pickupSequence.length === 0) return null;
    return pickupSequence.find(p => ['pending', 'accepted'].includes(p.status));
  };

  const nextPickup = getNextPickup();

  return (
    <div className="w-full space-y-4">
      {/* Main Status Card */}
      <div className="p-4 md:p-6 bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Ride Status
          </h3>
          <div className="text-right">
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
              rideStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              rideStatus === 'accepted' ? 'bg-blue-100 text-blue-800' :
              rideStatus === 'in-progress' ? 'bg-purple-100 text-purple-800' :
              rideStatus === 'completed' ? 'bg-green-100 text-green-800' :
              'bg-red-100 text-red-800'
            }`}>
              {rideStatus.charAt(0).toUpperCase() + rideStatus.slice(1).replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Status Timeline */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${rideStatus !== 'pending' ? 'bg-green-500' : 'bg-yellow-400 animate-pulse'}`} />
            <span className="text-sm font-medium text-slate-700">
              {rideStatus === 'pending' ? '⏳ Waiting for rider' : '✓ Ride booked'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${rideStatus !== 'pending' ? 'bg-green-500' : 'bg-slate-300'}`} />
            <span className="text-sm font-medium text-slate-700">
              {rideStatus === 'in-progress' || rideStatus === 'completed' ? '✓ Rider accepted' : 'Waiting for rider acceptance'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${rideStatus === 'completed' ? 'bg-green-500' : 'bg-slate-300'}`} />
            <span className="text-sm font-medium text-slate-700">
              {rideStatus === 'completed' ? '✓ Ride completed' : 'In progress'}
            </span>
          </div>
        </div>
      </div>

      {/* Passenger Count & Fare */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-xs text-blue-600 font-semibold mb-1 flex items-center gap-1">
            <Users className="w-3 h-3" />
            Total Passengers
          </div>
          <p className="text-2xl font-bold text-blue-900">{totalPassengers}</p>
        </div>
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="text-xs text-green-600 font-semibold mb-1">Avg Fare Per Person</div>
          <p className="text-2xl font-bold text-green-900">
            {ride ? `₹${(ride.fare / totalPassengers).toFixed(2)}` : 'N/A'}
          </p>
        </div>
      </div>

      {/* Next Pickup */}
      {nextPickup && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <h4 className="text-sm font-bold text-amber-900 mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Next Pickup
          </h4>
          <div className="space-y-2">
            <p className="text-lg font-semibold text-amber-900">{nextPickup.passengerName}</p>
            <p className="text-sm text-amber-800">{nextPickup.pickupLocation}</p>
            <div className="inline-block px-2 py-1 bg-amber-200 text-amber-900 text-xs font-semibold rounded">
              {nextPickup.status === 'pending' ? 'Waiting' : 'Accepted'}
            </div>
          </div>
        </div>
      )}

      {/* Pickup Sequence */}
      {pickupSequence.length > 0 && (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
          <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Pickup Sequence
          </h4>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {pickupSequence.map((passenger, index) => (
              <div
                key={`${passenger.passengerId}-${index}`}
                className="flex items-center gap-3 p-2 bg-white rounded border border-slate-200"
              >
                <span className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{passenger.passengerName}</p>
                  <p className="text-xs text-slate-600 truncate">{passenger.pickupLocation}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded ${
                  passenger.status === 'picked_up' ? 'bg-green-100 text-green-800' :
                  passenger.status === 'accepted' ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {passenger.status === 'picked_up' ? '✓' : passenger.status === 'accepted' ? 'Ready' : 'Pending'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Last Update */}
      {lastUpdate && (
        <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-lg text-cyan-900 text-xs">
          <p className="font-semibold">Last Update (Live)</p>
          <p className="mt-1">
            {lastUpdate.type === 'status' && `${lastUpdate.passengerName} is now ${lastUpdate.status.replace('_', ' ')}`}
            {lastUpdate.type === 'joined' && `${lastUpdate.passengerName} joined! New total: ${lastUpdate.totalPassengers} passengers (₹${lastUpdate.newFare.toFixed(2)} each)`}
            {lastUpdate.type === 'sequence' && 'Pickup sequence updated'}
          </p>
          <p className="mt-1 text-cyan-700">
            {lastUpdate.timestamp?.toLocaleTimeString()}
          </p>
        </div>
      )}

      {/* Current Passengers */}
      {passengers.length > 0 && (
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <h4 className="text-sm font-bold text-purple-900 mb-2 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Passengers on This Ride
          </h4>
          <p className="text-sm text-purple-800">{getCurrentPassengers()}
            {passengers.length > 3 && ` +${passengers.length - 3} more`}
          </p>
        </div>
      )}
    </div>
  );
}
