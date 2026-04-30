import React, { useState } from 'react';
import Header from '../../components/common/Header';
import SharedRideSearch from '../../components/SharedRideSearch';
import PassengerList from '../../components/PassengerList';
import RideStatusDisplay from '../../components/RideStatusDisplay';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * Shared Ride Search Page
 * Main page for finding and joining shared rides
 */
export default function SharedRideSearchPage() {
  const navigate = useNavigate();
  const [selectedRide, setSelectedRide] = useState(null);
  const [joinedRide, setJoinedRide] = useState(null);
  const [passengers, setPassengers] = useState([]);

  const handleJoinRide = (rideData) => {
    setJoinedRide(rideData);
    setSelectedRide(null);

    // Optionally navigate to tracking
    setTimeout(() => {
      navigate('/tracking', {
        state: { rideId: rideData.rideId, rideData: rideData.ride }
      });
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/ride-search')}
          className="mb-6 flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          Back to Regular Rides
        </button>

        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
            🚗 Shared Rides
          </h1>
          <p className="text-lg text-slate-600">
            Find and join shared rides to save money. Share your journey with other passengers!
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Shared Ride Search - Takes 2 columns on large screens */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <SharedRideSearch
                onJoinRide={handleJoinRide}
                vehicleType="car"
              />
            </div>
          </div>

          {/* Sidebar - Ride Details if joined */}
          <div className="lg:col-span-1">
            {joinedRide ? (
              <div className="space-y-4">
                {/* Success Message */}
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-900">
                  <p className="font-bold mb-1">✅ Successfully Joined!</p>
                  <p className="text-sm">Ride #{joinedRide.rideId}</p>
                  <p className="text-sm font-semibold text-lg mt-2">
                    Your Fare: ₹{joinedRide.fare.toFixed(2)}
                  </p>
                </div>

                {/* Ride Status */}
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
                  <RideStatusDisplay
                    rideId={joinedRide.rideId}
                    ride={joinedRide.ride}
                    passengers={passengers}
                  />
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 h-full flex items-center justify-center">
                <div className="text-center">
                  <p className="text-slate-600 text-sm">
                    👈 Select a shared ride to join
                  </p>
                  <p className="text-slate-500 text-xs mt-2">
                    See ride details and passenger information here
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* How It Works Section */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6 md:p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">How Shared Rides Work</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              {
                number: '1',
                title: 'Search',
                description: 'Find shared rides that match your route'
              },
              {
                number: '2',
                title: 'Join',
                description: 'Select a ride and join for instant confirmation'
              },
              {
                number: '3',
                title: 'Share',
                description: 'Fare is split equally among all passengers'
              },
              {
                number: '4',
                title: 'Track',
                description: 'Real-time updates on pickup and dropoff'
              }
            ].map((step) => (
              <div key={step.number} className="text-center">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-white font-bold flex items-center justify-center mx-auto mb-3 text-lg">
                  {step.number}
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">{step.title}</h3>
                <p className="text-sm text-slate-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              icon: '💰',
              title: 'Save Money',
              description: 'Split fares with other passengers on your route'
            },
            {
              icon: '🌍',
              title: 'Eco-Friendly',
              description: 'Reduce carbon footprint by sharing rides'
            },
            {
              icon: '⚡',
              title: 'Real-Time',
              description: 'Get instant notifications for all ride updates'
            }
          ].map((benefit) => (
            <div key={benefit.title} className="p-6 bg-white rounded-lg shadow-sm border border-slate-200 text-center">
              <p className="text-4xl mb-2">{benefit.icon}</p>
              <h3 className="font-bold text-slate-900 mb-2">{benefit.title}</h3>
              <p className="text-sm text-slate-600">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
