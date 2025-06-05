const express = require('express');
require('dotenv').config();
const bodyParser = require('body-parser');
const { initDb } = require('./data/database');
const passport = require('passport');
const session = require('express-session');
const GitHubStrategy = require('passport-github2').Strategy;
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors());

app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-here',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// Function to get the correct callback URL based on environment
const getCallbackURL = () => {
  if (process.env.GITHUB_CALLBACK_URL) {
    return process.env.GITHUB_CALLBACK_URL;
  }
  
  if (process.env.NODE_ENV === 'production') {
    return 'https://cse340-two.onrender.com/auth/github/callback';
  }
  
  return `http://localhost:${port}/auth/github/callback`;
};

// Passport GitHub Strategy
passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: getCallbackURL()
},
function(accessToken, refreshToken, profile, done) {
  console.log('✅ GitHub OAuth successful for user:', profile.username);
  return done(null, profile);
}
));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// Routes
app.use('/', require('./routes/index.js'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error occurred:', err);
  
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
      console.log(`🔐 GitHub OAuth callback URL: ${getCallbackURL()}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  })
  .catch(err => {
    console.error('❌ Failed to connect to database:', err);
    process.exit(1);
  });