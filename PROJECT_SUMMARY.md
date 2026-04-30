# Ride-Sharing Web Application - Project Summary

## Project Overview
A full-stack ride-sharing platform similar to Uber/Ola, connecting passengers with nearby drivers for on-demand transportation services. The application features real-time communication, GPS-based driver matching, and a complete booking workflow from request to completion.

## Technology Stack

### Frontend
- **React 19.2.0** - Modern React with hooks and functional components
- **Vite** - Fast build tool and development server
- **React Router DOM 7.13.0** - Client-side routing and navigation
- **Google Maps API (@react-google-maps/api)** - Interactive mapping and location services
- **Socket.IO Client 4.8.3** - Real-time bidirectional communication
- **Tailwind CSS 4.1.18** - Utility-first CSS framework for styling
- **Lucide React** - Modern icon library

### Backend
- **Node.js & Express 5.2.1** - RESTful API server
- **PostgreSQL (pg 8.18.0)** - Relational database for user data and ride records
- **Socket.IO 4.8.3** - Real-time WebSocket server for live updates
- **JWT (jsonwebtoken 9.0.3)** - Secure authentication tokens
- **Passport & Passport Google OAuth** - Third-party authentication
- **Bcrypt** - Password hashing and security
- **Express Session** - Session management

## Key Features Implemented

### 1. User Authentication System
- **Passenger Authentication**: Email/password signup and login with JWT token-based authentication
- **Rider (Driver) Authentication**: Separate authentication flow for drivers with vehicle details
- **Google OAuth Integration**: Social login via Google for seamless user onboarding
- **Secure Password Storage**: Bcrypt hashing for password protection
- **Session Management**: Extended JWT tokens with configurable expiry (up to 7 days)

### 2. Real-Time Communication
- **Socket.IO Integration**: Bidirectional real-time communication between passengers and drivers
- **Live Ride Requests**: Instant notifications to nearby drivers when a passenger requests a ride
- **Driver Availability Status**: Toggle online/offline status for drivers
- **Ride Status Updates**: Real-time status changes (pending → accepted → in-progress → completed)
- **Live Location Tracking**: Real-time GPS coordinates sharing during active rides

### 3. GPS-Based Driver Matching Algorithm
- **Proximity Search**: Finds available drivers within configurable radius (1-5km) of pickup location
- **Haversine Formula**: Accurate great-circle distance calculations between coordinates
- **Distance-Based Sorting**: Ranks nearby drivers by proximity to pickup location
- **Vehicle Type Filtering**: Matches requests based on vehicle type (bike, auto, car, SUV)
- **Smart Location Parsing**: Extracts coordinates from multiple location string formats

### 4. Ride Booking Workflow
- **Multi-Step Booking Process**: 3-step wizard (Trip Details → Choose Vehicle → Confirmation)
- **Real-Time Availability Check**: Shows available drivers and vehicle types before booking
- **Fare Calculation**: Dynamic pricing based on distance and ride type (personal/shared)
- **Ride Type Options**: Personal rides and shared rides (for distances >5km with 2+ drivers)
- **Destination Pickup**: Route planning with Google Maps directions

### 5. Interactive Mapping Interface
- **Google Maps Integration**: Full-featured maps with custom styling and markers
- **Location Autocomplete**: Address suggestions for pickup and destination
- **Route Visualization**: Display of pickup, destination, and route path
- **Background Maps**: Immersive map backgrounds for ride search experience
- **Tracking Mode**: Live tracking of driver location during active rides

### 6. Rider (Driver) Dashboard
- **Profile Management**: Driver details, vehicle info, license, and rating
- **Online Status Toggle**: Go online/offline to receive ride requests
- **Incoming Ride Requests**: Real-time notifications with passenger details
- **Accept/Reject Rides**: Quick action buttons for ride requests
- **Earnings Tracking**: Display of completed rides and earnings
- **Activity History**: List of recent rides and activities

### 7. Ride Status Management
- **Multi-State Workflow**: pending → accepted → in-progress → completed/cancelled
- **Real-Time Updates**: Both passenger and driver receive instant status updates
- **Driver Assignment**: Automatic assignment when driver accepts ride
- **Completion Tracking**: Timestamps for each status change

### 8. Security Features
- **CORS Configuration**: Cross-origin resource sharing with whitelist
- **Content Security Policy**: Headers for OAuth integration security
- **Protected Routes**: Middleware to ensure authenticated access
- **Input Validation**: Server-side validation for all API endpoints
- **SQL Injection Protection**: Parameterized queries with PostgreSQL

## API Endpoints

### Authentication (`/api/auth`)
- `POST /signup` - User registration
- `POST /login` - User login
- `GET /profile` - Get user profile
- `GET /google` - Google OAuth login
- `GET /google/callback` - Google OAuth callback

