const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const redis = require('redis');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log('MongoDB connection error:', err));

// Redis Connection
const redisClient = redis.createClient({
  url: process.env.REDIS_URL  // Example: redis://default:mypassword@localhost:6379
});

redisClient.on('error', (err) => console.error('Redis Client Error:', err));

redisClient.connect()
  .then(() => console.log('Redis connected'))
  .catch(err => console.error('Redis connection error:', err));

// Optional: Attach Redis to request object
app.use((req, res, next) => {
  req.redis = redisClient;
  next();
});

// Basic Route
app.get('/', (req, res) => res.send('API Running'));

// Task Routes
const taskRoutes = require('./routes/tasks');
app.use('/api/tasks', taskRoutes);

// Auth Routes + Middleware
const authRoutes = require('./routes/auth');
const { authenticateToken, authorizeRoles } = require('./middleware');
app.use('/node_api/auth', authRoutes);

app.get('/node_api/profile', authenticateToken, (req, res) => {
  res.send(`Welcome ${req.user.username}`);
});

app.get('/node_api/admin', authenticateToken, authorizeRoles('admin'), (req, res) => {
  res.send('Admin Access Granted');
});

// Start Server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));