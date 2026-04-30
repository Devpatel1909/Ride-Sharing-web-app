import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import { 
  Car, TrendingUp, Users, Star, MapPin, Clock, DollarSign, Bell, CheckCircle,
  Activity, Award, BarChart, Calendar, Navigation, Phone, Shield, Target,
  TrendingDown, Zap, ThumbsUp, AlertCircle, CreditCard, Timer
} from 'lucide-react';
import { riderAPI } from '../../services/api';
import io from 'socket.io-client';

export default function RiderDashboard() {
  const navigate = useNavigate();
  const [riderData, setRiderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  // Initialize isOnline from localStorage to persist across refreshes
  const [isOnline, setIsOnline] = useState(() => {
    const saved = localStorage.getItem('riderIsOnline');
    return saved === 'true';
  });
  const [socket, setSocket] = useState(null);
  const [newRequestNotification, setNewRequestNotification] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [currentCoords, setCurrentCoords] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const lastLocationSyncAtRef = useRef(0);
  const LOCATION_SYNC_INTERVAL_MS = 15000;

  const formatRupee = (value) => {
    const normalized = String(value ?? '').replace(/₹/g, '').trim();
    return `₹${normalized || '0'}`;
  };

  // Socket.IO connection - separate from data fetching
  useEffect(() => {
    const riderToken = localStorage.getItem('riderToken');
    const rider = localStorage.getItem('rider');

    if (!riderToken) {
      navigate('/rider-login');
      return;
    }

    if (rider) {
      try {
        const riderData = JSON.parse(rider);
        setRiderData(riderData);
        
        // Initialize Socket.IO connection
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
        const socketUrl = API_BASE_URL.replace('/api', '');
        const newSocket = io(socketUrl, {
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000
        });

        newSocket.on('connect', () => {
          console.group('🔌 Socket.IO Connected');
          console.log('Socket ID:', newSocket.id);
          console.log('Rider ID:', riderData.id);
          console.log('Name:', `${riderData.firstName} ${riderData.lastName}`);
          console.log('Status: Ready to receive ride requests ✅');
          console.groupEnd();
          // Join rider room
          newSocket.emit('rider-online', riderData.id);
        });

        newSocket.on('new-ride-request', (rideData) => {
          console.log('🚗 New ride request received:', rideData);
          
          // Show notification popup
          setNewRequestNotification({
            title: 'New Ride Request!',
            message: `${rideData.passenger} needs a ${rideData.vehicleType}`,
            rideData: rideData
          });
          
          // Refresh dashboard details without showing the full-page loader
          fetchDashboardData();
          
          // Auto-hide notification after 10 seconds
          setTimeout(() => {
            setNewRequestNotification(null);
          }, 10000);
        });

        newSocket.on('disconnect', () => {
          console.log('❌ Socket disconnected');
        });

        newSocket.on('connect_error', (error) => {
          console.error('Socket connection error:', error);
        });

        newSocket.on('ride-status-updated', () => {
          // Keep stats/activity current when a ride status changes
          fetchDashboardData();
        });

        setSocket(newSocket);

        // Cleanup on unmount only
        return () => {
          console.log('Cleaning up socket connection...');
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

  // Fetch dashboard data - separate effect
  useEffect(() => {
    const riderToken = localStorage.getItem('riderToken');
    if (riderToken) {
      fetchDashboardData({ showLoader: true });
    }
  }, []); // Run once on mount

  // Geolocation tracking - separate effect
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    // Get initial position
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = `Location (${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)})`;
        setCurrentCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setCurrentLocation(location);
        console.log('📍 Initial location:', location);
      },
      (error) => {
        console.error('Location error:', error);
        setLocationError(error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );

    // Watch position for continuous updates
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const location = `Location (${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)})`;
        setCurrentCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setCurrentLocation(location);
        console.log('📍 Location updated:', location);
      },
      (error) => {
        console.error('Location watch error:', error);
        setLocationError(error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  // Update location when it changes (throttled) instead of fixed interval polling
  useEffect(() => {
    if (!currentLocation || !currentCoords || !isOnline) return;

    const now = Date.now();
    if (now - lastLocationSyncAtRef.current < LOCATION_SYNC_INTERVAL_MS) return;

    const syncLocation = async () => {
      try {
        await riderAPI.updateAvailability(true, currentLocation);
        lastLocationSyncAtRef.current = now;
        console.log('📡 Location synced to server:', currentLocation);
      } catch (error) {
        console.error('Failed to update location:', error);
      }
    };

    syncLocation();
  }, [currentLocation, currentCoords, isOnline]);

  const fetchDashboardData = async ({ showLoader = false } = {}) => {
    try {
      if (showLoader) {
        setLoading(true);
      }
      const [
        statsData,
        requestsData,
        activitiesData
      ] = await Promise.all([
        riderAPI.getDashboardStats(),
        riderAPI.getPendingRequests(),
        riderAPI.getRecentActivity()
      ]);

      setStats(statsData);
      setPendingRequests(requestsData.requests || []);
      setRecentActivities(activitiesData.activities || []);
      
      // Update isOnline from database (persist actual status from DB)
      if (statsData.stats && typeof statsData.stats.isOnline === 'boolean') {
        setIsOnline(statsData.stats.isOnline);
        localStorage.setItem('riderIsOnline', statsData.stats.isOnline.toString());
        
        // 🚀 Console: Log dashboard data load
        console.group('📊 Rider Dashboard Data Loaded');
        console.log(`Status: ${statsData.stats.isOnline ? '🟢 ONLINE' : '🔴 OFFLINE'}`);
        console.log('📈 Stats:', {
          totalRides: statsData.stats.totalRides || 0,
          totalEarnings: statsData.stats.totalEarnings || 0,
          rating: statsData.stats.rating || 5.0
        });
        console.log('📍 Current Location:', currentLocation || 'NOT SET');
        console.log('🔔 Pending Requests:', requestsData.requests?.length || 0);
        console.groupEnd();
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const data = await riderAPI.getPendingRequests();
      setPendingRequests(data.requests || []);
    } catch (error) {
      console.error('Failed to fetch pending requests:', error);
    }
  };

  const handleToggleAvailability = async () => {
    try {
      const newStatus = !isOnline;
      
      // 🚀 Console: Log status change attempt
      console.group(`🔄 Toggling Online Status: ${isOnline ? 'ONLINE' : 'OFFLINE'} → ${newStatus ? 'ONLINE' : 'OFFLINE'}`);
      console.log('📍 Current Location:', currentLocation || 'NOT SET');
      console.log('📅 Time:', new Date().toLocaleTimeString());
      
      await riderAPI.updateAvailability(newStatus, currentLocation);
      setIsOnline(newStatus);
      if (newStatus) {
        lastLocationSyncAtRef.current = Date.now();
      }
      // Persist to localStorage
      localStorage.setItem('riderIsOnline', newStatus.toString());
      
      console.log('✅ Status Update Successful!');
      console.log('💾 Saved to localStorage:', newStatus);
      console.groupEnd();
      
      if (newStatus) {
        alert('✅ You are now ONLINE and ready to receive ride requests!');
      } else {
        alert('⭕ You are now OFFLINE. You will not receive new ride requests.');
      }
    } catch (error) {
      console.error('❌ Failed to update availability:', error);

      if (error?.status === 401 || error?.status === 403) {
        localStorage.removeItem('riderToken');
        localStorage.removeItem('rider');
        localStorage.removeItem('riderIsOnline');
        alert('Your rider session expired. Please login again.');
        navigate('/rider-login', { replace: true });
        return;
      }

      alert(error?.message || 'Failed to update availability status');
    }
  };

  const handleManualRefresh = async () => {
    await fetchDashboardData();
  };

  const handleManualLocationUpdate = async () => {
    if (!currentLocation) {
      alert('Location not available yet. Please allow GPS and try again.');
      return;
    }

    try {
      await riderAPI.updateAvailability(isOnline, currentLocation);
      lastLocationSyncAtRef.current = Date.now();
      alert('📍 Location updated successfully');
    } catch (error) {
      console.error('Manual location update failed:', error);
      alert('Failed to update location');
    }
  };

  const handleAcceptRide = async (rideId) => {
    try {
      console.log('Accepting ride:', rideId);
      const result = await riderAPI.acceptRide(rideId);
      
      if (result.success) {
        alert('✅ Ride accepted successfully!');
        // Refresh pending requests
        await fetchPendingRequests();
        // Refresh all dashboard data
        await fetchDashboardData();
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
        alert('❌ Ride rejected');
        // Refresh pending requests
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
            <p className="font-medium text-slate-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  const statsDisplay = [
    {
      icon: TrendingUp,
      label: 'Total Rides',
      value: stats?.totalRides || '0',
      subtext: `${stats?.completedToday || 0} today`,
      emoji: '🚗',
      color: 'from-blue-600 to-purple-600',
      bgColor: 'from-blue-50 to-purple-50',
      iconBg: 'from-blue-100 to-purple-100',
    },
    {
      icon: DollarSign,
      label: 'Total Earnings',
      value: `₹${stats?.totalEarnings || '0'}`,
      subtext: `₹${stats?.todayEarnings || 0} today`,
      emoji: '💰',
      color: 'from-green-600 to-emerald-600',
      bgColor: 'from-green-50 to-emerald-50',
      iconBg: 'from-green-100 to-emerald-100',
    },
    {
      icon: Users,
      label: 'Passengers',
      value: stats?.totalPassengers || '0',
      subtext: `${stats?.repeatCustomers || 0} repeat`,
      emoji: '👥',
      color: 'from-purple-600 to-blue-600',
      bgColor: 'from-purple-50 to-blue-50',
      iconBg: 'from-purple-100 to-blue-100',
    },
    {
      icon: Star,
      label: 'Rating',
      value: stats?.rating?.toFixed(1) || '5.0',
      subtext: `${stats?.totalReviews || 0} reviews`,
      emoji: '⭐',
      color: 'from-yellow-600 to-orange-600',
      bgColor: 'from-yellow-50 to-orange-50',
      iconBg: 'from-yellow-100 to-orange-100',
    },
  ];

  const performanceMetrics = [
    {
      label: 'Acceptance Rate',
      value: `${stats?.acceptanceRate || 95}%`,
      icon: ThumbsUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      trend: stats?.acceptanceTrend || '↑ 2%'
    },
    {
      label: 'Completion Rate',
      value: `${stats?.completionRate || 98}%`,
      icon: CheckCircle,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      trend: stats?.completionTrend || '↑ 1%'
    },
    {
      label: 'Average Time',
      value: `${stats?.avgResponseTime || 45}s`,
      icon: Timer,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      trend: stats?.timeTrend || '↓ 5s'
    },
    {
      label: 'Cancellation Rate',
      value: `${stats?.cancellationRate || 2}%`,
      icon: AlertCircle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      trend: stats?.cancellationTrend || '↓ 1%'
    },
  ];

  const earningsBreakdown = [
    {
      period: 'Today',
      amount: stats?.todayEarnings || 0,
      rides: stats?.completedToday || 0,
      icon: Calendar,
      color: 'from-blue-600 to-cyan-600'
    },
    {
      period: 'This Week',
      amount: stats?.weekEarnings || 0,
      rides: stats?.weekRides || 0,
      icon: BarChart,
      color: 'from-purple-600 to-pink-600'
    },
    {
      period: 'This Month',
      amount: stats?.monthEarnings || 0,
      rides: stats?.monthRides || 0,
      icon: TrendingUp,
      color: 'from-green-600 to-emerald-600'
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50">
      <style>{`
        body {
          font-family: 'UberMove', 'UberMoveText', system-ui, -apple-system, 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif;
        }
      `}</style>
      <Header />

      {/* Real-time Ride Request Notification */}
      {newRequestNotification && (
        <div className="fixed top-20 right-4 z-50 animate-bounce">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 rounded-2xl shadow-2xl max-w-md border-4 border-white">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white rounded-full">
                  <Bell className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{newRequestNotification.title}</h3>
                  <p className="text-sm text-green-100">New ride available</p>
                </div>
              </div>
              <button 
                onClick={() => setNewRequestNotification(null)}
                className="text-white hover:text-green-100 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2 mb-4">
              <p className="font-semibold">{newRequestNotification.message}</p>
              <div className="bg-white/20 rounded-lg p-3 space-y-1">
                <p className="text-sm"><strong>From:</strong> {newRequestNotification.rideData.pickup}</p>
                <p className="text-sm"><strong>To:</strong> {newRequestNotification.rideData.destination}</p>
                <p className="text-sm"><strong>Fare:</strong> {formatRupee(newRequestNotification.rideData.fare)}</p>
                <p className="text-sm"><strong>Distance:</strong> {newRequestNotification.rideData.distance} km</p>
              </div>
            </div>
            <button 
              onClick={() => {
                setNewRequestNotification(null);
                fetchPendingRequests();
              }}
              className="w-full bg-white text-green-600 font-bold py-3 px-4 rounded-xl hover:bg-green-50 transition-colors"
            >
              View Request Details
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="px-4 pt-24 pb-12 mx-auto max-w-7xl">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="mb-2 text-5xl font-bold text-transparent bg-gradient-to-r from-purple-600 via-blue-600 to-purple-700 bg-clip-text font-display">
            Welcome back, {riderData?.name || 'Rider'}! 👋
          </h1>
          <p className="text-lg font-medium text-slate-600">
            🎯 Ready to accept new ride requests and earn money today 💵
          </p>
          <button
            onClick={handleManualRefresh}
            className="px-4 py-2 mt-4 text-sm font-bold text-purple-700 transition-colors border border-purple-200 rounded-lg bg-white/80 hover:bg-purple-50"
          >
            Refresh Details
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
          {statsDisplay.map((stat, index) => (
            <div
              key={index}
              className={`relative p-6 overflow-hidden bg-white border-2 shadow-xl border-purple-100 rounded-3xl shadow-purple-500/20 transition-all duration-300 ease-out hover:-translate-y-2 hover:shadow-2xl hover:border-purple-200 group`}
            >
              <div className={`absolute inset-0 opacity-5 bg-gradient-to-br ${stat.color}`}></div>
              <div className="relative z-10">
                <div className="flex items-center justify-center mb-4 text-2xl transition-transform duration-300 ease-out w-14 h-14 bg-slate-900 rounded-xl group-hover:scale-110">
                  {stat.emoji}
                </div>
                <p className="mb-1 text-sm font-bold text-slate-600 font-display">{stat.label}</p>
                <p className={`text-4xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent font-display mb-2`}>
                  {stat.value}
                </p>
                <p className="text-xs font-medium text-slate-500">{stat.subtext}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Earnings Breakdown Section */}
        <div className="grid gap-6 mb-8 md:grid-cols-3">
          {earningsBreakdown.map((earning, index) => (
            <div
              key={index}
              className="relative p-6 overflow-hidden bg-white border-2 shadow-xl border-purple-100 rounded-3xl shadow-purple-500/20 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-2xl group"
            >
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${earning.color} opacity-5 rounded-full -mr-16 -mt-16`}></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <earning.icon className={`w-8 h-8 bg-gradient-to-br ${earning.color} bg-clip-text text-transparent`} />
                  <div className={`px-3 py-1 text-xs font-bold text-white rounded-full bg-gradient-to-r ${earning.color}`}>
                    {earning.rides} rides
                  </div>
                </div>
                <p className="mb-2 text-sm font-bold text-slate-600 font-display">{earning.period}</p>
                <p className={`text-3xl font-bold bg-gradient-to-r ${earning.color} bg-clip-text text-transparent font-display`}>
                  ₹{earning.amount}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Avg: ₹{earning.rides > 0 ? Math.round(earning.amount / earning.rides) : 0} per ride
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Performance Metrics */}
        <div className="grid gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
          {performanceMetrics.map((metric, index) => (
            <div
              key={index}
              className={`p-5 bg-white border-2 border-purple-100 rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 ${metric.bgColor} rounded-xl`}>
                  <metric.icon className={`w-5 h-5 ${metric.color}`} />
                </div>
                <span className="text-xs font-medium text-slate-600">{metric.label}</span>
              </div>
              <p className={`text-2xl font-bold ${metric.color} mb-1`}>{metric.value}</p>
              <p className="text-xs font-medium text-green-600">{metric.trend}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid gap-6 mb-8 md:grid-cols-3">
          {/* Pending Ride Requests */}
          <div className="p-8 bg-white border-2 border-purple-100 shadow-2xl md:col-span-2 rounded-3xl shadow-purple-500/20">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-transparent bg-gradient-to-r from-purple-600 via-blue-600 to-purple-700 bg-clip-text font-display">
                  🔔 Pending Ride Requests
                </h2>
                <p className="mt-1 text-sm text-slate-600">Accept rides to start earning</p>
              </div>
              <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-blue-100">
                <Bell className="w-6 h-6 text-purple-600" />
                {pendingRequests.length > 0 && (
                  <div className="absolute flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-red-500 rounded-full -top-2 -right-2 animate-pulse">
                    {pendingRequests.length}
                  </div>
                )}
              </div>
            </div>

            {pendingRequests.length === 0 ? (
              <div className="py-12 text-center">
                <div className="flex items-center justify-center w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-100 to-blue-100">
                  <Zap className="w-10 h-10 text-purple-600" />
                </div>
                <p className="text-lg font-medium text-slate-600">⏳ No pending requests</p>
                <p className="mt-2 text-sm text-slate-500">Make sure you're online to receive ride requests</p>
              </div>
            ) : (
              <>
                {/* Preview of requests */}
                <div className="space-y-4 mb-6">
                  {pendingRequests.slice(0, 3).map((request) => (
                    <div
                      key={request.id}
                      className="p-5 transition-all duration-300 ease-out border-2 border-transparent bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl hover:border-purple-300 hover:shadow-xl group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex items-center justify-center w-10 h-10 text-lg bg-white rounded-full shadow-md">
                              👤
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 font-display">{request.passenger_name || 'Passenger'}</p>
                              <div className="flex items-center gap-2 text-xs text-slate-600">
                                <Phone className="w-3 h-3" />
                                <span>{request.passenger_phone || 'Hidden'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="px-4 py-2 mb-1 text-lg font-bold text-green-700 bg-green-100 rounded-full font-display">
                            {formatRupee(request.fare)}
                          </div>
                          <div className="text-xs text-slate-500">{request.distance || 0}km</div>
                        </div>
                      </div>
                      
                      <div className="space-y-2 mb-3">
                        <div className="flex items-start gap-2 text-sm">
                          <div className="p-1.5 bg-green-100 rounded-lg">
                            <MapPin className="w-4 h-4 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-medium text-slate-500">Pickup</p>
                            <p className="font-medium text-slate-800">📍 {request.pickup_location}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2 text-sm">
                          <div className="p-1.5 bg-red-100 rounded-lg">
                            <Navigation className="w-4 h-4 text-red-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-medium text-slate-500">Dropoff</p>
                            <p className="font-medium text-slate-800">🎯 {request.destination}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 pt-3 border-t border-purple-200">
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{request.time || 'Just now'}</span>
                        </div>
                        <div className={`flex items-center gap-2 text-xs font-medium px-3 py-1 rounded-full ${
                          request.ride_type === 'shared' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                        }`}>
                          <Car className="w-3.5 h-3.5" />
                          <span>{request.ride_type === 'shared' ? '👥 Shared' : '🚗 Personal'}</span>
                        </div>
                        <div className="flex items-center gap-1 ml-auto">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span className="text-xs font-medium text-slate-600">{request.passenger_rating || '5.0'}</span>
                        </div>
                      </div>
                      <div className="mt-2 text-xs font-semibold text-slate-600">
                        Payment: {(request.paymentMethod || 'cash').toUpperCase()}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => navigate('/rider/ride-requests')}
                  className="relative flex items-center justify-center w-full gap-3 px-6 py-4 overflow-hidden font-bold text-white transition-all duration-300 ease-out shadow-xl bg-gradient-to-r from-purple-600 via-blue-600 to-purple-700 rounded-2xl hover:from-purple-700 hover:via-blue-700 hover:to-purple-800 shadow-purple-500/50 hover:shadow-purple-600/70 hover:-translate-y-1 hover:scale-105 group font-display"
                >
                  <div className="absolute inset-0 transition-opacity duration-300 ease-out opacity-0 bg-gradient-to-r from-blue-700 via-purple-600 to-blue-600 group-hover:opacity-100"></div>
                  <span className="relative z-10 text-lg">View All Requests ({pendingRequests.length})</span>
                  <CheckCircle className="relative z-10 w-6 h-6 transition-transform duration-300 ease-out group-hover:scale-110" />
                </button>
              </>
            )}
          </div>

          {/* Quick Status & Profile */}
          <div className="p-8 bg-white border-2 border-blue-100 shadow-2xl rounded-3xl shadow-blue-500/20">
            <h2 className="mb-6 text-2xl font-bold text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 bg-clip-text font-display">
              ⚡ Quick Status
            </h2>

            <div className="space-y-4">
              {/* Availability Toggle */}
              <div className="p-6 transition-all duration-300 ease-out border-2 border-transparent bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl hover:border-blue-200 hover:shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-slate-700 font-display">{isOnline ? '🟢' : '🔴'} Availability</span>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                    <span className={`text-sm font-bold font-display ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
                      {isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={handleToggleAvailability}
                  className={`w-full px-4 py-3 font-bold text-white transition-all duration-300 ease-out rounded-xl hover:shadow-lg font-display ${
                    isOnline 
                      ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800' 
                      : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                  }`}
                >
                  {isOnline ? 'Go Offline' : 'Go Online'}
                </button>
                {isOnline && (
                  <p className="mt-2 text-xs text-center text-green-600">✨ You're receiving ride requests</p>
                )}
              </div>

              {/* Location Tracking Status */}
              <div className="p-6 transition-all duration-300 ease-out border-2 border-transparent bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl hover:border-green-200 hover:shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-slate-700 font-display">📍 Location Tracking</span>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${currentLocation ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></div>
                    <span className={`text-sm font-bold font-display ${currentLocation ? 'text-green-600' : 'text-yellow-600'}`}>
                      {currentLocation ? 'Active' : 'Initializing...'}
                    </span>
                  </div>
                </div>
                {locationError ? (
                  <div className="p-3 text-xs text-red-700 bg-red-100 rounded-lg">
                    ⚠️ {locationError}
                  </div>
                ) : currentLocation ? (
                  <div className="space-y-2">
                    <div className="p-3 text-xs bg-white rounded-lg shadow-sm font-mono text-gray-700">
                      {currentLocation}
                    </div>
                    <div className="flex items-center justify-center gap-2 text-xs text-green-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span>Updates on movement with periodic sync</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-center text-yellow-600">📡 Waiting for GPS signal...</p>
                )}
              </div>

              {/* Driver Profile */}
              <div className="p-6 transition-all duration-300 ease-out border-2 border-transparent bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl hover:border-purple-200 hover:shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-12 h-12 text-2xl bg-white rounded-full shadow-md">
                    👨‍✈️
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 font-display">{riderData?.name || 'Driver'}</p>
                    <div className="flex items-center gap-1">
                      <Shield className="w-3 h-3 text-green-600" />
                      <span className="text-xs font-medium text-green-600">Verified Driver</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">License</span>
                    <span className="font-medium text-slate-800">{riderData?.license_number || 'DL-XXXX'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Experience</span>
                    <span className="font-medium text-slate-800">{riderData?.experience || '3'} years</span>
                  </div>
                </div>
              </div>

              {/* Vehicle Info */}
              <div className="p-6 transition-all duration-300 ease-out border-2 border-transparent bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl hover:border-purple-200 hover:shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-blue-100">
                    <Car className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-700 font-display">🚙 Your Vehicle</p>
                    <p className="text-xs text-green-600 font-medium">✅ Ready for rides</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Model</span>
                    <span className="font-medium text-slate-800">{riderData?.vehicle_model || 'Sedan'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Number</span>
                    <span className="font-medium text-slate-800">{riderData?.vehicle_number || 'DL-XX-XXXX'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Type</span>
                    <span className="font-medium text-slate-800">{riderData?.vehicle_type || 'AC Sedan'}</span>
                  </div>
                </div>
              </div>

              {/* Create Shared Ride */}
              <div className="p-6 transition-all duration-300 ease-out border-2 border-transparent bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl hover:border-amber-200 hover:shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100">
                    <Users className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-700 font-display">🚗 Shared Rides</p>
                    <p className="text-xs text-amber-600 font-medium">💰 Earn more</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/rider/create-shared-ride')}
                  className="w-full px-4 py-3 font-bold text-white bg-gradient-to-r from-amber-600 to-orange-600 rounded-xl hover:from-amber-700 hover:to-orange-700 transition-all duration-300 ease-out hover:shadow-lg"
                >
                  + Post Shared Ride
                </button>
                <p className="mt-3 text-xs text-center text-amber-700">Split fares with other passengers</p>
              </div>

              {/* Location */}
              <div className="p-6 transition-all duration-300 ease-out border-2 border-transparent bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl hover:border-blue-200 hover:shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-purple-100">
                    <MapPin className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-700 font-display">📍 Current Location</p>
                    <p className="text-sm text-slate-600 mt-1">
                      {riderData?.current_location || '🇮🇳 Delhi, India'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleManualLocationUpdate}
                  className="w-full px-4 py-2 mt-3 text-sm font-medium text-blue-600 transition-colors bg-blue-50 rounded-lg hover:bg-blue-100"
                >
                  📍 Update Location
                </button>
              </div>

              {/* Today's Goal */}
              <div className="p-6 transition-all duration-300 ease-out border-2 bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200 rounded-2xl">
                <div className="flex items-center gap-3 mb-3">
                  <Target className="w-6 h-6 text-yellow-600" />
                  <p className="font-bold text-slate-700 font-display">🎯 Today's Goal</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Target Earnings</span>
                    <span className="font-bold text-green-600">₹2000</span>
                  </div>
                  <div className="w-full bg-yellow-200 rounded-full h-2">
                    <div 
                      className="h-2 transition-all duration-500 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full"
                      style={{ width: `${((stats?.todayEarnings || 0) / 2000) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-slate-600 text-center">
                    ₹{stats?.todayEarnings || 0} / ₹2000 
                    <span className="ml-2 text-green-600">
                      ({Math.round(((stats?.todayEarnings || 0) / 2000) * 100)}%)
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="p-8 bg-white border-2 border-purple-100 shadow-2xl rounded-3xl shadow-purple-500/20">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-transparent bg-gradient-to-r from-purple-600 via-blue-600 to-purple-700 bg-clip-text font-display">
                📊 Recent Activity
              </h2>
              <p className="mt-1 text-sm text-slate-600">Your completed rides and earnings</p>
            </div>
            <button className="px-4 py-2 text-sm font-medium text-purple-600 transition-colors bg-purple-50 rounded-lg hover:bg-purple-100">
              View All
            </button>
          </div>
          
          {recentActivities.length === 0 ? (
            <div className="py-12 text-center">
              <div className="flex items-center justify-center w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-100 to-blue-100">
                <Car className="w-10 h-10 text-purple-600" />
              </div>
              <p className="text-lg font-medium text-slate-600">🚫 No rides completed yet</p>
              <p className="mt-2 text-sm text-slate-500">🚀 Start accepting requests to see your ride history here</p>
              <button 
                onClick={handleToggleAvailability}
                disabled={isOnline}
                className={`mt-4 px-6 py-3 font-bold text-white rounded-xl transition-all duration-300 ${
                  isOnline 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 hover:shadow-lg'
                }`}
              >
                {isOnline ? '✅ Already Online' : '🚀 Go Online Now'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div 
                  key={activity.id} 
                  className="relative p-5 transition-all duration-300 ease-out border-2 border-transparent bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl hover:border-purple-300 hover:shadow-xl group"
                >
                  {/* Ride Number Badge */}
                  <div className="absolute top-3 right-3">
                    <div className="px-3 py-1 text-xs font-bold text-purple-600 bg-white rounded-full shadow-md">
                      #{recentActivities.length - index}
                    </div>
                  </div>

                  <div className="flex items-start gap-4 mb-4">
                    {/* Passenger Avatar */}
                    <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 text-xl bg-white rounded-full shadow-md">
                      👤
                    </div>
                    
                    {/* Ride Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-bold text-slate-900 font-display">{activity.passenger_name || 'Passenger'}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-slate-500" />
                              <span className="text-xs text-slate-600">
                                {activity.completed_at 
                                  ? new Date(activity.completed_at).toLocaleString('en-IN', {
                                      day: 'numeric',
                                      month: 'short',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })
                                  : 'Recently'
                                }
                              </span>
                            </div>
                            {activity.rating && (
                              <div className="flex items-center gap-1">
                                <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                                <span className="text-xs font-medium text-slate-600">{activity.rating}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="px-4 py-2 text-lg font-bold text-green-700 bg-green-100 rounded-full font-display">
                            {formatRupee(activity.fare)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Locations */}
                  <div className="space-y-2 mb-3 pl-16">
                    <div className="flex items-start gap-2">
                      <div className="p-1.5 bg-green-100 rounded-lg">
                        <MapPin className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-slate-500">Pickup</p>
                        <p className="text-sm font-medium text-slate-800">📍 {activity.pickup_location}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-center w-0.5 h-4 ml-4 bg-slate-300"></div>
                    <div className="flex items-start gap-2">
                      <div className="p-1.5 bg-red-100 rounded-lg">
                        <Navigation className="w-4 h-4 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-slate-500">Dropoff</p>
                        <p className="text-sm font-medium text-slate-800">🎯 {activity.destination}</p>
                      </div>
                    </div>
                  </div>

                  {/* Ride Details Footer */}
                  <div className="flex items-center gap-4 pt-3 pl-16 border-t border-purple-200">
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Activity className="w-3.5 h-3.5" />
                      <span>{activity.distance || 0}km</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Timer className="w-3.5 h-3.5" />
                      <span>{activity.duration || '0'} min</span>
                    </div>
                    <div className={`flex items-center gap-2 text-xs font-medium px-3 py-1 rounded-full ${
                      activity.ride_type === 'shared' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                    }`}>
                      <Car className="w-3.5 h-3.5" />
                      <span>{activity.ride_type === 'shared' ? '👥 Shared' : '🚗 Personal'}</span>
                    </div>
                    {activity.payment_method && (
                      <div className="flex items-center gap-2 ml-auto text-xs text-slate-600">
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>{activity.payment_method}</span>
                      </div>
                    )}
                  </div>

                  {/* Passenger Feedback */}
                  {activity.feedback && (
                    <div className="p-3 mt-3 ml-16 bg-white border border-purple-200 rounded-lg">
                      <p className="text-xs font-medium text-slate-600 mb-1">💬 Passenger Feedback:</p>
                      <p className="text-sm text-slate-700 italic">"{activity.feedback}"</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
