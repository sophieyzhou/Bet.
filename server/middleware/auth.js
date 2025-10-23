const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

const initializePassport = () => {
  // Google OAuth Strategy
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/api/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists
      let user = await User.findOne({ googleId: profile.id });
      
      if (user) {
        user.lastLogin = new Date();
        await user.save();
        return done(null, user);
      }
      
      // If a user exists with the same email, link Google to that account
      const email = profile.emails && profile.emails[0] && profile.emails[0].value;
      if (email) {
        const existingByEmail = await User.findOne({ email });
        if (existingByEmail) {
          existingByEmail.googleId = profile.id;
          existingByEmail.provider = 'google';
          existingByEmail.profilePicture = existingByEmail.profilePicture || (profile.photos && profile.photos[0] && profile.photos[0].value);
          existingByEmail.lastLogin = new Date();
          await existingByEmail.save();
          return done(null, existingByEmail);
        }
      }

      // Create new user when not found
      user = new User({
        googleId: profile.id,
        provider: 'google',
        email,
        name: profile.displayName,
        profilePicture: profile.photos && profile.photos[0] && profile.photos[0].value,
        joinedGroups: []
      });
      
      await user.save();
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }));

  // Serialize user for session
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
};

module.exports = { initializePassport };
