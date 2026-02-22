-- Test Script for Proximity-Based Ride Request System
-- Run this script to set up test data for testing the 1km radius feature

-- Step 1: Set up test riders with locations (Ahmedabad coordinates example)
-- Rider 1: Near Airport (will be within 1km of test passenger)
UPDATE riders 
SET 
  current_location = '23.0225, 72.5714',
  is_online = true,
  vehicle_type = 'car'
WHERE id = 1;

-- Rider 2: Near Airport Terminal 2 (within 1km)
UPDATE riders 
SET 
  current_location = '23.0235, 72.5724',
  is_online = true,
  vehicle_type = 'car'
WHERE id = 2;

-- Rider 3: Near Airport Parking (within 1km)
UPDATE riders 
SET 
  current_location = '23.0245, 72.5734',
  is_online = true,
  vehicle_type = 'car'
WHERE id = 3;

-- Rider 4: Far away - Near Railway Station (more than 1km away)
UPDATE riders 
SET 
  current_location = '23.0350, 72.5850',
  is_online = true,
  vehicle_type = 'car'
WHERE id = 4;

-- Step 2: Verify rider locations
SELECT 
  id,
  CONCAT(first_name, ' ', last_name) as name,
  vehicle_type,
  is_online,
  current_location
FROM riders
WHERE is_online = true;

-- Step 3: Test booking a ride
-- Use this data in your API call (Postman or frontend):
/*
POST http://localhost:3000/api/rides/book
Authorization: Bearer <passenger_token>
Content-Type: application/json

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

Expected Result:
- Riders 1, 2, 3 should receive notification (within 1km)
- Rider 4 should NOT receive notification (>1km away)
*/

-- Step 4: After booking, check the ride in database
SELECT 
  r.id,
  r.pickup_location,
  r.destination,
  r.status,
  u.full_name as passenger_name,
  r.requested_at
FROM rides r
JOIN users u ON r.passenger_id = u.id
ORDER BY r.requested_at DESC
LIMIT 5;

-- Step 5: Check which riders accepted the ride
SELECT 
  r.id as ride_id,
  r.pickup_location,
  CONCAT(rider.first_name, ' ', rider.last_name) as rider_name,
  r.status,
  r.accepted_at
FROM rides r
LEFT JOIN riders rider ON r.rider_id = rider.id
WHERE r.status = 'accepted'
ORDER BY r.accepted_at DESC
LIMIT 5;

-- Clean up: Mark riders offline (optional)
-- UPDATE riders SET is_online = false WHERE id IN (1, 2, 3, 4);

-- Distance calculation reference:
-- 0.01 degrees latitude ≈ 1.11 km
-- 0.01 degrees longitude ≈ 0.96 km (at 23° N latitude)
-- So 0.001 degrees ≈ 111 meters

-- Test coordinates within 1km radius from (23.0225, 72.5714):
-- Within 500m: (23.0225, 72.5764) - 0.5km east
-- Within 800m: (23.0297, 72.5714) - 0.8km north  
-- Within 1km: (23.0315, 72.5714) - 1.0km north
-- Beyond 1km: (23.0350, 72.5714) - 1.4km north (should NOT notify)
