const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const passport = require('passport');
const session = require('express-session');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const groupRoutes = require('./routes/groups');
const eventRoutes = require('./routes/events');
const { initializePassport } = require('./middleware/auth');
const { initializeRealtime } = require('./services/realtime');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:8081',
  'http://localhost:8082',
  'http://localhost:3001',
  'http://localhost:19006', // Expo web development server
  'http://localhost:19000',  // Alternative Expo web port
  'http://localhost:19007'   // Second Expo web instance
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true in production with HTTPS
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Initialize passport strategies
initializePassport();

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bet', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/events', eventRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Create HTTP server and initialize realtime (Socket.IO)
const server = http.createServer(app);
initializeRealtime(server, { origins: allowedOrigins });

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
