const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/user.model");
const jwt = require("jsonwebtoken");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:3000/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user exists with this Google ID or email
        let user = await User.findByGoogleId(profile.id);
        
        if (!user) {
          // Check if user exists with this email
          user = await User.findByEmail(profile.emails[0].value);
          
          if (user) {
            // Update existing user with Google ID
            await User.updateGoogleId(user.id, profile.id);
          } else {
            // Create new user
            user = await User.createFromGoogle({
              googleId: profile.id,
              fullName: profile.displayName,
              email: profile.emails[0].value,
              profilePicture: profile.photos && profile.photos[0] ? profile.photos[0].value : null
            });
          }
        }

        return done(null, user);
      } catch (err) {
        console.error('Google OAuth error:', err);
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;