import React, { useState, useEffect } from 'react';
import Header from '../../components/common/Header';
import PassengerList from '../../components/PassengerList';
import RideStatusDisplay from '../../components/RideStatusDisplay';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Phone, MapPin, Clock, AlertCircle } from 'lucide-react';
import { ridesAPI } from '../../services/api';
import { useSharedRide } from '../../hooks/useSharedRide';

/**
 * Shared Rides Management Page - For Riders
 * View and manage all passengers in shared rides
 */
export default function SharedRidesDashboard() {
  const navigate = useNavigate();
  const { rideId } = useParams();
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedPassenger, setExpandedPassenger] = useState(null);

  // Use shared ride hook for real-time updates
  const { passengerUpdates, pickupSequence, rideCancelled } = useSharedRide();

  // Fetch ride details
  useEffect(() => {
    const fetchRide = async () => {
      try {
        setLoading(true);
        // Fetch ride details from API
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/rides/${rideId}`,
          {
            headers: {
              'Authorization': `Bearer ${sessionStorage.getItem('riderToken')}`
            }
          }
        );

        if (!response.ok) throw new Error('Failed to fetch ride');

        const data = await response.json();
        setRide(data.ride);
      } catch (err) {
        console.error('Error fetching ride:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (rideId) {
      fetchRide();
    }
  }, [rideId]);

  // Handle passenger status updates
  const handleStatusUpdate = async (passengerId, newStatus) => {
    try {
      await ridesAPI.updatePassengerStatus(rideId, passengerId, newStatus);
      // Refresh ride data
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/rides/${rideId}`,
        {
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('riderToken')}`
          }
        }
      );
      const data = await response.json();
      setRide(data.ride);
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update passenger status');
    }
  };

  // Handle ride cancellation
  const handleCancelRide = async () => {
    if (!window.confirm('Are you sure you want to cancel this ride?')) return;

    try {
      await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/rides/${rideId}/cancel`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('riderToken')}`
          }
        }
      );
      navigate('/rider-dashboard');
    } catch (err) {
      console.error('Error cancelling ride:', err);
      alert('Failed to cancel ride');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600">Loading ride details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !ride) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <button
            onClick={() => navigate('/rider-dashboard')}
            className="mb-6 flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Dashboard
          </button>
          <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-900">
            <p className="font-bold mb-2">Error Loading Ride</p>
            <p>{error || 'Ride not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  const passengerCount = ride.passengers?.length || 0;
  const isMultiPassenger = passengerCount > 1;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/rider-dashboard')}
          className="mb-6 flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          Back to Dashboard
        </button>

        {/* Ride Cancelled Alert */}
        {rideCancelled && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-900">Ride Cancelled</p>
              <p className="text-sm text-red-700">This ride has been cancelled.</p>
            </div>
          </div>
        )}

        {/* Ride Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg p-6 md:p-8 mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            🚗 Ride #{ride.rideId || 'N/A'}
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            {/* Route */}
            <div>
              <p className="text-blue-100 text-sm mb-1">ROUTE</p>
              <p className="font-semibold">{ride.pickupLocation?.split(',')[0] || 'N/A'}</p>
              <p className="text-sm text-blue-100">→</p>
              <p className="font-semibold">{ride.dropoffLocation?.split(',')[0] || 'N/A'}</p>
            </div>

            {/* Passengers */}
            <div>
              <p className="text-blue-100 text-sm mb-1">PASSENGERS</p>
              <p className="text-2xl font-bold">{passengerCount}</p>
              <p className="text-sm text-blue-100">
                {isMultiPassenger ? 'Multi-passenger' : 'Single'}
              </p>
            </div>

            {/* Status */}
            <div>
              <p className="text-blue-100 text-sm mb-1">STATUS</p>
              <p className="font-semibold text-lg">
                {ride.status === 'pending' && '⏳ Pending'}
                {ride.status === 'accepted' && '✅ Accepted'}
                {ride.status === 'in-progress' && '🚗 In Progress'}
                {ride.status === 'completed' && '✓ Completed'}
              </p>
            </div>

            {/* Total Fare */}
            <div>
              <p className="text-blue-100 text-sm mb-1">TOTAL FARE</p>
              <p className="text-2xl font-bold">₹{ride.totalFare?.toFixed(2) || '0.00'}</p>
              <p className="text-sm text-blue-100">
                ₹{((ride.totalFare || 0) / Math.max(passengerCount, 1)).toFixed(2)} per person
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {ride.status === 'pending' || ride.status === 'accepted' ? (
              <>
                <button
                  onClick={handleCancelRide}
                  className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors"
                >
                  Cancel Ride
                </button>
              </>
            ) : null}
          </div>
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Passengers List - 2 columns */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">
                👥 Passengers ({passengerCount})
              </h2>

              {passengerCount > 0 ? (
                <PassengerList
                  rideId={rideId}
                  passengers={ride.passengers}
                  isRider={true}
                  onStatusUpdate={handleStatusUpdate}
                />
              ) : (
                <div className="text-center py-12">
                  <p className="text-slate-600 mb-2">No passengers yet</p>
                  <p className="text-sm text-slate-500">Passengers will appear here as they join</p>
                </div>
              )}
            </div>
          </div>

          {/* Ride Status & Sequence - 1 column */}
          <div className="lg:col-span-1 space-y-6">
            {/* Ride Status Display */}
            {isMultiPassenger && (
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Pickup Sequence</h3>
                <RideStatusDisplay
                  rideId={rideId}
                  ride={ride}
                  passengers={ride.passengers || []}
                />
              </div>
            )}

            {/* Quick Stats */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
              <h3 className="font-bold text-slate-900 mb-4">Earnings</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-600">Total Fare</span>
                  <span className="font-bold">₹{ride.totalFare?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Passengers</span>
                  <span className="font-bold">{passengerCount}</span>
                </div>
                <div className="h-px bg-green-200"></div>
                <div className="flex justify-between text-lg">
                  <span className="font-bold">Your Earnings</span>
                  <span className="font-bold text-green-600">₹{ride.totalFare?.toFixed(2) || '0.00'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
