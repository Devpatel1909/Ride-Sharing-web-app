# Check Rider Status - Troubleshooting Guide

## Issue Fixed ✅
The frontend now correctly uses the backend's `availableVehicles` array instead of checking individual rider counts.

## Additional Checks to Ensure Riders Show Up

### 1. Verify Rider is Marked as Online in Database

**PostgreSQL:**
```sql
-- Check rider's online status
SELECT id, first_name, last_name, email, is_online, current_location, vehicle_type, vehicle_model
FROM riders
WHERE email = 'your-rider-email@example.com';

-- If not online, set them online:
UPDATE riders 
SET is_online = true 
WHERE id = YOUR_RIDER_ID;
```

**MySQL:**
```sql
-- Check rider's online status
SELECT id, first_name, last_name, email, is_online, current_location, vehicle_type, vehicle_model
FROM riders
WHERE email = 'your-rider-email@example.com';

-- If not online, set them online:
UPDATE riders 
SET is_online = true 
WHERE id = YOUR_RIDER_ID;
```

### 2. Ensure Vehicle Type is Set

The rider must have a `vehicle_type` set to one of: `bike`, `auto`, `car`, or `suv`

```sql
-- Update rider's vehicle type
UPDATE riders 
SET vehicle_type = 'car'  -- or 'bike', 'auto', 'suv'
WHERE id = YOUR_RIDER_ID;
```

### 3. Set Rider Location (Optional but Recommended)

For proximity-based matching (riders within 2km), set a location:

```sql
-- Format: "Location Name (latitude, longitude)"
UPDATE riders 
SET current_location = 'Downtown (23.0225, 72.5714)'
WHERE id = YOUR_RIDER_ID;

-- Or just coordinates:
UPDATE riders 
SET current_location = '23.0225, 72.5714'
WHERE id = YOUR_RIDER_ID;
```

### 4. Make Sure Rider Dashboard Sets Online Status

When a rider goes online from the dashboard, it should:
- Set `is_online = true`
- Optionally set their `current_location`

Check [frontend/src/pages/Rider/RiderDashboard.jsx](frontend/src/pages/Rider/RiderDashboard.jsx) to ensure the toggle is working.

### 5. Test the Complete Flow

1. **Login as Rider:**
   - Go to `/rider-login`
   - Login with rider credentials
   - Toggle status to "Online" in dashboard
   - Check browser console for Socket.IO connection

2. **Open New Window as Passenger:**
   - Go to `/login`
   - Login as passenger
   - Go to `/ride-search`
   - Enter pickup and destination
   - Click "Search Rides"

3. **Expected Result:**
   - Vehicles should now show up with rider availability
   - You should see "X rider(s) nearby" or "Riders online"
   - You can select a vehicle and book

### 6. Debugging Tips

**Check Backend Logs:**
```
📍 Availability check: X riders within 2km of pickup (hasCoords=true)
```

**Check Frontend Console:**
- Look for the availability API response
- Should show `availableVehicles: ['bike', 'auto', 'car', 'suv']` if riders are online
- Should show total nearby riders count

**Common Issues:**
- ❌ Rider has `is_online = false` → Turn online from dashboard
- ❌ Rider has no `vehicle_type` → All vehicles will show as available
- ❌ Rider has `vehicle_type` but it's misspelled → Won't match (must be: bike, auto, car, suv)
- ❌ Socket.IO not connected → Real-time updates won't work

## Quick SQL Script to Set Up Test Rider

```sql
-- Complete rider setup
UPDATE riders 
SET 
  is_online = true,
  vehicle_type = 'car',
  vehicle_model = 'Honda City',
  vehicle_color = 'White',
  vehicle_capacity = 4,
  current_location = 'Anand (22.5645, 72.9289)'
WHERE id = 4;  -- Replace with your rider ID

-- Verify
SELECT id, first_name, email, is_online, vehicle_type, current_location 
FROM riders 
WHERE id = 4;
```

## What Changed in the Fix

**Before:**
```jsx
const isAvailable = hasNearbyData ? vData.count > 0 : true;
```
This checked if specific vehicle type had riders with matching `vehicle_type`, which could be 0.

**After:**
```jsx
const isAvailable = searchResults.availableVehicles.includes(vehicle.id);
```
This uses the backend's decision about which vehicles are available based on online riders.

## Backend Logic (No Changes Needed)

The backend correctly handles:
1. ✅ No riders online → No vehicles available
2. ✅ Riders online without `vehicle_type` → All vehicles available
3. ✅ Riders online with `vehicle_type` → Only matching vehicles available
4. ✅ Location filtering within 2km radius when coordinates provided
