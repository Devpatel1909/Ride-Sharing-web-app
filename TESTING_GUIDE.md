# 🚗 Ride Booking Test Guide

## Current Setup Status ✅

- ✅ Backend server running on port 3000
- ✅ Geocoding API implemented (no more CORS errors)
- ✅ Socket.IO real-time notifications working
- ✅ Passenger booking page updated with full functionality
- ✅ Rider Dashboard with real-time notifications
- ✅ Test rider (ID: 4) set to ONLINE with location in Anand, Gujarat

## 🧪 How to Test the Complete Flow

### Step 1: Login as Rider
1. Open browser at `http://localhost:5173`
2. Navigate to Rider Login
3. Login with rider credentials (the rider with ID 4 should already be online)
4. You should see the Rider Dashboard

### Step 2: Keep Rider Dashboard Open
- The rider dashboard should show Socket.IO connection: "✅ Socket connected"
- Check browser console (F12) to verify connection
- Keep this window/tab open to receive real-time notifications

### Step 3: Open New Browser Window for Passenger
1. Open a NEW BROWSER WINDOW (or incognito mode)
2. Go to `http://localhost:5173`
3. Navigate to Passenger/User Login
4. Login as a passenger

### Step 4: Search for Rides (As Passenger)
1. Fill in the ride search form:
   - **Pickup**: `Anand New bus stand` (or any location in Anand, Gujarat)
   - **Destination**: `Anand Railway Station` (or another nearby location)
   - **Ride Type**: Select "Personal" or "Sharing"
   - Click **Search Rides**

2. Wait for results (should take 2-3 seconds for geocoding)

### Step 5: Select Vehicle and Book
1. You'll see available vehicles with pricing
2. Select a vehicle type (car, bike, auto, or SUV)
3. Click **"Book Ride"** button

### Step 6: Check Rider Dashboard
Switch back to the Rider Dashboard window:
- You should see a **GREEN NOTIFICATION POPUP** appear
- Popup shows: Passenger name, pickup, destination, fare
- Buttons: **Accept** or **Reject**

### Step 7: Test Accept/Reject
- Click **Accept** to accept the ride
- OR click **Reject** to reject it
- The popup should disappear and dashboard should update

## 🔍 Troubleshooting

### "No riders notified" message
**Cause**: No riders are within 1km of the pickup location

**Solutions**:
1. Update rider location to match test area:
   ```bash
   cd backend
   node db/update_rider_location.js
   ```

2. OR book a ride with pickup near: `Anand, Gujarat` (where test rider is located)

### Rider not receiving notifications
**Check these:**
1. Backend console shows: `"🚗 Rider X is now online"`
2. Rider Dashboard console shows: `"✅ Socket connected"`
3. Booking response shows: `"X rider(s) have been notified"`

**Fix**:
- Refresh Rider Dashboard page
- Check if rider's `is_online` status is `true`:
  ```sql
  SELECT id, first_name, is_online, current_location FROM riders;
  ```

### "Unauthorized" error when booking
**Cause**: Passenger is not logged in

**Fix**:
- Make sure you're logged in as a passenger (user)
- Check localStorage has a `token` key (not `riderToken`)

## 📊 Expected Console Logs

### Backend (when booking):
```
🌍 Geocoding address: Anand New bus stand
🗺️ Getting route from [22.5645, 72.9289] to [22.5530, 72.9510]
📢 Ride request 123 sent to 1 nearby riders
```

### Rider Dashboard (when receiving):
```
✅ Socket connected: abc123xyz
🚗 New ride request on Dashboard: { id: 123, passenger: "John Doe", ... }
```

### Passenger (when booking):
```
📞 Booking ride: { pickup: "...", distance: 2.5, fare: 62.50, ... }
✅ Ride booked successfully! 1 rider(s) have been notified.
```

## 🎯 Quick Test Commands

### Check rider status:
```bash
cd backend/db
psql <your-connection-string> -c "SELECT id, first_name, is_online, current_location FROM riders WHERE is_online = true;"
```

### Update rider location:
```bash
cd backend
node db/update_rider_location.js
```

### Check recent rides:
```bash
cd backend/db
psql <your-connection-string> -c "SELECT * FROM rides ORDER BY requested_at DESC LIMIT 5;"
```

## ✨ Features Implemented

- ✅ Real-time ride notifications via Socket.IO
- ✅ 1km proximity matching (Haversine formula)
- ✅ Geocoding via backend proxy (no CORS)
- ✅ Distance calculation and route display
- ✅ Vehicle selection with dynamic pricing
- ✅ Accept/Reject ride requests
- ✅ Automatic dashboard refresh after actions

## 🚀 Next Steps (Optional Enhancements)

1. Add passenger-side notifications (ride accepted/rejected)
2. Implement ride tracking (in-progress status)
3. Add ride history page
4. Implement payment integration
5. Add rider location tracking (GPS)
6. Add ride cancellation
7. Add rating system

---

**Need help?** Check the browser console (F12) and backend terminal for detailed logs!