### Rider (`/api/rider`)
- `POST /signup` - Driver registration
- `POST /login` - Driver login
- `GET /profile` - Get driver profile
- `PUT /status` - Toggle online status
- `PUT /location` - Update current location

### Rides (`/api/rides`)
- `POST /book` - Book a new ride
- `GET /availability` - Check driver availability
- `GET /:rideId` - Get ride details
- `PUT /:rideId/status` - Update ride status
- `POST /:rideId/accept` - Accept a ride
- `POST /:rideId/reject` - Reject a ride
- `GET /passenger/:passengerId` - Get passenger's rides
- `GET /rider/:riderId` - Get rider's rides

### Geocoding (`/api/geocoding`)
- `POST /geocode` - Convert address to coordinates
- `POST /reverse-geocode` - Convert coordinates to address

## Database Schema

### Users Table
- id, full_name, email, phone, password_hash, created_at

### Riders Table
- id, first_name, last_name, email, phone, password_hash, vehicle_type, vehicle_model, vehicle_color, vehicle_plate, license_number, current_location, rating, profile_photo, is_online, created_at

### Rides Table
- id, passenger_id, rider_id, pickup_location, destination, distance, fare, ride_type, vehicle_type, status, requested_at, accepted_at, completed_at

## Project Architecture

### Frontend Structure
```
src/
├── components/
│   ├── common/Header.jsx
│   └── ProtectedRoute.jsx
├── pages/
│   ├── Auth/
│   │   ├── Login.jsx
│   │   ├── Signup.jsx
│   │   └── GoogleAuthCallback.jsx
│   ├── Passanger/
│   │   └── RideSearch.jsx
│   ├── Rider/
│   │   ├── RiderDashboard.jsx
│   │   ├── RideRequests.jsx
│   │   └── Signup.jsx
│   ├── Map/
│   │   └── MapPage.jsx
│   ├── Landing.jsx
│   ├── Profile.jsx
│   └── TrackingMap.jsx
├── services/
│   └── api.js
└── App.jsx
```

### Backend Structure
```
backend/
├── config/
│   ├── passport.js (Google OAuth config)
│   └── socket.js (WebSocket setup)
├── controllers/
│   ├── auth.controller.js
│   ├── rides.controller.js
│   ├── rider.controller.js
│   └── dashboard.controller.js
├── middleware/
│   ├── auth.middleware.js
│   └── rider.middleware.js
├── models/
│   ├── user.model.js
│   └── rider.model.js
├── db/
│   └── Connect_to_sql.js
├── routes/
│   ├── auth.routes.js
│   ├── rides.routes.js
│   ├── rider.routes.js
│   └── geocoding.routes.js
├── app.js (Express app setup)
└── server.js (HTTP server entry point)
```

## Notable Technical Implementations

### 1. Haversine Distance Calculation
```javascript
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};
```

### 2. Real-Time Socket Events
- `rider-online` - Driver goes online
- `rider-offline` - Driver goes offline
- `new-ride-request` - Passenger books a ride
- `ride-accepted` - Driver accepts ride
- `join-ride` - Both parties join ride room
- `location-update` - Live GPS updates during ride
- `ride-status-change` - Status updates

### 3. Smart Location Parsing
Handles multiple coordinate formats:
- `"Location Name (23.0225, 72.5714)"` - Coordinates in parentheses
- `"23.0225, 72.5714"` - Direct lat,lng format
- `{ lat: 23.0225, lng: 72.5714 }` - Object format

## Challenges Solved

1. **Real-time Synchronization**: Implemented Socket.IO for instant communication between passengers and drivers
2. **Location-Based Matching**: Created efficient proximity search using Haversine formula
3. **State Management**: Managed complex ride state transitions with real-time updates
4. **OAuth Integration**: Integrated Google OAuth with proper security headers and CSP
5. **Cross-Origin Communication**: Configured CORS for seamless frontend-backend communication
6. **Session Persistence**: Used sessionStorage for maintaining auth state across page refreshes

## Development Approach

- **Git Version Control**: Full git history with meaningful commits
- **Environment Variables**: Secure configuration with dotenv
- **Error Handling**: Comprehensive try-catch blocks with proper error responses
- **Logging**: Console logging for debugging and monitoring
- **Hot Reloading**: Vite for fast development experience
- **Component-Based Architecture**: Modular React components for maintainability

## Deployment Considerations

- **Production-ready**: Configuration for NODE_ENV, secure cookies, and HTTPS
- **Scalability**: Socket.IO supports horizontal scaling with Redis adapter
- **Database**: PostgreSQL supports connections pooling and replication
- **Rate Limiting**: Ready for implementing API rate limiting
- **Monitoring**: Logging setup for production monitoring

## Future Enhancements (Potential)

- Payment gateway integration (Stripe/Razorpay)
- Rating and review system for both passengers and drivers
- Ride scheduling for future bookings
- Driver earnings dashboard with analytics
- Push notifications for mobile experience
- Multi-language support (i18n)
- Admin panel for platform management