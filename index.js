import express from 'express';
import passport from 'passport';
import session from 'express-session';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'; // Correct import for named export
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config(); // Load environment variables from .env file

const app = express();

// Set up CORS with your frontend URL
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));

// Configure express-session
app.use(session({
    secret: process.env.SESSION_SECRET, // IMPORTANT: Use an environment variable for a strong secret
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production (HTTPS)
        httpOnly: true, // Prevent client-side JS from accessing the cookie
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Initialize Passport.js
app.use(passport.initialize());
app.use(passport.session());

// Configure Google Strategy for Passport
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.REDIRECT_URI // This must match the authorized redirect URI in Google Cloud Console
},
(accessToken, refreshToken, profile, done) => {
    // In a real application, you would save or find the user in your database here.
    // For now, we're just passing the profile.
    return done(null, profile);
}));

// Serialize user into the session
passport.serializeUser((user, done) => {
    done(null, user);
});

// Deserialize user from the session
passport.deserializeUser((obj, done) => {
    done(null, obj);
});

// --- NEW ROOT ROUTE ADDED HERE ---
app.get('/', (req, res) => {
  res.send('Google Auth Backend is running. Navigate to /auth/google to start login.');
});
// ---------------------------------

// Google authentication route
app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] }) // Request profile and email scopes
);

// Google authentication callback route
app.get('/auth/google/callback',
    passport.authenticate('google', {
        successRedirect: `${process.env.FRONTEND_URL}/?login=success`, // Redirect on successful login
        failureRedirect: `${process.env.FRONTEND_URL}/?login=failure`  // Redirect on failed login
    })
);

// Define the port the server will listen on
const PORT = process.env.PORT || 3000;

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
