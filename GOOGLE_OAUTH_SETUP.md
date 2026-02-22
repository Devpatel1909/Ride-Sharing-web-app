# Google OAuth Setup Guide

This guide will help you set up Google authentication for the Ride-Sharing web app.

## ✅ What's Already Implemented

### Backend
- ✅ Passport.js configuration with Google OAuth strategy
- ✅ Google authentication routes (`/api/auth/google`, `/api/auth/google/callback`)
- ✅ User model updated to support Google ID and profile pictures
- ✅ Database migration for Google OAuth columns

### Frontend
- ✅ Google login buttons on Login and Signup pages
- ✅ Google OAuth callback handler page
- ✅ Automatic token storage and user profile fetching
- ✅ Routing for OAuth success callback

## 🚀 Setup Instructions

### Step 1: Database Migration

Run the SQL migration to add Google OAuth support to your users table:

```bash
cd backend
psql -U your_username -d rideshare_db -f migrations/add_google_oauth.sql
```

Or manually execute in your PostgreSQL database:

```sql
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS profile_picture TEXT;

CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

ALTER TABLE users 
ALTER COLUMN password_hash DROP NOT NULL;
```

### Step 2: Configure Environment Variables

Create a `.env` file in the `backend` directory (copy from `.env.example`):

```bash
cd backend
cp .env.example .env
```

Update the `.env` file with your actual values:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/rideshare_db

# JWT Configuration
JWT_SECRET=your-random-secret-key-here
JWT_EXPIRES_IN=7d

# Session Configuration
SESSION_SECRET=your-session-secret-here

# Google OAuth Configuration (Already set from your OAuth client file)
GOOGLE_CLIENT_ID=814689658269-cv91man2q30saibfk247dguknqoceqvl.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# Frontend Configuration
FRONTEND_URL=http://localhost:5173

# Server Configuration
PORT=3000
NODE_ENV=development
```

### Step 3: Configure Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** > **Credentials**
3. Find your OAuth 2.0 Client ID: `814689658269-cv91man2q30saibfk247dguknqoceqvl.apps.googleusercontent.com`
4. **Add Authorized JavaScript origins:**
   - `http://localhost:5173` (Frontend)
   - `http://localhost:3000` (Backend)
   
5. **Add Authorized redirect URIs:**
   - `http://localhost:3000/api/auth/google/callback`
   - For production, add: `https://yourdomain.com/api/auth/google/callback`

### Step 4: Start the Application

1. **Start Backend:**
```bash
cd backend
npm start
```

2. **Start Frontend:**
```bash
cd frontend
npm run dev
```

## 🎯 How It Works

### User Flow:

1. **User clicks "Google" button** on Login or Signup page
2. **Redirected to Google OAuth consent screen**
3. **User grants permissions** (email, profile)
4. **Google redirects back** to `/api/auth/google/callback`
5. **Backend processes authentication:**
   - Checks if user exists by Google ID
   - If not, checks by email
   - Creates new user if doesn't exist
   - Generates JWT token
6. **Redirects to frontend** with token: `/auth/google/success?token=...`
7. **Frontend callback page:**
   - Extracts token from URL
   - Stores token in localStorage
   - Fetches user profile
   - Stores user data
   - Redirects to home page

### Technical Details:

**Backend Endpoints:**
- `GET /api/auth/google` - Initiates OAuth flow
- `GET /api/auth/google/callback` - Handles OAuth callback
- `GET /api/auth/profile` - Gets authenticated user profile

**Database Schema:**
```sql
users (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(255),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  password_hash VARCHAR(255), -- Now nullable for Google users
  google_id VARCHAR(255) UNIQUE, -- New: Store Google user ID
  profile_picture TEXT, -- New: Store Google profile picture URL
  created_at TIMESTAMP DEFAULT NOW()
)
```

## 🔒 Security Considerations

- JWT tokens expire in 7 days (configurable in `.env`)
- Google OAuth uses HTTPS in production
- Session secrets should be strong random strings
- CORS is configured to allow only your frontend URL
- Passwords are optional for Google OAuth users

## 🐛 Troubleshooting

### "Invalid redirect URI" error
- Make sure you've added the exact callback URL in Google Cloud Console
- URLs must match exactly (including http/https, port numbers)

### "Cannot read property 'id' of undefined"
- Check that database migration ran successfully
- Verify `google_id` column exists in users table

### Token not being stored
- Check browser console for errors
- Verify frontend can reach backend API
- Check CORS configuration in `backend/app.js`

### OAuth window closes immediately
- Check backend logs for errors
- Verify Google credentials in `.env` file
- Ensure backend is running on port 3000

## 📝 Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `GOOGLE_CLIENT_ID` | OAuth client ID from Google Cloud Console | `814689658269-...googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | OAuth client secret | `GOCSPX-...` |
| `GOOGLE_CALLBACK_URL` | Backend callback URL | `http://localhost:3000/api/auth/google/callback` |
| `FRONTEND_URL` | Frontend application URL | `http://localhost:5173` |
| `JWT_SECRET` | Secret key for signing JWT tokens | Random string |
| `SESSION_SECRET` | Secret key for Express sessions | Random string |

## ✨ Features Implemented

✅ One-click Google login/signup
✅ Automatic user creation from Google profile
✅ Profile picture sync from Google
✅ Seamless JWT token generation
✅ Works alongside traditional email/password auth
✅ Beautiful loading screen during OAuth callback
✅ Error handling with user-friendly messages

## 🎨 UI Elements

The Google authentication buttons have been styled to match your app's design:
- **Deep Blue + Electric Purple theme**
- **UberMove font** throughout
- **Smooth transitions** (duration-300 ease-out)
- **Hover effects**: border change, background, shadow, lift animation
- **Consistent with** the rest of the auth pages

## 📱 Testing

1. Click the "Google" button on Login or Signup page
2. Select your Google account
3. Grant permissions
4. You should be redirected to the home page, logged in
5. Check localStorage for `token` and `user` data
6. Navigate to `/profile` to see your account details

## 🚀 Production Deployment

For production:

1. Update `.env` with production URLs:
```env
GOOGLE_CALLBACK_URL=https://yourdomain.com/api/auth/google/callback
FRONTEND_URL=https://yourdomain.com
NODE_ENV=production
```

2. Update Google Cloud Console with production URIs
3. Use HTTPS for all OAuth endpoints
4. Generate strong secrets for JWT_SECRET and SESSION_SECRET
5. Set secure cookie options in production

---

**Need Help?** Check the console logs in both frontend and backend for detailed error messages.
