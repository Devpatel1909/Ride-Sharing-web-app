# Shared Ride APIs - Testing Guide

## Prerequisites

- Backend server running on `http://localhost:3000`
- Frontend on `http://localhost:5173` (for context)
- Valid JWT token from authenticated user
- Valid JWT token from authenticated rider
- PostgreSQL database with migration applied

## Setup for Testing

### 1. Get Authentication Tokens

First, you need valid JWT tokens for both a passenger and a rider.

#### Register/Login as Passenger
```
POST http://localhost:3000/api/auth/signup
Content-Type: application/json

{
  "full_name": "Test Passenger 1",
  "email": "passenger1@test.com",
  "phone": "+91-9876543210",
  "password": "password123"
}
```

Response will include a token. Save this as `PASSENGER_TOKEN_1`

#### Register/Login as Another Passenger
```
POST http://localhost:3000/api/auth/signup
Content-Type: application/json

{
  "full_name": "Test Passenger 2",
  "email": "passenger2@test.com",
  "phone": "+91-9876543211",
  "password": "password123"
}
```

Save as `PASSENGER_TOKEN_2`

#### Register/Login as Rider
```
POST http://localhost:3000/api/rider/signup
Content-Type: application/json

{
  "first_name": "Test",
  "last_name": "Rider",
  "email": "rider@test.com",
  "phone": "+91-9999999999",
  "password": "password123",
  "license_number": "DL12345",
  "vehicle_plate": "DL01AB1234",
  "vehicle_color": "Black",
  "vehicle_type": "car",
  "vehicle_model": "Toyota Fortuner",
  "vehicle_capacity": 4
}
```

Save as `RIDER_TOKEN`

---

## Test Scenarios

### Scenario 1: Create a Personal Ride (Original Passenger Books)

**Step 1.1: Book a Personal Ride as PASSENGER_TOKEN_1**

```
POST http://localhost:3000/api/rides/book
Authorization: Bearer PASSENGER_TOKEN_1
Content-Type: application/json

{
  "pickup": "Connaught Place, Delhi (28.6139, 77.2090)",
  "destination": "Gurugram Station (28.5355, 77.3910)",
  "distance": 25.5,
  "fare": 450.00,
  "rideType": "shared",
  "vehicleType": "car",
  "paymentMethod": "cash",
  "pickupCoordinates": {
    "lat": 28.6139,
    "lng": 77.2090
  },
  "destinationCoordinates": {
    "lat": 28.5355,
    "lng": 77.3910
  }
}
```

**Expected Response:**
```json
{
  "success": true,
  "rideId": 1,
  "nearbyRiders": 0,
  "message": "Ride created and riders notified. Waiting for acceptance."
}
```

Save `RIDE_ID_1 = 1` for next tests.

---

### Scenario 2: Find Available Shared Rides

**Step 2.1: Check Available Shared Rides as PASSENGER_TOKEN_2**

PASSENGER_2 wants to join a shared ride from a nearby location.

```
POST http://localhost:3000/api/rides/shared-available
Authorization: Bearer PASSENGER_TOKEN_2
Content-Type: application/json

{
  "pickupLat": 28.6100,
  "pickupLng": 77.2050,
  "dropoffLat": 28.5350,
  "dropoffLng": 77.3900,
  "vehicleType": "car",
  "maxDistance": 2
}
```

**Expected Response:**
```json
{
  "success": true,
  "count": 1,
  "rides": [
    {
      "rideId": 1,
      "originalPassengerId": 1,
      "originalPassengerName": "Test Passenger 1",
      "profilePicture": null,
      "pickupLocation": "Connaught Place, Delhi (28.6139, 77.2090)",
      "destination": "Gurugram Station (28.5355, 77.3910)",
      "distance": 25.5,
      "fare": 450.00,
      "vehicleType": "car",
      "status": "pending",
      "riderId": null,
      "currentPassengers": 1,
      "maxPassengers": 4,
      "joinedPassengers": 0,
      "availableSeats": 3,
      "pickupDistanceKm": 0.43,
      "isNearby": true
    }
  ]
}
```

