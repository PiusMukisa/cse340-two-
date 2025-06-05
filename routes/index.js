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

  // Beautiful HTML template
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Library Management System</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            overflow-x: hidden;
        }

        .animated-bg {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: -1;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .floating-shapes {
            position: absolute;
            width: 100%;
            height: 100%;
            overflow: hidden;
        }

        .shape {
            position: absolute;
            opacity: 0.1;
            animation: float 6s ease-in-out infinite;
        }

        .shape:nth-child(1) {
            top: 10%;
            left: 20%;
            width: 80px;
            height: 80px;
            background: rgba(255,255,255,0.1);
            border-radius: 50%;
            animation-delay: 0s;
        }

        .shape:nth-child(2) {
            top: 20%;
            right: 20%;
            width: 60px;
            height: 60px;
            background: rgba(255,255,255,0.1);
            border-radius: 20%;
            animation-delay: 2s;
        }

        .shape:nth-child(3) {
            bottom: 10%;
            left: 10%;
            width: 100px;
            height: 100px;
            background: rgba(255,255,255,0.1);
            border-radius: 50%;
            animation-delay: 4s;
        }

        @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(180deg); }
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
        }

        .welcome-card {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(20px);
            border-radius: 20px;
            padding: 40px;
            text-align: center;
            box-shadow: 0 25px 45px rgba(0,0,0,0.1);
            border: 1px solid rgba(255,255,255,0.2);
            animation: slideUp 1s ease-out;
            max-width: 600px;
            width: 100%;
        }

        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateY(50px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .logo {
            font-size: 3rem;
            margin-bottom: 10px;
            animation: bounce 2s infinite;
        }

        @keyframes bounce {
            0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-10px); }
            60% { transform: translateY(-5px); }
        }

        .welcome-title {
            color: white;
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }

        .user-name {
            color: #FFD700;
            font-size: 1.8rem;
            font-weight: 600;
            margin-bottom: 20px;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
        }

        .subtitle {
            color: rgba(255,255,255,0.9);
            font-size: 1.1rem;
            margin-bottom: 30px;
            line-height: 1.6;
        }

        .error-message {
            background: rgba(255,99,99,0.2);
            color: #ff6b6b;
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 20px;
            border: 1px solid rgba(255,99,99,0.3);
            animation: shake 0.5s ease-in-out;
        }

        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
        }

        .auth-section {
            margin-bottom: 30px;
        }

        .login-btn, .logout-btn {
            background: linear-gradient(45deg, #FF6B6B, #FF8E53);
            color: white;
            padding: 15px 30px;
            border: none;
            border-radius: 50px;
            font-size: 1.1rem;
            font-weight: 600;
            text-decoration: none;
            display: inline-block;
            transition: all 0.3s ease;
            box-shadow: 0 10px 20px rgba(255,107,107,0.3);
            margin: 5px;
        }

        .login-btn:hover, .logout-btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 15px 25px rgba(255,107,107,0.4);
            background: linear-gradient(45deg, #FF8E53, #FF6B6B);
        }

        .nav-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-top: 30px;
            width: 100%;
        }

        .nav-card {
            background: rgba(255,255,255,0.15);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 25px;
            text-align: center;
            transition: all 0.3s ease;
            border: 1px solid rgba(255,255,255,0.2);
            position: relative;
            overflow: hidden;
        }

        .nav-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
            transition: left 0.5s;
        }

        .nav-card:hover::before {
            left: 100%;
        }

        .nav-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 20px 40px rgba(0,0,0,0.2);
            background: rgba(255,255,255,0.2);
        }

        .nav-icon {
            font-size: 2.5rem;
            margin-bottom: 15px;
            display: block;
        }

        .nav-title {
            color: white;
            font-size: 1.3rem;
            font-weight: 600;
            margin-bottom: 10px;
        }

        .nav-desc {
            color: rgba(255,255,255,0.8);
            font-size: 0.9rem;
            line-height: 1.4;
        }

        .nav-card a {
            text-decoration: none;
            color: inherit;
            display: block;
            height: 100%;
        }

        .status-indicator {
            display: inline-block;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #4CAF50;
            margin-right: 8px;
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7); }
            70% { box-shadow: 0 0 0 10px rgba(76, 175, 80, 0); }
            100% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0); }
        }

        .footer {
            margin-top: 40px;
            text-align: center;
            color: rgba(255,255,255,0.7);
            font-size: 0.9rem;
        }

        @media (max-width: 768px) {
            .welcome-card {
                padding: 25px;
                margin: 10px;
            }
            
            .welcome-title {
                font-size: 2rem;
            }
            
            .user-name {
                font-size: 1.4rem;
            }
            
            .nav-grid {
                grid-template-columns: 1fr;
                gap: 15px;
            }
            
            .logo {
                font-size: 2rem;
            }
        }

        .version-badge {
            position: absolute;
            top: 20px;
            right: 20px;
            background: rgba(255,255,255,0.1);
            color: rgba(255,255,255,0.8);
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 0.8rem;
            backdrop-filter: blur(10px);
        }
    </style>
