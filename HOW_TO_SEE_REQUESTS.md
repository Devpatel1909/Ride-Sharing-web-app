# How to See Ride Requests - Testing Guide

## Problem Fixed
✅ **Socket.IO Integration Added** - Riders can now receive real-time notifications  
✅ **API Integration Complete** - RideRequests page fetches real data  
✅ **Accept/Reject Buttons Working** - Riders can respond to requests  

## What You Need to Test

### 1. Backend and Frontend Running
- **Backend**: http://localhost:3000 ✅ (Already running)
- **Frontend**: Should be running on http://localhost:5173

### 2. Set Up Test Data

Run this SQL to add rider location (required for proximity matching):

```sql
-- Update your rider's location (use your actual rider ID)
UPDATE riders 
SET current_location = '23.0225, 72.5714', 
    is_online = true,
    vehicle_type = 'car'
WHERE id = 1;  -- Replace with your rider ID

-- Verify it worked
SELECT id, first_name, last_name, current_location, is_online, vehicle_type
FROM riders WHERE id = 1;
```

### 3. Test Flow

#### Option A: Using Postman/API Client

**Step 1: Get Passenger Token**
```bash
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "passenger@example.com",
  "password": "password123"
}
```

**Step 2: Book a Ride**
```bash
POST http://localhost:3000/api/rides/book
Authorization: Bearer <passenger_token>
Content-Type: application/json  

{
  "pickup": "Airport Terminal (23.0225, 72.5714)",
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
  "nearbyRiders": 1,
  "ridersNotified": [
    {"id": 1, "name": "Your Name", "distance": "0.00"}
  ],
  "message": "Ride requested! 1 nearby rider(s) notified."
}
```

#### Option B: Using Frontend (Passenger Side)

1. Navigate to passenger ride booking page
2. Enter pickup location with coordinates: `Airport Terminal (23.0225, 72.5714)`
3. Enter destination
4. Select vehicle type: Car
5. Click Book Ride
6. Check browser console for response

### 4. What Should Happen

**On Rider Dashboard (http://localhost:5173/rider/dashboard)**:

1. **Green popup notification appears** in top-right corner
2. **Shows**:
   - Passenger name
   - Pickup location
   - Destination
   - Fare
   - Distance
3. **Pending Requests section updates** automatically
4. **Console logs**: "🚗 New ride request received: {rideData}"

**On Ride Requests Page (http://localhost:5173/rider/ride-requests)**:

1. Request appears immediately (real-time)
2. Shows full request details
3. Accept/Reject buttons are active

### 5. Accepting a Ride

Click "Accept" button on any request:
- Shows "✅ Ride accepted successfully!"
- Request disappears from pending list
- Passenger gets notified (via Socket.IO)
- Dashboard stats update

### 6. Troubleshooting

**Not seeing requests?**

Check browser console (F12) for:
```
✅ Socket connected: <socket-id>
🚗 New ride request received: {...}
```

**If socket is NOT connected:**
1. Check backend is running on port 3000
2. Check VITE_API_BASE_URL in frontend/.env
3. Look for connection errors in console

**If ride is booked but not received:**
1. Verify rider's `current_location` is set in database
2. Check rider's `vehicle_type` matches booking
3. Ensure rider's `is_online = true`
4. Verify proximity (must be within 1km)

**Backend logs to check:**
```
📢 Ride request <id> sent to rider <rider-id>: <ride-id>
```

### 7. Manual Database Check

```sql
-- See all pending rides
SELECT 
  r.id,
  r.pickup_location,
  r.destination,
  r.fare,
  r.vehicle_type,
  r.status,
  u.full_name as passenger_name
FROM rides r
JOIN users u ON r.passenger_id = u.id
WHERE r.status = 'pending';

-- If you see rides but not getting notifications:
-- Make sure socket is connected (check browser console)
-- Make sure rider location is within 1km of pickup
```

### 8. Quick Test Without Coordinates

If you don't want to deal with coordinates yet:

```sql
-- Temporarily disable proximity check by updating ALL online riders
UPDATE riders SET current_location = '23.0225, 72.5714' WHERE is_online = true;
```

Then book any ride - all online riders will be notified.

---

## Summary

✅ **Backend**: Proximity matching implemented  
✅ **Socket.IO**: Real-time notifications working  
✅ **Frontend**: Dashboard shows live notifications  
✅ **Accept/Reject**: Fully functional  

**Next**: Open rider dashboard, keep it open, then book a ride as passenger. You should see the green notification popup immediately!
