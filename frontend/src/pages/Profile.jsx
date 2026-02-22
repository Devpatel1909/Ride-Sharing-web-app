import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/common/Header';
import { User, Mail, Phone, MapPin, Calendar, LogOut, Edit, Shield, Award, Star, TrendingUp } from 'lucide-react';

export default function Profile() {
  const navigate = useNavigate();
  
  // Initialize user data on mount
  const getUserData = () => {
    const token = localStorage.getItem('token');
    const riderToken = localStorage.getItem('riderToken');
    const user = localStorage.getItem('user');
    const rider = localStorage.getItem('rider');

    if (!token && !riderToken) {
      return null;
    }

    if (user) {
      try {
        return { data: JSON.parse(user), isRider: false };
      } catch (e) {
        console.error('Error parsing user data:', e);
        return null;
      }
    } else if (rider) {
      try {
        return { data: JSON.parse(rider), isRider: true };
      } catch (e) {
        console.error('Error parsing rider data:', e);
        return null;
      }
    }
    return null;
  };

  const initialData = getUserData();
  const userData = initialData?.data || null;
  const isRider = initialData?.isRider || false;

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token');
    const riderToken = localStorage.getItem('riderToken');

    if (!token && !riderToken) {
      // Not authenticated, redirect to login
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    // Clear all auth data
    localStorage.removeItem('token');
    localStorage.removeItem('riderToken');
    localStorage.removeItem('user');
    localStorage.removeItem('rider');
    
    // Redirect to home
    navigate('/');
  };

  if (!userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        <style>{`
          body {
            font-family: 'UberMove', 'UberMoveText', system-ui, -apple-system, 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif;
          }
        `}</style>
        <Header />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 border-4 border-transparent rounded-full border-t-blue-600 border-r-purple-600 animate-spin"></div>
            <p className="font-medium text-slate-600">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <style>{`
        body {
          font-family: 'UberMove', 'UberMoveText', system-ui, -apple-system, 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif;
        }
      `}</style>
      <Header />
      
      {/* Main Content */}
      <div className="max-w-4xl px-4 pt-24 pb-12 mx-auto">
        {/* Profile Header */}
        <div className="relative p-8 mb-6 overflow-hidden bg-white border-2 border-blue-100 shadow-2xl rounded-3xl shadow-blue-500/20">
          {/* Gradient Background Overlay */}
          <div className="absolute inset-0 opacity-5 bg-gradient-to-br from-blue-600 via-purple-600 to-purple-700"></div>
          
          <div className="relative z-10 flex items-start justify-between">
            <div className="flex items-center gap-6">
              {/* Avatar with Gradient Border */}
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-600 via-purple-600 to-purple-700 animate-pulse"></div>
                <div className="relative flex items-center justify-center w-24 h-24 m-1 text-3xl font-bold text-white rounded-full shadow-xl bg-gradient-to-br from-blue-600 via-purple-600 to-purple-700 font-display">
                  {userData.name ? userData.name.charAt(0).toUpperCase() : 'U'}
                </div>
              </div>
              
              {/* User Info */}
              <div>
                <h1 className="mb-2 text-4xl font-bold text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-purple-700 bg-clip-text font-display">
                  {userData.name || 'User'}
                </h1>
                <div className="flex items-center gap-2 mb-2">
                  {isRider ? (
                    <>
                      <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-gradient-to-br from-purple-100 to-blue-100">
                        <Shield className="w-4 h-4 text-purple-600" />
                      </div>
                      <span className="text-sm font-bold text-purple-700 font-display">Rider Account</span>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="text-sm font-bold text-blue-700 font-display">Passenger Account</span>
                    </>
                  )}
                </div>
                <p className="text-sm font-medium text-slate-500">
                  Member since {new Date().getFullYear()}
                </p>
              </div>
            </div>
            
            {/* Edit Button */}
            <button className="relative flex items-center gap-2 px-6 py-3 overflow-hidden font-bold text-white transition-all duration-300 ease-out shadow-xl bg-gradient-to-r from-blue-600 via-purple-600 to-purple-700 rounded-2xl hover:from-blue-700 hover:via-purple-700 hover:to-purple-800 shadow-blue-500/30 hover:shadow-blue-600/50 hover:-translate-y-1 hover:scale-105 group font-display">
              <div className="absolute inset-0 transition-opacity duration-300 ease-out opacity-0 bg-gradient-to-r from-purple-700 via-purple-600 to-blue-600 group-hover:opacity-100"></div>
              <Edit className="relative z-10 w-5 h-5 transition-transform duration-300 ease-out group-hover:rotate-12" />
              <span className="relative z-10">Edit Profile</span>
            </button>
          </div>
        </div>

        {/* Profile Details */}
        <div className="p-8 mb-6 bg-white border-2 border-purple-100 shadow-2xl rounded-3xl shadow-purple-500/20">
          <h2 className="mb-6 text-2xl font-bold text-transparent bg-gradient-to-r from-purple-600 via-blue-600 to-purple-700 bg-clip-text font-display">Personal Information</h2>
          
          <div className="space-y-4">
            {/* Email */}
            <div className="flex items-start gap-4 p-5 transition-all duration-300 ease-out border-2 border-transparent rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 hover:border-blue-200 hover:shadow-lg group">
              <div className="flex items-center justify-center w-10 h-10 transition-all duration-300 ease-out rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 group-hover:from-blue-600 group-hover:to-purple-600 group-hover:shadow-lg">
                <Mail className="w-5 h-5 text-blue-600 transition-colors duration-300 ease-out group-hover:text-white" />
              </div>
              <div className="flex-1">
                <p className="mb-1 text-sm font-bold text-slate-600 font-display">Email</p>
                <p className="font-medium text-slate-900">{userData.email || 'Not provided'}</p>
              </div>
            </div>

            {/* Phone */}
            {userData.phone && (
              <div className="flex items-start gap-4 p-5 transition-all duration-300 ease-out border-2 border-transparent rounded-2xl bg-gradient-to-br from-purple-50 to-blue-50 hover:border-purple-200 hover:shadow-lg group">
                <div className="flex items-center justify-center w-10 h-10 transition-all duration-300 ease-out rounded-xl bg-gradient-to-br from-purple-100 to-blue-100 group-hover:from-purple-600 group-hover:to-blue-600 group-hover:shadow-lg">
                  <Phone className="w-5 h-5 text-purple-600 transition-colors duration-300 ease-out group-hover:text-white" />
                </div>
                <div className="flex-1">
                  <p className="mb-1 text-sm font-bold text-slate-600 font-display">Phone</p>
                  <p className="font-medium text-slate-900">{userData.phone}</p>
                </div>
              </div>
            )}

            {/* Address */}
            {userData.address && (
              <div className="flex items-start gap-4 p-5 transition-all duration-300 ease-out border-2 border-transparent rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 hover:border-blue-200 hover:shadow-lg group">
                <div className="flex items-center justify-center w-10 h-10 transition-all duration-300 ease-out rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 group-hover:from-blue-600 group-hover:to-purple-600 group-hover:shadow-lg">
                  <MapPin className="w-5 h-5 text-blue-600 transition-colors duration-300 ease-out group-hover:text-white" />
                </div>
                <div className="flex-1">
                  <p className="mb-1 text-sm font-bold text-slate-600 font-display">Address</p>
                  <p className="font-medium text-slate-900">{userData.address}</p>
                </div>
              </div>
            )}

            {/* Join Date */}
            <div className="flex items-start gap-4 p-5 transition-all duration-300 ease-out border-2 border-transparent rounded-2xl bg-gradient-to-br from-purple-50 to-blue-50 hover:border-purple-200 hover:shadow-lg group">
              <div className="flex items-center justify-center w-10 h-10 transition-all duration-300 ease-out rounded-xl bg-gradient-to-br from-purple-100 to-blue-100 group-hover:from-purple-600 group-hover:to-blue-600 group-hover:shadow-lg">
                <Calendar className="w-5 h-5 text-purple-600 transition-colors duration-300 ease-out group-hover:text-white" />
              </div>
              <div className="flex-1">
                <p className="mb-1 text-sm font-bold text-slate-600 font-display">Member Since</p>
                <p className="font-medium text-slate-900">
                  {userData.createdAt 
                    ? new Date(userData.createdAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })
                    : new Date().toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Card (if applicable) */}
        {isRider && (
          <div className="p-8 mb-6 bg-white border-2 border-purple-100 shadow-2xl rounded-3xl shadow-purple-500/20">
            <h2 className="mb-6 text-2xl font-bold text-transparent bg-gradient-to-r from-purple-600 via-blue-600 to-purple-700 bg-clip-text font-display">Rider Stats</h2>
            <div className="grid grid-cols-3 gap-6">
              <div className="p-6 text-center transition-all duration-300 ease-out border-2 border-transparent bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl hover:border-blue-200 hover:shadow-xl hover:-translate-y-1 group">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div className="mb-1 text-4xl font-bold text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text font-display">0</div>
                <div className="text-sm font-bold text-slate-600 font-display">Total Rides</div>
              </div>
              <div className="p-6 text-center transition-all duration-300 ease-out border-2 border-transparent bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl hover:border-purple-200 hover:shadow-xl hover:-translate-y-1 group">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div className="mb-1 text-4xl font-bold text-transparent bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text font-display">0</div>
                <div className="text-sm font-bold text-slate-600 font-display">Passengers</div>
              </div>
              <div className="p-6 text-center transition-all duration-300 ease-out border-2 border-transparent bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl hover:border-blue-200 hover:shadow-xl hover:-translate-y-1 group">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600">
                  <Star className="w-6 h-6 text-white" />
                </div>
                <div className="mb-1 text-4xl font-bold text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text font-display">5.0</div>
                <div className="text-sm font-bold text-slate-600 font-display">Rating</div>
              </div>
            </div>
          </div>
        )}

        {/* Logout Button */}
        <div className="p-8 bg-white border-2 border-red-100 shadow-2xl rounded-3xl shadow-red-500/20">
          <button
            onClick={handleLogout}
            className="relative flex items-center justify-center w-full gap-3 px-6 py-4 overflow-hidden font-bold text-white transition-all duration-300 ease-out bg-gradient-to-r from-red-500 to-rose-600 rounded-2xl hover:from-red-600 hover:to-rose-700 shadow-xl shadow-red-500/30 hover:shadow-red-600/50 hover:-translate-y-1 hover:scale-[1.02] group font-display"
          >
            <div className="absolute inset-0 transition-opacity duration-300 ease-out opacity-0 bg-gradient-to-r from-rose-700 to-red-600 group-hover:opacity-100"></div>
            <LogOut className="relative z-10 w-5 h-5 transition-transform duration-300 ease-out group-hover:translate-x-1" />
            <span className="relative z-10 text-lg">Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}
