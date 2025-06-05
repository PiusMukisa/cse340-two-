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
           <li><a href="/profile">Profile (not implemented)</a></li>`
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

// Start GitHub OAuth login
router.get('/login', (req, res, next) => {
  console.log('🔐 Starting GitHub OAuth login...');
  passport.authenticate('github', {
    scope: ['user:email'] // Request email scope
  })(req, res, next);
});

// GitHub OAuth callback with better error handling
router.get('/auth/github/callback', 
  (req, res, next) => {
    console.log('📥 Received GitHub callback');
    console.log('Query params:', req.query);

    // Check for error in callback
    if (req.query.error) {
      console.error('❌ GitHub OAuth error:', req.query.error);
      return res.redirect('/?error=oauth_denied');
    }

    next();
  },
  (req, res, next) => {
    passport.authenticate('github', { 
      failureRedirect: '/?error=oauth_failed',
      failureFlash: false
    }, (err, user, info) => {
      if (err) {
        console.error('❌ Passport error:', err);
        return res.redirect('/?error=internal_error');
      }
      if (!user) {
        return res.redirect('/?error=oauth_failed');
      }
      req.logIn(user, (err) => {
        if (err) {
          console.error('❌ Login error:', err);
          return res.redirect('/?error=login_failed');
        }
        req.session.user = user;
        return res.redirect('/');
      });
    })(req, res, next);
  }
);

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
      res.redirect('/');
    });
  });
});

// Debug route to check environment variables (remove in production)
router.get('/debug/env', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).send('Not found');
  }
  
  res.json({
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID ? '✅ Set' : '❌ Missing',
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET ? '✅ Set' : '❌ Missing',
    GITHUB_CALLBACK_URL: process.env.GITHUB_CALLBACK_URL || '❌ Missing',
    NODE_ENV: process.env.NODE_ENV || 'development'
  });
});

module.exports = router;