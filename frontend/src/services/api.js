const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// Helper to get auth headers
const getAuthHeaders = (isRider = false) => {
  const token = isRider 
    ? sessionStorage.getItem('riderToken') 
    : sessionStorage.getItem('token');
  
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

// Handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: 'Network error' }));

    const message = error.error || error.message || 'Something went wrong';
    const apiError = new Error(message);
    apiError.status = response.status;
    throw apiError;
  }
  return response.json();
};

// Rider Dashboard APIs
export const riderAPI = {
  // Get dashboard statistics
  getDashboardStats: async () => {
    const response = await fetch(`${API_BASE_URL}/rider/dashboard/stats`, {
      headers: getAuthHeaders(true)
    });
    return handleResponse(response);
  },
  
  // Get pending ride requests
  getPendingRequests: async () => {
    const response = await fetch(`${API_BASE_URL}/rider/dashboard/pending-requests`, {
      headers: getAuthHeaders(true)
    });
    return handleResponse(response);
  },
  
  // Update rider availability (online/offline) and location
  updateAvailability: async (isOnline, currentLocation = null) => {
    const body = { isOnline };
    if (currentLocation) {
      body.currentLocation = currentLocation;
    }
    const response = await fetch(`${API_BASE_URL}/rider/dashboard/availability`, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: JSON.stringify(body)
    });
    return handleResponse(response);
  },
  
  // Get recent activity (completed rides)
  getRecentActivity: async () => {
    const response = await fetch(`${API_BASE_URL}/rider/dashboard/recent-activity`, {
      headers: getAuthHeaders(true)
    });
    return handleResponse(response);
  },
  
  // Accept a ride request
  acceptRide: async (rideId) => {
    const response = await fetch(`${API_BASE_URL}/rider/rides/accept/${rideId}`, {
      method: 'POST',
      headers: getAuthHeaders(true)
    });
    return handleResponse(response);
  },
  
  // Reject a ride request
  rejectRide: async (rideId) => {
    const response = await fetch(`${API_BASE_URL}/rider/rides/reject/${rideId}`, {
      method: 'POST',
      headers: getAuthHeaders(true)
    });
    return handleResponse(response);
  },
  
  // Update ride status (in-progress, completed)
  updateRideStatus: async (rideId, status) => {
    const response = await fetch(`${API_BASE_URL}/rides/${rideId}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(true),
      body: JSON.stringify({ status })
    });
    return handleResponse(response);
  }
};

// Rides/Booking APIs
export const ridesAPI = {
  // Check ride availability
  checkAvailability: async (pickup, destination, distance, pickupLat, pickupLon) => {
    const body = { pickup, destination, distance };
    if (pickupLat != null && pickupLon != null) {
      body.pickupLat = pickupLat;
      body.pickupLon = pickupLon;
    }
    const response = await fetch(`${API_BASE_URL}/rides/check-availability`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return handleResponse(response);
  },
  
  // Book a ride
  bookRide: async (rideData) => {
    const response = await fetch(`${API_BASE_URL}/rides/book`, {
      method: 'POST',
      headers: getAuthHeaders(false),
      body: JSON.stringify(rideData)
    });
    return handleResponse(response);
  },
  
  // Get ride details
  getRideDetails: async (rideId) => {
    const response = await fetch(`${API_BASE_URL}/rides/${rideId}`, {
      headers: getAuthHeaders(false)
    });
    return handleResponse(response);
  },

  // Shared Ride APIs
  // Get available shared rides
  getSharedAvailableRides: async (vehicleType = 'car') => {
    const response = await fetch(`${API_BASE_URL}/rides/shared-available`, {
      method: 'POST',
      headers: getAuthHeaders(false),
      body: JSON.stringify({ vehicleType })
    });
    return handleResponse(response);
  },

  // Join a shared ride
  joinSharedRide: async (rideId, rideData) => {
    const response = await fetch(`${API_BASE_URL}/rides/join-shared/${rideId}`, {
      method: 'POST',
      headers: getAuthHeaders(false),
      body: JSON.stringify(rideData)
    });
    return handleResponse(response);
  },

  // Get all passengers in a ride
  getRidePassengers: async (rideId) => {
    const response = await fetch(`${API_BASE_URL}/rides/${rideId}/passengers`, {
      headers: getAuthHeaders(false)
    });
    return handleResponse(response);
  },

  // Update passenger status (rider only)
  updatePassengerStatus: async (rideId, passengerId, status) => {
    const response = await fetch(`${API_BASE_URL}/rides/${rideId}/passengers/${passengerId}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(true),
      body: JSON.stringify({ status })
    });
    return handleResponse(response);
  }
};

// Payments APIs
export const paymentsAPI = {
  cancelPendingPayment: async (rideId) => {
    const response = await fetch(`${API_BASE_URL}/payments/ride/${rideId}/cancel`, {
      method: 'POST',
      headers: getAuthHeaders(false)
    });
    return handleResponse(response);
  }
};

// User/Passenger APIs
export const userAPI = {
  // Get user profile
  getProfile: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      headers: getAuthHeaders(false)
    });
    return handleResponse(response);
  },
  
  // Update profile
  updateProfile: async (profileData) => {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(false),
      body: JSON.stringify(profileData)
    });
    return handleResponse(response);
  }
};

export default {
  riderAPI,
  ridesAPI,
  paymentsAPI,
  userAPI
};
