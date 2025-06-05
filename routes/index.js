const router = require('express').Router();
const passport = require('passport');

router.use('/', require('./swagger'));

router.get('/', (req, res) => {
  const user = req.session.user;
  const error = req.query.error;
  let errorMsg = '';
  if (error) {
    if (error === 'oauth_denied') errorMsg = 'GitHub login was denied.';
    else if (error === 'oauth_failed') errorMsg = 'GitHub login failed.';
    else if (error === 'internal_error') errorMsg = 'Internal server error during login.';
    else if (error === 'login_failed') errorMsg = 'Failed to log you in after authentication.';
    else errorMsg = 'Unknown error.';
  }
  res.send(`
    <h1>Welcome${user ? ', ' + (user.displayName || user.username || 'User') : ''}!</h1>
    ${errorMsg ? `<p style="color:red;">${errorMsg}</p>` : ''}
    <ul>
      ${user 
        ? `<li><a href="/logout">Logout</a></li>
           <li><p>Logged in as: ${user.username || user.displayName}</p></li>`
        : `<li><a href="/login">Login with GitHub</a></li>`
      }
      <li><a href="/books">Books API</a></li>
      <li><a href="/authors">Authors API</a></li>
      <li><a href="/api-docs">API Documentation (Swagger)</a></li>
      <li><a href="/debug/env">Debug Environment</a></li>
    </ul>
  `);
});

router.use('/books', require('./books'));
router.use('/authors', require('./authors'));

// Start GitHub OAuth login with enhanced debugging
router.get('/login', (req, res, next) => {
  console.log('🔐 Starting GitHub OAuth login...');
  console.log('🔗 Callback URL will be:', getCallbackURL());
  console.log('GitHub Client ID:', process.env.GITHUB_CLIENT_ID ? 'Set' : 'MISSING');
  console.log('GitHub Client Secret:', process.env.GITHUB_CLIENT_SECRET ? 'Set' : 'MISSING');
  
  // Check if required environment variables are missing
  if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
    console.error('❌ Missing GitHub OAuth credentials');
    return res.send(`
      <h1>OAuth Configuration Error</h1>
      <p><strong>GitHub Client ID:</strong> ${process.env.GITHUB_CLIENT_ID ? '✅ Set' : '❌ Missing'}</p>
      <p><strong>GitHub Client Secret:</strong> ${process.env.GITHUB_CLIENT_SECRET ? '✅ Set' : '❌ Missing'}</p>
      <p><strong>Expected Callback URL:</strong> ${getCallbackURL()}</p>
      <hr>
      <p>Please check your environment variables and GitHub OAuth app configuration.</p>
      <a href="/">Go Home</a>
    `);
  }
  
  passport.authenticate('github', {
    scope: ['user:email']
  })(req, res, next);
});

// Function to get the correct callback URL (moved here for access)
const getCallbackURL = () => {
  if (process.env.GITHUB_CALLBACK_URL) {
    return process.env.GITHUB_CALLBACK_URL;
  }
  
  if (process.env.NODE_ENV === 'production') {
    return 'https://cse340-two.onrender.com/auth/github/callback';
  }
  
  return `http://localhost:${process.env.PORT || 3000}/auth/github/callback`;
};

// REPLACE THE OLD CALLBACK WITH THIS ENHANCED VERSION
router.get('/auth/github/callback', (req, res, next) => {
  console.log('📥 Received GitHub callback');
  console.log('Query params:', req.query);
  console.log('Full URL:', req.url);
  console.log('Original URL:', req.originalUrl);
  console.log('Headers:', req.headers);
  console.log('Expected callback URL:', getCallbackURL());
  
  // Check for error in callback
  if (req.query.error) {
    console.error('❌ GitHub OAuth error:', req.query.error);
    console.error('Error description:', req.query.error_description);
    return res.redirect('/?error=oauth_denied');
  }

  // Check for code parameter
  if (!req.query.code) {
    console.error('❌ No authorization code received');
    console.error('This usually means:');
    console.error('1. GitHub OAuth app callback URL mismatch');
    console.error('2. Missing or incorrect environment variables');
    console.error('3. GitHub app not properly configured');
    
    // Return debug information to help diagnose
    return res.send(`
      <h1>OAuth Debug Information</h1>
      <p><strong>Expected Callback URL:</strong> ${getCallbackURL()}</p>
      <p><strong>Received URL:</strong> ${req.originalUrl}</p>
      <p><strong>Query Parameters:</strong> ${JSON.stringify(req.query)}</p>
      <p><strong>GitHub Client ID:</strong> ${process.env.GITHUB_CLIENT_ID ? 'Set' : 'Missing'}</p>
      <p><strong>GitHub Client Secret:</strong> ${process.env.GITHUB_CLIENT_SECRET ? 'Set' : 'Missing'}</p>
      <hr>
      <p><strong>Instructions:</strong></p>
      <ol>
        <li>Check your GitHub OAuth app settings</li>
        <li>Ensure the callback URL exactly matches: <code>${getCallbackURL()}</code></li>
        <li>Verify all environment variables are set</li>
      </ol>
      <a href="/">Go Home</a>
    `);
  }

  console.log('✅ Authorization code received, proceeding with authentication...');
  next();
}, passport.authenticate('github', { 
  failureRedirect: '/?error=oauth_failed',
  failureFlash: false
}), (req, res) => {
  // Success callback
  console.log('✅ GitHub authentication successful');
  console.log('User:', req.user?.username || req.user?.displayName);
  
  req.session.user = req.user;
  req.session.save((err) => {
    if (err) {
      console.error('❌ Session save error:', err);
      return res.redirect('/?error=login_failed');
    }
    console.log('✅ Session saved successfully');
    res.redirect('/');
  });
});

// Enhanced logout with session cleanup
router.get('/logout', function(req, res, next){
  console.log('👋 User logging out');
  
  req.logout(function(err) {
    if (err) { 
      console.error('Logout error:', err);
      return next(err); 
    }
    
    // Clear session
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destroy error:', err);
      }
      console.log('✅ User logged out successfully');
      res.redirect('/');
    });
  });
});

// Enhanced debug route
router.get('/debug/env', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).send('Not found');
  }
  
  const callbackURL = process.env.GITHUB_CALLBACK_URL || 
    (process.env.NODE_ENV === 'production' 
      ? 'https://cse340-two.onrender.com/auth/github/callback'
      : `http://localhost:${process.env.PORT || 3000}/auth/github/callback`);
  
  res.json({
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID ? '✅ Set' : '❌ Missing',
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET ? '✅ Set' : '❌ Missing',
    GITHUB_CALLBACK_URL: process.env.GITHUB_CALLBACK_URL || '❌ Using default',
    ACTUAL_CALLBACK_URL: callbackURL,
    PORT: process.env.PORT || 3000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    SESSION_SECRET: process.env.SESSION_SECRET ? '✅ Set' : '❌ Missing'
  });
});

module.exports = router;