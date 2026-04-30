# Shared Ride Module - Implementation Complete

## Overview
The shared ride functionality has been successfully implemented. This allows multiple passengers from different accounts to ride together on a single ride, with automatic fare splitting.

## What Was Implemented

### 1. Database Schema Updates ✅

#### New Table: `ride_passengers`
Tracks individual passengers on shared rides with their own pickup/dropoff locations and fare amounts.

**Columns:**
- `id` - Primary key
- `ride_id` - Foreign key to rides table
- `passenger_id` - Foreign key to users table
- `pickup_location` - Passenger's pickup address
- `dropoff_location` - Passenger's dropoff address
- `pickup_lat`, `pickup_lng`, `dropoff_lat`, `dropoff_lng` - Coordinates
- `passenger_status` - Status: pending, accepted, picked_up, dropped_off, cancelled
- `fare_amount` - Individual passenger's fare (after splitting)
- `created_at`, `updated_at` - Timestamps
- Unique constraint on (ride_id, passenger_id)

#### Updates to `rides` Table
- Added `max_passengers` column (default: 4) - Max seats in vehicle
- Added `current_passengers` column (default: 1) - Track total passengers
- Added `ride_type` enum support (shared, personal)

#### New Triggers & Functions
- Auto-update timestamps on ride_passengers
- Validate max passengers constraint
- Automatic stats updates when rides complete

---

## API Endpoints

### 1. Get Available Shared Rides
**Endpoint:** `POST /api/rides/shared-available`

**Authentication:** Required (JWT token)

**Request Body:**
```json
{
  "pickupLat": 28.6139,
  "pickupLng": 77.2090,
  "dropoffLat": 28.5355,
  "dropoffLng": 77.3910,
  "vehicleType": "car",  // optional
  "maxDistance": 2       // max distance from pickup in km (default: 2)
}
```

**Response:**
```json
{
  "success": true,
  "count": 3,
  "rides": [
    {
      "rideId": 101,
      "originalPassengerId": 5,
      "originalPassengerName": "John Doe",
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
      "pickupDistanceKm": 0.5,
      "isNearby": true
    }
  ]
}
```

---

### 2. Join a Shared Ride
**Endpoint:** `POST /api/rides/join-shared/:rideId`

**Authentication:** Required (JWT token)

**Request Body:**
```json
{
  "pickupLocation": "Nehru Place, Delhi (28.5520, 77.2260)",
  "dropoffLocation": "Sector 15, Gurugram (28.5405, 77.3900)",
  "pickupLat": 28.5520,
  "pickupLng": 77.2260,
  "dropoffLat": 28.5405,
  "dropoffLng": 77.3900
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully joined shared ride",
  "ridePassengerId": 15,
  "fare": 150.00,
  "totalPassengers": 3,
  "ride": {
    "id": 101,
    "current_passengers": 2,
    "status": "pending",
    "updated_at": "2026-04-30T10:30:00Z"
  }
}
```

**Error Cases:**
- 401: User not authenticated
- 404: Shared ride not found or not available
- 400: Already joined this ride
- 400: No seats available

---

### 3. Get All Passengers in a Ride
**Endpoint:** `GET /api/rides/:rideId/passengers`

**Response:**
```json
{
  "success": true,
  "passengerCount": 2,
  "passengers": [
    {
      "id": 5,
      "passenger_id": 5,
      "full_name": "John Doe",
      "phone": "+91-9876543210",
      "email": "john@example.com",
      "profile_picture": null,
      "pickup_location": "Connaught Place, Delhi",
      "dropoff_location": "Gurugram Station",
      "passenger_status": "accepted",
      "fare_amount": 150.00
    }
  ]
}
```

---

### 4. Update Passenger Status
**Endpoint:** `PUT /api/rides/:rideId/passengers/:passengerId/status`

**Authentication:** Required (Rider JWT token)

**Request Body:**
```json
{
  "status": "picked_up"
}
```

**Valid Statuses:** pending, accepted, picked_up, dropped_off, cancelled

**Response:**
```json
{
  "success": true,
  "message": "Passenger status updated to picked_up",
  "passenger": {
    "id": 15,
    "ride_id": 101,
    "passenger_id": 10,
    "passenger_status": "picked_up",
    "updated_at": "2026-04-30T10:35:00Z"
  }
}
```

---

## Backend Implementation Details

### Controller Functions Added

#### 1. `getSharedAvailableRides(req, res)`
- Finds shared rides pending or accepted
- Filters by vehicle type (optional)
- Calculates distance from passenger's pickup location
- Returns rides sorted by recency
- Automatically excludes rides passenger already joined

#### 2. `joinSharedRide(req, res)`
- Transaction-based join process
- Validates ride exists and is shared
- Checks available seats
- Automatically splits fare equally among passengers
- Adds passenger to ride_passengers table
- Updates ride's current_passengers count

