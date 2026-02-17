import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/common/Header';
import { User, Mail, Phone, MapPin, Calendar, LogOut, Edit, Shield } from 'lucide-react';

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
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Main Content */}
      <div className="pt-24 pb-12 px-4 mx-auto max-w-4xl">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              {/* Avatar */}
              <div className="w-24 h-24 bg-black text-white rounded-full flex items-center justify-center text-3xl font-bold">
                {userData.name ? userData.name.charAt(0).toUpperCase() : 'U'}
              </div>
              
              {/* User Info */}
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {userData.name || 'User'}
                </h1>
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  {isRider ? (
                    <>
                      <Shield className="w-4 h-4" />
                      <span className="text-sm font-medium">Rider Account</span>
                    </>
                  ) : (
                    <>
                      <User className="w-4 h-4" />
                      <span className="text-sm font-medium">Passenger Account</span>
                    </>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  Member since {new Date().getFullYear()}
                </p>
              </div>
            </div>
            
            {/* Edit Button */}
            <button className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Edit className="w-4 h-4" />
              Edit Profile
            </button>
          </div>
        </div>

        {/* Profile Details */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Personal Information</h2>
          
          <div className="space-y-4">
            {/* Email */}
            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <Mail className="w-5 h-5 text-gray-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">Email</p>
                <p className="text-gray-900">{userData.email || 'Not provided'}</p>
              </div>
            </div>

            {/* Phone */}
            {userData.phone && (
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <Phone className="w-5 h-5 text-gray-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">Phone</p>
                  <p className="text-gray-900">{userData.phone}</p>
                </div>
              </div>
            )}

            {/* Address */}
            {userData.address && (
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <MapPin className="w-5 h-5 text-gray-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">Address</p>
                  <p className="text-gray-900">{userData.address}</p>
                </div>
              </div>
            )}

            {/* Join Date */}
            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <Calendar className="w-5 h-5 text-gray-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">Member Since</p>
                <p className="text-gray-900">
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
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Rider Stats</h2>
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-black mb-1">0</div>
                <div className="text-sm text-gray-600">Total Rides</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-black mb-1">0</div>
                <div className="text-sm text-gray-600">Passengers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-black mb-1">5.0</div>
                <div className="text-sm text-gray-600">Rating</div>
              </div>
            </div>
          </div>
        )}

        {/* Logout Button */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full px-6 py-3 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