✅ **Check:** 
- [ ] Ride found
- [ ] Available seats = 3
- [ ] Pickup distance is reasonable (~0.43 km)
- [ ] Original passenger name shown

---

### Scenario 3: Join the Shared Ride

**Step 3.1: PASSENGER_2 Joins RIDE_ID_1**

```
POST http://localhost:3000/api/rides/join-shared/1
Authorization: Bearer PASSENGER_TOKEN_2
Content-Type: application/json

{
  "pickupLocation": "Nehru Place, Delhi (28.5520, 77.2260)",
  "dropoffLocation": "Sector 15, Gurugram (28.5405, 77.3900)",
  "pickupLat": 28.5520,
  "pickupLng": 77.2260,
  "dropoffLat": 28.5405,
  "dropoffLng": 77.3900
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Successfully joined shared ride",
  "ridePassengerId": 1,
  "fare": 225.00,
  "totalPassengers": 2,
  "ride": {
    "id": 1,
    "current_passengers": 2,
    "status": "pending",
    "updated_at": "2026-04-30T10:30:00Z"
  }
}
```

✅ **Check:**
- [ ] Join successful
- [ ] Fare split: 450 / 2 = 225.00 ✓
- [ ] Total passengers = 2
- [ ] Ride current_passengers updated to 2

---

### Scenario 4: Verify Passengers in Ride

**Step 4.1: Get All Passengers in RIDE_ID_1**

```
GET http://localhost:3000/api/rides/1/passengers
Content-Type: application/json
```

**Expected Response:**
```json
{
  "success": true,
  "passengerCount": 2,
  "passengers": [
    {
      "id": 1,
      "passenger_id": 1,
      "full_name": "Test Passenger 1",
      "phone": "+91-9876543210",
      "email": "passenger1@test.com",
      "profile_picture": null,
      "pickup_location": "Connaught Place, Delhi (28.6139, 77.2090)",
      "dropoff_location": "Gurugram Station (28.5355, 77.3910)",
      "passenger_status": "accepted",
      "fare_amount": 225.00
    },
    {
      "id": 2,
      "passenger_id": 2,
      "full_name": "Test Passenger 2",
      "phone": "+91-9876543211",
      "email": "passenger2@test.com",
      "profile_picture": null,
      "pickup_location": "Nehru Place, Delhi (28.5520, 77.2260)",
      "dropoff_location": "Sector 15, Gurugram (28.5405, 77.3900)",
      "passenger_status": "pending",
      "fare_amount": 225.00
    }
  ]
}
```

✅ **Check:**
- [ ] Both passengers listed
- [ ] Passenger 1 status = "accepted" (original)
- [ ] Passenger 2 status = "pending" (newly joined)
- [ ] Both have fare = 225.00 (equal split) ✓
- [ ] Correct pickup/dropoff for each

---

### Scenario 5: Test with Third Passenger Join

**Step 5.1: PASSENGER_3 Joins (Create another passenger first)**

```
POST http://localhost:3000/api/auth/signup
Content-Type: application/json

{
  "full_name": "Test Passenger 3",
  "email": "passenger3@test.com",
  "phone": "+91-9876543212",
  "password": "password123"
}
```

**Step 5.2: PASSENGER_3 Joins RIDE_ID_1**

```
POST http://localhost:3000/api/rides/join-shared/1
Authorization: Bearer PASSENGER_TOKEN_3
Content-Type: application/json

{
  "pickupLocation": "Green Park, Delhi (28.5620, 77.1870)",
  "dropoffLocation": "DLF Cyber Hub, Gurugram (28.5460, 77.3880)",
  "pickupLat": 28.5620,
  "pickupLng": 77.1870,
  "dropoffLat": 28.5460,
  "dropoffLng": 77.3880
}
```

