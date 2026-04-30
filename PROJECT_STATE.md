# Ride-Sharing Web App - Project State Documentation

## Overview
A full-stack ride-sharing application with real-time ride booking, driver/passenger dashboards, live tracking, and payment integration.

**Tech Stack:**
- **Backend:** Node.js, Express, PostgreSQL, Socket.IO, Stripe, Passport.js (Google OAuth)
- **Frontend:** React 19, Vite, Tailwind CSS, React Router, Google Maps API, Socket.IO Client
- **Database:** PostgreSQL (Neon cloud database)
- **Real-time:** Socket.IO for live ride notifications and tracking

---

## Project Structure

```
Ride-Sharing-web-app/
├── backend/                    # Node.js/Express API server
│   ├── app.js                  # Express app configuration
│   ├── server.js               # HTTP server & Socket.IO initialization
│   ├── config/                 # Configuration files
│   │   ├── passport.js         # Passport.js Google OAuth setup
│   │   └── socket.js           # Socket.IO configuration & events
│   ├── controllers/            # Business logic
│   │   ├── auth.controller.js
│   │   ├── dashboard.controller.js
│   │   ├── geocoding.controller.js
│   │   ├── payments.controller.js
│   │   ├── rider.controller.js
│   │   └── rides.controller.js
│   ├── db/                     # Database connection & utilities
│   │   └── Connect_to_sql.js   # PostgreSQL connection pool
│   ├── middleware/             # Express middleware
│   │   ├── auth.middleware.js  # JWT authentication for users
│   │   └── rider.middleware.js # JWT authentication for riders
│   ├── models/                 # Database models
│   │   ├── user.model.js       # User CRUD operations
│   │   └── rider.model.js      # Rider CRUD operations
│   ├── routes/                 # API routes
│   │   ├── auth.routes.js      # Authentication endpoints
│   │   ├── geocoding.routes.js # Location/geocoding endpoints
│   │   ├── payments.routes.js  # Stripe payment endpoints
│   │   ├── rider.routes.js     # Rider-specific endpoints
│   │   └── rides.routes.js     # Ride booking endpoints
│   ├── services/               # Business services
│   │   └── ride-notification.service.js
│   ├── migrations/             # Database migration scripts
│   └── .env.example            # Environment variables template
│
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── components/         # Reusable components
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── common/
│   │   │       └── Header.jsx
│   │   ├── pages/              # Page components
│   │   │   ├── Auth/           # Authentication pages
│   │   │   │   ├── Login.jsx
│   │   │   │   ├── Signup.jsx
│   │   │   │   └── GoogleAuthCallback.jsx
│   │   │   ├── Landing.jsx     # Landing page
│   │   │   ├── Map/
│   │   │   │   └── MapPage.jsx
│   │   │   ├── Passanger/      # Passenger pages
│   │   │   │   ├── RideSearch.jsx
│   │   │   │   ├── PaymentSuccess.jsx
│   │   │   │   └── PaymentCancel.jsx
│   │   │   ├── Rider/          # Rider pages
│   │   │   │   ├── RiderDashboard.jsx
│   │   │   │   ├── RideRequests.jsx
│   │   │   │   └── Signup.jsx
│   │   │   ├── Profile.jsx
│   │   │   └── TrackingMap.jsx # Live ride tracking
│   │   ├── services/           # API service layer
│   │   │   └── api.js          # Centralized API calls
│   │   ├── App.jsx             # Main app with routing
│   │   └── main.jsx            # React entry point
│   ├── public/                 # Static assets
│   ├── .env.example            # Environment variables template
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.cjs
│
├── frontend_copy/              # Legacy frontend (not in use)
├── prev_backend/                # Legacy backend (not in use)
└── .gitignore
```

---

## Database Schema

### Users Table (Passengers)
```sql
- id (serial, primary key)
- full_name (varchar)
- email (varchar, unique)
- phone (varchar)
- password_hash (varchar)
- google_id (varchar, nullable) - For Google OAuth
- profile_picture (text, nullable)
- created_at (timestamp)
```

### Riders Table (Drivers)
```sql
- id (serial, primary key)
- first_name (varchar)
- last_name (varchar)
- email (varchar, unique)
- phone (varchar)
- password_hash (varchar)
- profile_photo (text, nullable)
- license_number (varchar)
- vehicle_plate (varchar)
- vehicle_color (varchar)
- vehicle_capacity (integer)
- vehicle_type (varchar) - bike, auto, car, suv
- vehicle_model (varchar)
- is_online (boolean, default: false)
- current_location (text) - Format: "Location (lat, lng)"
- rating (numeric, default: 5.0)
- total_rides (integer, default: 0)
- total_earnings (numeric, default: 0)
- created_at (timestamp)
- updated_at (timestamp)
```

