# Proximity-Based Ride Request System

## Overview
The system now sends ride requests only to riders within 1km of the passenger's pickup location.

## How It Works

### 1. When a Passenger Books a Ride

**Backend** (`/backend/controllers/rides.controller.js`):
- Passenger submits ride request with pickup location coordinates
- System finds all online riders with matching vehicle type
- Calculates distance between passenger and each rider using Haversine formula
- Only riders within 1km receive the notification
- Real-time notification sent via Socket.IO to specific riders

### 2. Location Format

Pickup location can be sent in two ways:

**Option 1: Separate coordinates field**
```javascript
{
  "pickup": "123 Main St, City",
  "destination": "456 Oak Ave, City",
  "distance": 5.5,
  "fare": 150,
  "rideType": "personal",
  "vehicleType": "car",
  "pickupCoordinates": {
    "lat": 23.0225,
    "lng": 72.5714
  }
}
```

**Option 2: Embedded in location string**
```javascript
{
  "pickup": "123 Main St (23.0225, 72.5714)",
  "destination": "456 Oak Ave (23.0350, 72.5800)",
  "distance": 5.5,
  "fare": 150,
  "rideType": "personal",
  "vehicleType": "car"
}
```

### 3. Rider Location Storage

Riders must update their location in the database:

```sql
UPDATE riders 
SET current_location = '23.0225, 72.5714'
WHERE id = <rider_id>;
```

Or use the location format:
```sql
UPDATE riders 
SET current_location = 'Near Airport (23.0225, 72.5714)'
WHERE id = <rider_id>;
```

### 4. Socket.IO Integration

**Rider Dashboard** should listen for ride requests:

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000');

// When rider goes online
socket.emit('rider-online', riderId);

// Listen for new ride requests
socket.on('new-ride-request', (rideData) => {
  console.log('New ride request:', rideData);
  // Show notification to rider
  // Display ride details
  // Allow accept/reject
});

// When rider goes offline
socket.emit('rider-offline', riderId);
```

### 5. Example API Calls

**Book a Ride (Passenger)**
```bash
POST http://localhost:3000/api/rides/book
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "pickup": "Airport Terminal (23.0225, 72.5714)",
  "destination": "Railway Station (23.0350, 72.5800)",
  "distance": 5.5,
  "fare": 150,
  "rideType": "personal",
  "vehicleType": "car",
  "pickupCoordinates": {
    "lat": 23.0225,
    "lng": 72.5714
  }
}
```

**Response**
```json
{
  "success": true,
  "rideId": 42,
  "nearbyRiders": 3,
  "ridersNotified": [
    { "id": 1, "name": "John Doe", "distance": "0.45" },
    { "id": 2, "name": "Jane Smith", "distance": "0.78" },
    { "id": 3, "name": "Bob Wilson", "distance": "0.92" }
  ],
  "message": "Ride requested! 3 nearby rider(s) notified."
}
```

### 6. Distance Calculation

The system uses the Haversine formula to calculate the great-circle distance between two points on Earth:

```javascript
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
};
```

### 7. Testing the System

#### Step 1: Add Rider Locations
```sql
-- Update rider locations (example coordinates for Ahmedabad)
UPDATE riders 
SET current_location = '23.0225, 72.5714', is_online = true
WHERE id = 1;

UPDATE riders 
SET current_location = '23.0235, 72.5724', is_online = true
WHERE id = 2;

UPDATE riders 
SET current_location = '23.0245, 72.5734', is_online = true
WHERE id = 3;

-- This rider is too far (>1km away), won't receive request
UPDATE riders 
SET current_location = '23.0350, 72.5800', is_online = true
WHERE id = 4;
```

#### Step 2: Book a Ride
Use the passenger account to book a ride with pickup location near the riders.

#### Step 3: Check Notifications
- Only riders 1, 2, and 3 (within 1km) will receive the notification
- Rider 4 (>1km away) will NOT receive the notification

### 8. Frontend Integration Example

Update `RideSearch.jsx` to send coordinates when booking:

```javascript
const handleBookRide = async () => {
  try {
    const bookingData = {
      pickup: pickup,
      destination: destination,
      distance: distance,
      fare: rideType === 'shared' ? sharedPrice : personalPrice,
      rideType: rideType,
      vehicleType: selectedVehicle,
      pickupCoordinates: {
        lat: pickupCoords[0],
        lng: pickupCoords[1]
      }
    };

    const result = await ridesAPI.bookRide(bookingData);
    
    alert(`Ride booked! ${result.nearbyRiders} nearby riders notified.`);
    console.log('Notified riders:', result.ridersNotified);
    
  } catch (error) {
    console.error('Booking failed:', error);
    alert('Failed to book ride: ' + error.message);
  }
};
```

## Benefits

1. **Efficiency**: Only nearby riders are notified, reducing noise
2. **Faster Response**: Closer riders can respond quicker
3. **Better UX**: Passengers get matched with genuinely available nearby drivers
4. **Scalability**: System doesn't broadcast to all riders globally

## Configuration

To change the proximity radius, modify the threshold in `/backend/controllers/rides.controller.js`:

```javascript
// Change from 1km to 2km
if (distanceToRider <= 2.0) {  // was 1.0
  nearbyRiders.push({...});
}
```
