# Quick Start Guide - Testing Proximity-Based Ride Requests

## Overview
✅ **Implemented**: Ride requests are now sent only to riders within 1km of the passenger's pickup location.

## What Changed

### Backend Changes
1. **Added distance calculation** using Haversine formula
2. **Modified bookRide API** to accept pickup coordinates
3. **Targeted notifications** via Socket.IO to specific nearby riders
4. **Fixed all SQL queries** to use correct column names (`full_name`, `first_name`, `last_name`)

### Files Modified
- ✅ `/backend/controllers/rides.controller.js` - Added proximity matching
- ✅ `/backend/config/socket.js` - Targeted rider notifications
- ✅ `/backend/controllers/dashboard.controller.js` - Fixed SQL queries

## How to Test

### Step 1: Prepare Test Riders

Run the SQL commands in `backend/db/test_proximity_system.sql` or manually:

```sql
-- Set up 4 test riders with different locations
UPDATE riders 
SET current_location = '23.0225, 72.5714', is_online = true, vehicle_type = 'car'
WHERE id = 1;

UPDATE riders 
SET current_location = '23.0235, 72.5724', is_online = true, vehicle_type = 'car'
WHERE id = 2;

UPDATE riders 
SET current_location = '23.0245, 72.5734', is_online = true, vehicle_type = 'car'
WHERE id = 3;

-- This rider is >1km away - won't receive notification
UPDATE riders 
SET current_location = '23.0350, 72.5850', is_online = true, vehicle_type = 'car'
WHERE id = 4;
```

### Step 2: Book a Ride (via Postman or Frontend)

**API Endpoint:** `POST http://localhost:3000/api/rides/book`

**Headers:**
```
Authorization: Bearer <your_passenger_token>
Content-Type: application/json
```

**Body:**
```json
{
  "pickup": "Airport Terminal 1 (23.0225, 72.5714)",
  "destination": "City Mall (23.0450, 72.6000)",
  "distance": 8.5,
  "fare": 250,
  "rideType": "personal",
  "vehicleType": "car",
  "pickupCoordinates": {
    "lat": 23.0225,
    "lng": 72.5714
  }
}
```

**Expected Response:**
```json
{
  "success": true,
  "rideId": 1,
  "nearbyRiders": 3,
  "ridersNotified": [
    { "id": 1, "name": "John Doe", "distance": "0.00" },
    { "id": 2, "name": "Jane Smith", "distance": "0.12" },
    { "id": 3, "name": "Bob Wilson", "distance": "0.24" }
  ],
  "message": "Ride requested! 3 nearby rider(s) notified."
}
```

### Step 3: Check Backend Logs

In the backend terminal, you should see:
```
📢 Ride request 1 sent to rider 1: 1
📢 Ride request 1 sent to rider 2: 1
📢 Ride request 1 sent to rider 3: 1
```

Rider 4 (who is >1km away) should NOT appear in the logs.

### Step 4: Rider Dashboard Integration

Riders need to connect to Socket.IO to receive notifications. Add this to `RiderDashboard.jsx`:

```javascript
import { useEffect } from 'react';
import io from 'socket.io-client';

useEffect(() => {
  // Get rider ID from auth
  const riderId = /* get from your auth context */;
  
  // Connect to socket
  const socket = io('http://localhost:3000');
  
  // Join rider room
  socket.emit('rider-online', riderId);
  
  // Listen for new ride requests
  socket.on('new-ride-request', (rideData) => {
    console.log('🚗 New ride request:', rideData);
    
    // Show notification
    showNotification({
      title: 'New Ride Request',
      message: `${rideData.passenger} needs a ride from ${rideData.pickup}`,
      rideId: rideData.id
    });
    
    // Refresh pending requests
    fetchPendingRequests();
  });
  
  return () => {
    socket.emit('rider-offline', riderId);
    socket.disconnect();
  };
}, []);
```

## Verification Checklist

- [ ] Backend server running on port 3000
- [ ] At least 4 riders in database with locations
- [ ] Passenger account with valid token
- [ ] Test riders have `is_online = true`
- [ ] Test riders have `current_location` set
- [ ] Test riders have matching `vehicle_type`

## Testing Without Frontend

Use this curl command:

```bash
curl -X POST http://localhost:3000/api/rides/book \
  -H "Authorization: Bearer YOUR_PASSENGER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pickup": "Airport (23.0225, 72.5714)",
    "destination": "Mall (23.0450, 72.6000)",
    "distance": 8.5,
    "fare": 250,
    "rideType": "personal",
    "vehicleType": "car",
    "pickupCoordinates": {
      "lat": 23.0225,
      "lng": 72.5714
    }
  }'
```

## Troubleshooting

### No riders notified
- Check riders have `is_online = true`
- Verify `current_location` is set with valid coordinates
- Ensure `vehicle_type` matches the booking request
- Check riders within 1km radius

### Riders not receiving notifications
- Verify Socket.IO is properly initialized
- Check rider dashboard connects to socket with `rider-online` event
- Look for socket connection logs in backend terminal

### Distance calculation issues
- Ensure coordinates are in decimal degrees format
- Latitude: -90 to 90
- Longitude: -180 to 180
- Format: "lat, lng" or "Location (lat, lng)"

## Current System Status

✅ **Backend**: Running on port 3000  
✅ **Database**: Connected to Neon PostgreSQL  
✅ **Socket.IO**: Initialized and ready  
✅ **Proximity Matching**: Implemented (1km radius)  
✅ **SQL Queries**: All fixed with correct column names  

## Next Steps

1. **Test the booking flow** with actual coordinates
2. **Integrate Socket.IO** in Rider Dashboard
3. **Add location tracking** for riders (GPS)
4. **Implement real-time location updates**
5. **Add push notifications** for better UX

---

For detailed documentation, see `PROXIMITY_RIDE_SYSTEM.md`