**Expected Response:**
```json
{
  "success": true,
  "fare": 150.00,
  "totalPassengers": 3
}
```

✅ **Check:**
- [ ] New fare per passenger: 450 / 3 = 150.00 ✓
- [ ] All existing passengers' fares are recalculated
- [ ] Total passengers = 3

**Step 5.3: Verify All Passengers Have Updated Fare**

```
GET http://localhost:3000/api/rides/1/passengers
```

**Expected Response:**
All 3 passengers should have `fare_amount: 150.00`

---

### Scenario 6: Update Passenger Status (Rider View)

**Step 6.1: Rider Accepts Ride (status changes)**

First, rider must accept the ride (through existing endpoint). Then:

**Step 6.2: Rider Picks Up First Passenger**

```
PUT http://localhost:3000/api/rides/1/passengers/1/status
Authorization: Bearer RIDER_TOKEN
Content-Type: application/json

{
  "status": "picked_up"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Passenger status updated to picked_up",
  "passenger": {
    "id": 1,
    "ride_id": 1,
    "passenger_id": 1,
    "passenger_status": "picked_up",
    "updated_at": "2026-04-30T10:40:00Z"
  }
}
```

✅ **Check:**
- [ ] Status updated to "picked_up"
- [ ] Timestamp updated

**Step 6.3: Rider Drops Off First Passenger**

```
PUT http://localhost:3000/api/rides/1/passengers/1/status
Authorization: Bearer RIDER_TOKEN
Content-Type: application/json

{
  "status": "dropped_off"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Passenger status updated to dropped_off"
}
```

---

## Error Scenario Tests

### Error Test 1: Join Ride Without Available Seats

**Setup:** Create a ride with `max_passengers: 2` and fill all seats

**Test:**
```
POST http://localhost:3000/api/rides/join-shared/2
Authorization: Bearer PASSENGER_TOKEN_NEW
Content-Type: application/json
{
  "pickupLocation": "Test (28.5, 77.2)",
  "dropoffLocation": "Test (28.5, 77.4)",
  "pickupLat": 28.5,
  "pickupLng": 77.2,
  "dropoffLat": 28.5,
  "dropoffLng": 77.4
}
```

**Expected Error:**
```json
{
  "error": "No seats available in this ride"
}
```

✅ Status Code: 400

---

### Error Test 2: Join Same Ride Twice

**Setup:** PASSENGER_2 already joined RIDE_1

**Test:**
```
POST http://localhost:3000/api/rides/join-shared/1
Authorization: Bearer PASSENGER_TOKEN_2
Content-Type: application/json
{...}
```

**Expected Error:**
```json
{
  "error": "You have already joined this ride"
}
```

✅ Status Code: 400

---

### Error Test 3: Join Non-Existent Ride

**Test:**
```
POST http://localhost:3000/api/rides/join-shared/99999
Authorization: Bearer PASSENGER_TOKEN_NEW
Content-Type: application/json
{...}
```

**Expected Error:**
```json
{
  "error": "Shared ride not found or not available"
}
```

✅ Status Code: 404

---

### Error Test 4: Join Without Authentication

**Test:**
```
POST http://localhost:3000/api/rides/join-shared/1
Content-Type: application/json
{...}
```

**Expected Error:**
```json
{
  "error": "Unauthorized - please login"
}
```

✅ Status Code: 401

---

### Error Test 5: Update Passenger Status with Invalid Status

**Test:**
```
PUT http://localhost:3000/api/rides/1/passengers/1/status
Authorization: Bearer RIDER_TOKEN
Content-Type: application/json

{
  "status": "invalid_status"
}
```

**Expected Error:**
```json
{
  "error": "Invalid status"
}
```

✅ Status Code: 400

---

## Database Verification Tests

### Test DB1: Check ride_passengers Table

```sql
SELECT * FROM ride_passengers WHERE ride_id = 1;
```

Expected columns:
- id, ride_id, passenger_id, pickup_location, dropoff_location
- pickup_lat, pickup_lng, dropoff_lat, dropoff_lng
- passenger_status, fare_amount, created_at, updated_at

