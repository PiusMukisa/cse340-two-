const router = require('express').Router();
const passport = require('passport');

router.use('/', require('./swagger'));

router.get('/', (req, res) => {
  if (req.session.user) {
    res.send(`Hello ${req.session.user.displayName || req.session.user.username || 'User'}! <a href="/logout">Logout</a>`);
  } else {
    res.send('You are logged out. <a href="/login">Login with GitHub</a>');
  }
});

router.use('/books', require('./books'));
router.use('/authors', require('./authors'));

// 🔐 Start GitHub OAuth login
router.get('/login', (req, res, next) => {
  console.log('🔐 Starting GitHub OAuth login...');
  passport.authenticate('github', {
    scope: ['user:email']
  })(req, res, next);
});

// 📥 GitHub OAuth callback
router.get('/auth/github/callback',
  (req, res, next) => {
    console.log('📥 Received GitHub callback');
    console.log('Query params:', req.query);

    if (req.query.error) {
      console.error('❌ GitHub OAuth error:', req.query.error);
      return res.redirect('/?error=oauth_denied');
    }

    next();
  },
  passport.authenticate('github', {
    failureRedirect: '/?error=oauth_failed',
    failureFlash: false
  }),
  function(req, res) {
    console.log('✅ GitHub OAuth successful');
    console.log('User:', req.user.username);

    req.session.user = req.user;
    res.redirect('/');
  }
);

// 👋 Logout
router.get('/logout', function(req, res, next) {
  console.log('👋 User logging out');

  req.logout(function(err) {
    if (err) {
      console.error('Logout error:', err);
      return next(err);
    }

    req.session.destroy((err) => {
      if (err) {
        console.error('Session destroy error:', err);
      }
      res.redirect('/');
    });
  });
});

// 🛠️ Debug route (disable in production)
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
