const dotenv=require('dotenv');
dotenv.config();
const http=require('http');
const cors=require('cors');
const express=require('express');
const session=require('express-session');
const passport=require('./config/passport');
const app=express();

// CORS configuration - must be before other middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Content Security Policy for Google OAuth
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' https://accounts.google.com https://apis.google.com; " +
    "style-src 'self' 'unsafe-inline' https://accounts.google.com; " +
    "img-src 'self' data: https:; " +
    "font-src 'self' data:; " +
    "connect-src 'self' https://accounts.google.com https://oauth2.googleapis.com; " +
    "frame-src 'self' https://accounts.google.com; " +
    "base-uri 'self'; " +
    "form-action 'self' https://accounts.google.com;"
  );
  next();
});

app.use(express.json({ limit: '10mb' })); // Increase payload size limit for base64 images
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Session configuration for passport
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// auth routes
const authRoutes = require('./routes/auth.routes');
app.use('/api/auth', authRoutes);

// rider routes
const riderRoutes = require('./routes/rider.routes');
app.use('/api/rider', riderRoutes);

// rides routes
const ridesRoutes = require('./routes/rides.routes');
app.use('/api/rides', ridesRoutes);

// geocoding routes
const geocodingRoutes = require('./routes/geocoding.routes');
app.use('/api/geocoding', geocodingRoutes);

app.get('/',(req,res)=>{
    res.send('Hello World!');
});



module.exports=app;