### Rides Table
```sql
- id (serial, primary key)
- passenger_id (integer, foreign key → users.id)
- rider_id (integer, foreign key → riders.id, nullable)
- pickup_location (text)
- destination (text)
- distance (numeric) - in km
- fare (numeric)
- ride_type (varchar) - personal, shared
- vehicle_type (varchar) - bike, auto, car, suv
- payment_method (varchar) - cash, upi, card, wallet
- payment_status (varchar) - pending, completed, failed
- selected_rider_id (integer, nullable) - Passenger-chosen rider
- status (varchar) - pending, accepted, in-progress, completed, cancelled
- requested_at (timestamp)
- accepted_at (timestamp, nullable)
- completed_at (timestamp, nullable)
- updated_at (timestamp)
```

### Notifications Table
```sql
- id (serial, primary key)
- user_id (integer, foreign key → users.id)
- rider_id (integer, foreign key → riders.id, nullable)
- type (varchar)
- title (varchar)
- message (text)
- ride_id (integer, foreign key → rides.id, nullable)
- created_at (timestamp)
- read (boolean, default: false)
```

---

## API Endpoints

### Authentication (`/api/auth`)
- `POST /signup` - User registration
- `POST /login` - User login (returns JWT)
- `GET /profile` - Get user profile (protected)
- `PUT /profile` - Update user profile (protected)
- `GET /google` - Initiate Google OAuth
- `GET /google/callback` - Google OAuth callback

### Rider Authentication (`/api/rider`)
- `POST /signup` - Rider registration
- `POST /login` - Rider login (returns JWT)
- `GET /profile` - Get rider profile (protected)

### Rider Dashboard (`/api/rider/dashboard`)
- `GET /stats` - Get rider statistics (protected)
- `GET /pending-requests` - Get pending ride requests (protected)
- `POST /availability` - Update online status & location (protected)
- `GET /recent-activity` - Get completed rides (protected)

### Ride Management (`/api/rider/rides`)
- `POST /accept/:rideId` - Accept a ride request (protected)
- `POST /reject/:rideId` - Reject a ride request (protected)

### Rides (`/api/rides`)
- `POST /check-availability` - Check available riders for a route
- `POST /book` - Book a new ride (protected)
- `GET /:rideId` - Get ride details
- `PUT /:rideId/status` - Update ride status (protected)

### Geocoding (`/api/geocoding`)
- `GET /geocode?address={query}&limit={n}` - Forward geocoding
- `GET /reverse?lat={lat}&lon={lon}` - Reverse geocoding

### Payments (`/api/payments`)
- `POST /stripe/webhook` - Stripe webhook handler
- `POST /ride/:rideId/cancel` - Cancel pending payment (protected)

---

## Socket.IO Events

### Client → Server
- `rider-online` - Rider goes online (joins rider room)
- `rider-offline` - Rider goes offline (leaves rider room)
- `passenger-join` - Passenger joins their room
- `join-ride` - Join ride tracking room (after acceptance)
- `location-update` - Send location updates during ride
- `ride-status-change` - Notify ride status changes

### Server → Client
- `new-ride-request` - Notify rider of new ride request
- `ride-accepted` - Notify passenger that ride was accepted
- `ride-status-updated` - Notify of ride status changes
- `location-update` - Relay location updates between parties
- `party-connected` - Notify when other party connects to ride room

---

## Key Features

### 1. User Authentication
- Email/password registration & login
- Google OAuth integration
- JWT-based authentication
- Session storage for tokens

### 2. Rider Dashboard
- Real-time ride request notifications via Socket.IO
- Online/offline status toggle
- GPS location tracking (auto-sync on movement)
- Statistics: total rides, earnings, rating, passengers
- Pending ride requests list
- Recent activity (completed rides)
- Accept/reject ride requests

### 3. Ride Booking (Passenger)
- Multi-step booking flow (Trip Details → Vehicle Selection → Confirmation)
- Personal vs shared ride options
- Vehicle selection: Bike, Auto, Car, SUV
- Real-time rider availability check
- Rider selection (choose specific driver or any available)
- Distance-based fare calculation
- Payment method selection (cash, UPI, card, wallet)
- Auto-detect pickup location via GPS
- Address autocomplete suggestions