#### 3. `getRidePassengers(req, res)`
- Fetches all active passengers in a ride
- Includes full passenger details and fare info
- Excludes cancelled passengers

#### 4. `updatePassengerStatus(req, res)`
- Updates individual passenger status
- Used by riders to track pickup/dropoff progress
- Validates status values

### Helper Functions

#### `splitFareEqually(totalFare, numberOfPassengers)`
- Divides total fare equally among all passengers
- Returns fare amount with 2 decimal precision
- Called when passengers join/leave a ride

---

## Updated Booking Flow

### Original Flow (Personal Rides)
1. Passenger books ride → Creates ride record
2. Riders notified → Rider accepts
3. Ride progresses → Completed

### New Flow (Shared Rides)
1. Passenger books shared ride → Creates ride record
2. Original passenger added to `ride_passengers` table
3. Other passengers can search for shared rides (`GET /shared-available`)
4. Passengers join the ride (`POST /join-shared/:rideId`)
5. Fare is automatically split equally
6. Riders see all passengers on the ride
7. Riders can track individual passenger status

---

## Database Migration

**Migration File:** `backend/migrations/add_shared_ride_tables.sql`

**To Run Migration:**
```bash
cd backend
node migrations/run-shared-ride-migration.js
```

The migration:
- Creates `passenger_status` enum type
- Creates `ride_passengers` junction table
- Adds columns to `rides` table
- Creates performance indexes
- Sets up database triggers for validation

---

## Key Features

### Automatic Fare Splitting
- When a passenger joins, total fare is split equally
- All existing passengers' fares are recalculated
- Each passenger pays their share based on current passenger count

### Multi-Status Tracking
Each passenger can have different status:
- **pending** - Waiting for acceptance
- **accepted** - Accepted the ride
- **picked_up** - Rider picked up
- **dropped_off** - Ride completed
- **cancelled** - Passenger cancelled

### Seat Management
- Tracks available seats per ride
- Prevents overbooking
- Max passengers set at ride creation

### Transaction Safety
- Join operations use database transactions
- Ensures data consistency
- Automatic rollback on errors

---

## Frontend Integration Ready

### Required Frontend APIs

**To find shared rides:**
```javascript
await api.post('/rides/shared-available', {
  pickupLat: 28.6139,
  pickupLng: 77.2090,
  dropoffLat: 28.5355,
  dropoffLng: 77.3910,
  maxDistance: 2
});
```

**To join a shared ride:**
```javascript
await api.post(`/rides/join-shared/${rideId}`, {
  pickupLocation: "Address (28.5520, 77.2260)",
  dropoffLocation: "Address (28.5405, 77.3900)",
  pickupLat: 28.5520,
  pickupLng: 77.2260,
  dropoffLat: 28.5405,
  dropoffLng: 77.3900
});
```

**To get passengers:**
```javascript
await api.get(`/rides/${rideId}/passengers`);
```

---

## Next Steps (Phase 2 & 3)

### Phase 2: Socket.IO Multi-Passenger Events
- [ ] New Socket.IO event for shared ride requests
- [ ] Event for passenger joining
- [ ] Event for passenger status updates
- [ ] Multi-passenger notifications

### Phase 3: Frontend UI Components
- [ ] SharedRideSearch component
- [ ] PassengerList component
- [ ] Shared ride booking option
- [ ] Live passenger tracking
- [ ] Pickup/dropoff sequence display

---

## Testing Checklist

- [ ] Run migration successfully
- [ ] Create a shared ride
- [ ] Find available shared rides
- [ ] Join a shared ride
- [ ] Verify fare splitting
- [ ] Get all passengers
- [ ] Update passenger status
- [ ] Test error scenarios (no seats, already joined, etc.)
- [ ] Test with multiple passengers joining
- [ ] Verify ride completion updates all passengers

---

## Database Indexes

Created for optimal performance:
- `idx_ride_passengers_ride` - Queries by ride_id
- `idx_ride_passengers_passenger` - Queries by passenger_id
- `idx_ride_passengers_status` - Queries by passenger status
- `idx_rides_status_type` - Find shared rides efficiently

---

## Files Modified/Created

### Created
- `backend/migrations/add_shared_ride_tables.sql` - Database schema
- `backend/migrations/run-shared-ride-migration.js` - Migration runner

### Modified
- `backend/controllers/rides.controller.js` - New endpoints & logic
- `backend/routes/rides.routes.js` - New route definitions

---

## Error Handling

All endpoints include proper error handling:
- Authentication validation
- Input validation
- Database transaction rollback
- Descriptive error messages

---

## Summary

✅ **Completed:** Database schema, API endpoints, fare splitting, passenger tracking
🔄 **Ready for:** Socket.IO integration, Frontend UI, Payment splitting
🎯 **Next:** Implement real-time notifications via Socket.IO
