import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import { MapPin, Clock, DollarSign, User, Phone, Navigation, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { riderAPI } from '../../services/api';
import io from 'socket.io-client';

export default function RideRequests() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending'); // pending, accepted, rejected
  const [rideRequests, setRideRequests] = useState([]);
  const [socket, setSocket] = useState(null);

  // Define fetchPendingRequests before useEffect hooks
  const fetchPendingRequests = async () => {
    try {
      const data = await riderAPI.getPendingRequests();
      setRideRequests(data.requests || []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch ride requests:', error);
      setLoading(false);
    }
  };

  // Socket.IO connection - runs once on mount
  useEffect(() => {
    const riderToken = localStorage.getItem('riderToken');
    const rider = localStorage.getItem('rider');
    
    if (!riderToken) {
      navigate('/rider-login');
      return;
    }

    // Initialize Socket.IO if rider data exists
    if (rider) {
      try {
        const riderData = JSON.parse(rider);
        
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
        const socketUrl = API_BASE_URL.replace('/api', '');
        const newSocket = io(socketUrl, {
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000
        });

        newSocket.on('connect', () => {
          console.log('✅ Socket connected on RideRequests:', newSocket.id);
          newSocket.emit('rider-online', riderData.id);
        });

        newSocket.on('new-ride-request', (rideData) => {
          console.log('🚗 New ride request on RideRequests page:', rideData);
          // Refresh ride requests
          fetchPendingRequests();
        });

        newSocket.on('disconnect', () => {
          console.log('❌ Socket disconnected from RideRequests');
        });

        newSocket.on('connect_error', (error) => {
          console.error('Socket connection error:', error);
        });

        setSocket(newSocket);

        return () => {
          console.log('Cleaning up socket connection from RideRequests...');
          if (newSocket) {
            newSocket.emit('rider-offline', riderData.id);
            newSocket.disconnect();
          }
        };
      } catch (e) {
        console.error('Error parsing rider data:', e);
      }
    }
  }, [navigate]); // Only re-run if navigate changes

  // Fetch pending requests - separate effect
  useEffect(() => {
    fetchPendingRequests();
  }, []); // Run once on mount

  const filteredRequests = rideRequests.filter(req => {
    // Since API only returns pending, show all when on pending tab
    if (activeTab === 'pending') return true;
    // For accepted/rejected, filter by status if available
    return req.status === activeTab;
  });

  const handleAcceptRide = async (rideId) => {
    try {
      console.log('Accepting ride:', rideId);
      const result = await riderAPI.acceptRide(rideId);
      
      if (result.success) {
        // Find the accepted request so we can pass ride info to the tracking page
        const acceptedReq = rideRequests.find(r => r.id === rideId) || {};
        const rider = localStorage.getItem('rider');
        const riderData = rider ? JSON.parse(rider) : {};

        // Navigate to live tracking map
        navigate('/tracking', {
          state: {
            rideId,
            role: 'rider',
            pickup: acceptedReq.pickup || '',
            destination: acceptedReq.dropoff || '',
            riderName: `${riderData.firstName || ''} ${riderData.lastName || ''}`.trim(),
            riderPhone: riderData.phone || '',
            vehicleType: riderData.vehicle?.type || '',
            vehiclePlate: riderData.vehicle?.plate || '',
          }
        });
      }
    } catch (error) {
      console.error('Failed to accept ride:', error);
      alert('Failed to accept ride: ' + error.message);
    }
  };

  const handleRejectRide = async (rideId) => {
    try {
      console.log('Rejecting ride:', rideId);
      const result = await riderAPI.rejectRide(rideId);
      
      if (result.success) {
        alert('❌ Ride rejected.');
        // Refresh ride requests
        await fetchPendingRequests();
      }
    } catch (error) {
      console.error('Failed to reject ride:', error);
      alert('Failed to reject ride: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50">
        <style>{`
          body {
            font-family: 'UberMove', 'UberMoveText', system-ui, -apple-system, 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif;
          }
        `}</style>
        <Header />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 border-4 border-transparent rounded-full border-t-purple-600 border-r-blue-600 animate-spin"></div>
            <p className="font-medium text-slate-600">Loading requests...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50">
      <style jsx global>{`
        body {
          font-family: 'UberMove', 'UberMoveText', system-ui, -apple-system, 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif;
        }
      `}</style>
      <Header />

      {/* Main Content */}
      <div className="max-w-6xl px-4 pt-24 pb-12 mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-5xl font-bold text-transparent bg-gradient-to-r from-purple-600 via-blue-600 to-purple-700 bg-clip-text font-display">
            Ride Requests 🚗
          </h1>
          <p className="text-lg font-medium text-slate-600">
            Review and accept ride requests from passengers
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-3 p-2 mb-8 border-2 border-purple-200 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-300 ease-out font-display ${
              activeTab === 'pending'
                ? 'bg-gradient-to-r from-purple-600 via-blue-600 to-purple-700 text-white shadow-lg shadow-purple-500/30'
                : 'text-slate-600 hover:text-purple-700'
            }`}
          >
            Pending ({rideRequests.filter(r => r.status === 'pending').length})
          </button>
          <button
            onClick={() => setActiveTab('accepted')}
            className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-300 ease-out font-display ${
              activeTab === 'accepted'
                ? 'bg-gradient-to-r from-purple-600 via-blue-600 to-purple-700 text-white shadow-lg shadow-purple-500/30'
                : 'text-slate-600 hover:text-purple-700'
            }`}
          >
            Accepted (0)
          </button>
          <button
            onClick={() => setActiveTab('rejected')}
            className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-300 ease-out font-display ${
              activeTab === 'rejected'
                ? 'bg-gradient-to-r from-purple-600 via-blue-600 to-purple-700 text-white shadow-lg shadow-purple-500/30'
                : 'text-slate-600 hover:text-purple-700'
            }`}
          >
            Rejected (0)
          </button>
        </div>

        {/* Ride Request Cards */}
        <div className="space-y-6">
          {filteredRequests.length === 0 ? (
            <div className="p-12 text-center bg-white border-2 border-purple-100 shadow-2xl rounded-3xl shadow-purple-500/20">
              <div className="flex items-center justify-center w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-100 to-blue-100">
                <AlertCircle className="w-10 h-10 text-purple-600" />
              </div>
              <h3 className="mb-2 text-2xl font-bold text-transparent bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text font-display">
                No {activeTab} requests
              </h3>
              <p className="text-slate-600">
                {activeTab === 'pending' 
                  ? 'New ride requests will appear here'
                  : `You don't have any ${activeTab} requests yet`
                }
              </p>
            </div>
          ) : (
            filteredRequests.map((request) => (
              <div
                key={request.id}
                className="relative p-8 overflow-hidden transition-all duration-300 ease-out bg-white border-2 border-purple-100 shadow-2xl rounded-3xl shadow-purple-500/20 hover:shadow-3xl hover:border-purple-200"
              >
                {/* Background Gradient */}
                <div className="absolute inset-0 opacity-5 bg-gradient-to-br from-purple-600 via-blue-600 to-purple-700"></div>

                <div className="relative z-10 grid gap-6 lg:grid-cols-3">
                  {/* Left: Passenger Info */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-16 h-16 text-xl font-bold text-white rounded-full bg-gradient-to-br from-purple-600 to-blue-600 font-display">
                        {(request.passenger || 'P').substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-900 font-display">
                          {request.passenger || 'Passenger'}
                        </h3>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              className={`w-4 h-4 ${
                                i < Math.floor(request.passenger_rating || 5)
                                  ? 'text-yellow-500'
                                  : 'text-slate-300'
                              }`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                          <span className="ml-1 text-sm font-medium text-slate-600">
                            {request.passenger_rating || '5.0'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl">
                      <div className="flex items-center gap-2 text-sm text-slate-700">
                        <Phone className="w-4 h-4 text-purple-600" />
                        <span className="font-medium">{request.phone || request.email || 'Hidden'}</span>
                      </div>
                    </div>

                    <div className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl">
                      <div className="flex items-center gap-2 text-sm text-slate-700">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <span className="font-medium">Requested {request.time || 'Just now'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Route Details */}
                  <div className="space-y-4">
                    <div className="relative p-5 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl">
                      <div className="flex items-start gap-3">
                        <div className="flex flex-col items-center gap-2 mt-1">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <div className="w-0.5 h-16 bg-gradient-to-b from-green-500 via-purple-500 to-red-500"></div>
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        </div>
                        <div className="flex-1 space-y-4">
                          <div>
                            <p className="mb-1 text-xs font-bold text-green-700 uppercase font-display">
                              Pickup
                            </p>
                            <p className="mb-1 font-bold text-slate-900 font-display">
                              {request.pickup || 'Pickup Location'}
                            </p>
                          </div>
                          <div>
                            <p className="mb-1 text-xs font-bold text-red-700 uppercase font-display">
                              Drop-off
                            </p>
                            <p className="mb-1 font-bold text-slate-900 font-display">
                              {request.dropoff || request.destination || 'Destination'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-4 text-center bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl">
                        <Navigation className="w-5 h-5 mx-auto mb-2 text-purple-600" />
                        <p className="text-sm font-bold text-slate-600 font-display">Distance</p>
                        <p className="text-lg font-bold text-slate-900 font-display">
                          {request.distance}
                        </p>
                      </div>
                      <div className="p-4 text-center bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl">
                        <Clock className="w-5 h-5 mx-auto mb-2 text-blue-600" />
                        <p className="text-sm font-bold text-slate-600 font-display">Duration</p>
                        <p className="text-lg font-bold text-slate-900 font-display">
                          {request.duration}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right: Fare & Actions */}
                  <div className="flex flex-col justify-between space-y-4">
                    <div className="p-6 text-center border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl">
                      <DollarSign className="w-8 h-8 mx-auto mb-2 text-green-600" />
                      <p className="mb-1 text-sm font-bold text-green-700 font-display">
                        FARE AMOUNT
                      </p>
                      <p className="text-5xl font-bold text-transparent bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text font-display">
                        {request.fare}
                      </p>
                    </div>

                    {activeTab === 'pending' && (
                      <div className="space-y-3">
                        <button
                          onClick={() => handleAcceptRide(request.id)}
                          className="relative flex items-center justify-center w-full gap-3 px-6 py-4 overflow-hidden font-bold text-white transition-all duration-300 ease-out shadow-xl bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl hover:from-green-700 hover:to-emerald-700 shadow-green-500/50 hover:shadow-green-600/70 hover:-translate-y-1 hover:scale-105 group font-display"
                        >
                          <div className="absolute inset-0 transition-opacity duration-300 ease-out opacity-0 bg-gradient-to-r from-emerald-700 to-green-600 group-hover:opacity-100"></div>
                          <CheckCircle className="relative z-10 w-6 h-6" />
                          <span className="relative z-10 text-lg">Accept Ride</span>
                        </button>

                        <button
                          onClick={() => handleRejectRide(request.id)}
                          className="relative flex items-center justify-center w-full gap-3 px-6 py-4 overflow-hidden font-bold text-red-600 transition-all duration-300 ease-out border-2 border-red-200 rounded-2xl bg-gradient-to-br from-red-50 to-rose-50 hover:from-red-100 hover:to-rose-100 hover:border-red-300 hover:shadow-lg group font-display"
                        >
                          <XCircle className="w-6 h-6" />
                          <span className="text-lg">Reject</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