### 4. Live Ride Tracking
- Real-time location updates between rider and passenger
- Ride status tracking (pending → accepted → in-progress → completed)
- Socket.IO room-based communication

### 5. Payment Integration
- Stripe integration for card payments
- Webhook handling for payment status updates
- Payment cancellation support
- Multiple payment methods (cash, UPI, card, wallet)

### 6. Geocoding
- Forward geocoding (address → coordinates)
- Reverse geocoding (coordinates → address)
- Location suggestions for pickup/destination

---

## Environment Variables

### Backend (.env)
```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/rideshare_db

# JWT
JWT_SECRET=your-secret-key-change-this
JWT_EXPIRES_IN=7d

# Session
SESSION_SECRET=your-session-secret-change-this

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# Frontend
FRONTEND_URL=http://localhost:5173

# Stripe
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Server
PORT=3000
NODE_ENV=development
```

### Frontend (.env.local)
```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

---

## Running the Project

### Backend
```bash
cd backend
npm install
cp .env.example .env  # Edit .env with your values
npm start  # Runs with nodemon on port 3000
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env.local  # Edit .env.local with your values
npm run dev  # Runs Vite dev server on port 5173
```

---

## Recent Changes (from Git History)

1. **Defer Stripe checkout and simplify booking flow** - Stripe session creation now happens after rider accepts, not during booking
2. **Add Stripe payments and ride payment flow** - Integrated Stripe for card payments
3. **Use sessionStorage for auth data** - Changed from localStorage to sessionStorage
4. **Switch frontend to Google Maps and extend JWT** - Migrated from Leaflet to Google Maps API
5. **Improve ride search, rider dashboard & tracking UI** - Enhanced UI/UX

---

## Known Issues & TODOs

### Current State
- ✅ User authentication (email/password + Google OAuth)
- ✅ Rider authentication
- ✅ Ride booking flow
- ✅ Real-time ride notifications
- ✅ Rider dashboard with stats
- ✅ Live ride tracking
- ✅ Stripe payment integration
- ✅ Geocoding services
- ✅ GPS location tracking

### Potential Improvements
- Add ride cancellation flow
- Implement ride rating system
- Add ride history for passengers
- Implement push notifications
- Add ride scheduling
- Implement surge pricing
- Add ride sharing matching algorithm
- Improve error handling and edge cases
- Add comprehensive testing

---

## Development Notes

### Authentication Flow
1. User/Rider logs in → JWT token stored in sessionStorage
2. Token sent in Authorization header for protected routes
3. Middleware validates token and attaches user/rider to request

### Ride Booking Flow
1. Passenger enters pickup/destination → Geocoding API gets coordinates
2. Check availability → Returns nearby riders by vehicle type
3. Passenger selects vehicle (and optionally specific rider)
4. Book ride → Creates ride record with status "pending"
5. Socket.IO notifies matching riders
6. Rider accepts → Ride status changes to "accepted"
7. Passenger notified via Socket.IO → Redirects to tracking page
8. Both parties join ride room → Live location updates

### Rider Availability
- Riders toggle online/offline status
- When online, location is synced periodically (15s interval)
- Location updates on GPS movement (watchPosition)
- Online riders are shown in availability check
- Riders on active rides are excluded from availability

### Payment Flow
- Payment method selected during booking
- For card payments: Stripe session created after rider accepts
- Webhook updates payment status
- Cash payments: marked as completed when ride ends

---

## Testing

### Manual Testing Checklist
- [ ] User signup and login
- [ ] Google OAuth login
- [ ] Rider signup and login
- [ ] Ride booking with all vehicle types
- [ ] Rider availability toggle
- [ ] Ride request acceptance
- [ ] Live ride tracking
- [ ] Payment flow (cash and card)
- [ ] Geocoding (forward and reverse)
- [ ] GPS location detection
- [ ] Socket.IO real-time notifications

---

## Deployment Considerations

### Backend
- Use production database URL
- Set NODE_ENV=production
- Use secure session cookies
- Configure CORS for production domain
- Set up Stripe webhook endpoint
- Use HTTPS for OAuth callbacks

### Frontend
- Build with `npm run build`
- Serve static files from backend or CDN
- Set production API base URL
- Configure Google Maps API key for production domain

---

## Contact & Support

For questions or issues, refer to the project documentation or contact the development team.