</head>
<body>
    <div class="animated-bg">
        <div class="floating-shapes">
            <div class="shape"></div>
            <div class="shape"></div>
            <div class="shape"></div>
        </div>
    </div>

    <div class="version-badge">v2.0</div>

    <div class="container">
        <div class="welcome-card">
            <div class="logo">📚</div>
            
            <h1 class="welcome-title">Welcome${user ? '!' : ''}</h1>
            ${user ? `<div class="user-name">${user.displayName || user.username || 'User'}</div>` : '<div class="user-name">Library Management System</div>'}
            
            <p class="subtitle">
                <span class="status-indicator"></span>
                ${user ? 'Your digital library companion for managing books and authors' : 'Please login to access your digital library'}
            </p>

            ${errorMsg ? `<div class="error-message">${errorMsg}</div>` : ''}

            <div class="auth-section">
                ${user 
                  ? `<a href="/logout" class="logout-btn">👋 Logout</a>`
                  : `<a href="/login" class="login-btn">🔐 Login with GitHub</a>
                     <br><br>
                     <a href="/temp-login" class="login-btn" style="background: linear-gradient(45deg, #4CAF50, #45a049);">🧪 Temporary Login (Testing)</a>`
                }
            </div>

            <div class="nav-grid">
                <div class="nav-card">
                    <a href="/books">
                        <div class="nav-icon">📖</div>
                        <div class="nav-title">Books API</div>
                        <div class="nav-desc">Manage your book collection with full CRUD operations</div>
                    </a>
                </div>

                <div class="nav-card">
                    <a href="/authors">
                        <div class="nav-icon">✍️</div>
                        <div class="nav-title">Authors API</div>
                        <div class="nav-desc">Keep track of authors and their information</div>
                    </a>
                </div>

                <div class="nav-card">
                    <a href="/api-docs">
                        <div class="nav-icon">📋</div>
                        <div class="nav-title">API Documentation</div>
                        <div class="nav-desc">Interactive Swagger documentation for all endpoints</div>
                    </a>
                </div>

                <div class="nav-card">
                    <a href="/debug/env">
                        <div class="nav-icon">🔧</div>
                        <div class="nav-title">Debug Environment</div>
                        <div class="nav-desc">System status and configuration details</div>
                    </a>
                </div>
            </div>

            <div class="footer">
                <p>Built with ❤️ using Node.js, Express & MongoDB</p>
                ${user ? `<p style="margin-top: 10px;">Logged in as: <strong>${user.username || user.displayName}</strong></p>` : ''}
            </div>
        </div>
    </div>
</body>
</html>
  `;

  res.send(html);
});

router.use('/books', require('./books'));
router.use('/authors', require('./authors'));

// Temporary authentication bypass for testing - REMOVE THIS LATER
router.get('/temp-login', (req, res) => {
  // Temporary bypass for testing - remove this later
  req.session.user = {
    username: 'TestUser',
    displayName: 'Test User',
    id: '12345'
  };
  
  req.session.save((err) => {
    if (err) {
      console.error('Session save error:', err);
      return res.redirect('/?error=login_failed');
    }
    console.log('✅ Temporary session created');
    res.redirect('/');
  });
});

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
const { isAuthenticated } = require('../middleware/authenticate'); // Add this line

router.get('/debug/env', isAuthenticated, (req, res) => { // Add isAuthenticated here
  if (process.env.NODE_ENV === 'production') {
    // Still good to keep this check, even if authenticated,
    // as debug info might not be desired in prod at all.
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
