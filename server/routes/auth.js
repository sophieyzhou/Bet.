const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const router = express.Router();

// Local signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      provider: 'local',
      name,
      email,
      passwordHash,
    });

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'your-jwt-secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      token,
      user: { id: user._id, email: user.email, name: user.name, profilePicture: user.profilePicture }
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Signup failed' });
  }
});

// Local login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'your-jwt-secret',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: { id: user._id, email: user.email, name: user.name, profilePicture: user.profilePicture }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Google OAuth login (redirect back using OAuth state)
router.get('/google', (req, res, next) => {
  const redirectUri = req.query.redirect_uri;
  const options = { scope: ['profile', 'email'] };
  if (redirectUri) options.state = encodeURIComponent(redirectUri);
  return passport.authenticate('google', options)(req, res, next);
});

// Google OAuth callback
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  async (req, res) => {
    try {
      // Generate JWT token
      const token = jwt.sign(
        { userId: req.user._id, email: req.user.email },
        process.env.JWT_SECRET || 'your-jwt-secret',
        { expiresIn: '7d' }
      );
      // If a state (redirect_uri) was provided, redirect back with token
      const appRedirect = req.query.state ? decodeURIComponent(req.query.state) : undefined;
      if (appRedirect) {
        return res.redirect(`${appRedirect}${appRedirect.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}`);
      }

      // Fallback: Send HTML page with token for manual copy
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Authentication Success</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .success { color: #4CAF50; }
            .token { background: #f5f5f5; padding: 15px; margin: 20px; border-radius: 5px; word-break: break-all; font-family: monospace; }
            .info { color: #666; margin: 20px 0; }
            .copy-btn { background: #4CAF50; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin: 10px; }
            .copy-btn:hover { background: #45a049; }
          </style>
        </head>
        <body>
          <h1 class="success">✅ Authentication Successful!</h1>
          <p class="info">Please copy this token and paste it in your mobile app:</p>
          <div class="token" id="token">${token}</div>
          <button class="copy-btn" onclick="copyToken()">Copy Token</button>
          <p class="info">User: ${req.user.name} (${req.user.email})</p>
          <p class="info">Go back to your mobile app and paste the token when prompted.</p>
          
          <script>
            function copyToken() {
              const tokenElement = document.getElementById('token');
              navigator.clipboard.writeText(tokenElement.textContent).then(() => {
                alert('Token copied to clipboard!');
              });
            }
          </script>
        </body>
        </html>
      `);
    } catch (error) {
      console.error('Auth callback error:', error);
      res.status(500).send('Authentication failed');
    }
  }
);

// Verify token endpoint
router.post('/verify', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-jwt-secret');
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.json({ 
      success: true, 
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

module.exports = router;
