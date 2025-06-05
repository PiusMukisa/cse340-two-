const express = require('express');
require('dotenv').config();
const bodyParser = require('body-parser');
const { initDb } = require('./data/database');
const passport = require('passport');
const session = require('express-session');
const GithubStrategy = require('passport-github2').Strategy;
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors());

app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-here',
  resave: false,
  saveUninitialized: false, // Changed to false for security
  cookie: { 
    secure: process.env.NODE_ENV === 'production', // Only secure in production
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// Passport GitHub Strategy
passport.use(new GithubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: process.env.GITHUB_CALLBACK_URL
}, (accessToken, refreshToken, profile, done) => {
  // Log successful authentication
  console.log('GitHub OAuth successful for user:', profile.username);
  return done(null, profile);
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// Routes
app.use('/', require('./routes/index.js'));

// Remove the duplicate callback route - it's handled in routes/index.js
// The duplicate route was causing conflicts

// Error handling middleware
app.use((err, req, res, next) => {
  // For GitHub OAuth errors, redirect to home with error
  if (req.originalUrl.startsWith('/auth/github')) {
    return res.redirect('/?error=internal_error');
  }
  // For all other errors, render a simple HTML error page
  res.status(500).send(`
    <h1>Internal Server Error</h1>
    <p style="color:red;">${err.message || 'Something went wrong.'}</p>
    <a href="/">Go back to Home</a>
  `);
});

// Connect to database and start server
initDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`✅ Database connected. Server running on port ${port}`);
      console.log(`📝 API Documentation available at: http://localhost:${port}/api-docs`);
      console.log(`🔐 GitHub OAuth callback URL should be: ${process.env.GITHUB_CALLBACK_URL}`);
    });
  })
  .catch(err => {
    console.error('❌ Failed to connect to database:', err);
    process.exit(1);
  });