---

### Test DB2: Check Fare Splitting

```sql
SELECT 
  ride_id,
  passenger_id,
  fare_amount,
  COUNT(*) as passenger_count
FROM ride_passengers
WHERE ride_id = 1
GROUP BY ride_id;
```

All passengers for ride 1 should have the same `fare_amount` (equal split).

---

### Test DB3: Check Rides Table Updates

```sql
SELECT id, current_passengers, max_passengers, ride_type FROM rides WHERE id = 1;
```

Expected:
- `current_passengers: 3` (if 3 passengers joined)
- `max_passengers: 4` (default)
- `ride_type: 'shared'`

---

## Performance Tests

### Test Perf1: Find Shared Rides with Multiple Results

Create 5 shared rides at different times, then search:

```
POST http://localhost:3000/api/rides/shared-available
Authorization: Bearer PASSENGER_TOKEN
Content-Type: application/json

{
  "pickupLat": 28.6,
  "pickupLng": 77.2,
  "dropoffLat": 28.5,
  "dropoffLng": 77.4
}
```

✅ Check:
- Response time < 500ms
- Rides sorted by recency
- All available rides returned

---

## Testing Checklist

### API Functionality
- [ ] Create shared ride (bookRide)
- [ ] Find available shared rides (getSharedAvailableRides)
- [ ] Join shared ride (joinSharedRide)
- [ ] Get all passengers (getRidePassengers)
- [ ] Update passenger status (updatePassengerStatus)

### Fare Splitting
- [ ] Correct fare for 2 passengers (450 / 2 = 225)
- [ ] Correct fare for 3 passengers (450 / 3 = 150)
- [ ] Fare recalculated when new passenger joins
- [ ] All passengers get equal share

### Data Integrity
- [ ] Passenger added to ride_passengers table
- [ ] ride.current_passengers incremented
- [ ] Correct status transitions
- [ ] Timestamps updated correctly
- [ ] Unique constraint prevents duplicate joins

### Error Handling
- [ ] No seats available error
- [ ] Already joined error
- [ ] Ride not found error
- [ ] Unauthorized error
- [ ] Invalid status error

### Database
- [ ] ride_passengers table populated correctly
- [ ] Indexes working (query performance)
- [ ] Triggers updating timestamps
- [ ] Max passengers constraint enforced

### Edge Cases
- [ ] Join with same pickup location as original
- [ ] Join with different destination
- [ ] Multiple passengers joining in sequence
- [ ] Passenger status transitions
- [ ] Find rides with no results

---

## Tools for Testing

### Option 1: cURL Commands
Use the curl examples above in terminal

### Option 2: Postman
Import the endpoints into Postman and test manually

### Option 3: API Client
Use REST Client extension in VS Code

### Option 4: Automated Testing Script
Create a test script to run all scenarios sequentially

---

## Expected Outcomes

After completing all tests, you should verify:

1. ✅ Multiple passengers can be linked to a single ride
2. ✅ Fare is split equally among passengers
3. ✅ Rider can track individual passenger status
4. ✅ Passengers can join/leave shared rides
5. ✅ Database transactions are consistent
6. ✅ Error handling works for all edge cases
7. ✅ Performance is acceptable for typical scenarios

---

## If Tests Fail

1. **Check database migration ran successfully:**
   ```sql
   SELECT * FROM information_schema.tables WHERE table_name = 'ride_passengers';
   ```

2. **Check ride_passengers table structure:**
   ```sql
   \d ride_passengers;
   ```

3. **Check for SQL errors in server logs**

4. **Verify JWT tokens are valid and not expired**

5. **Check request body format matches API spec**

---

## Next Steps After Testing

Once all tests pass:
1. Proceed to Phase 2: Socket.IO integration
2. Implement real-time passenger notifications
3. Add live passenger list updates
4. Test multi-passenger ride flow with real-time events
