const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();
// app.use(cors());
app.use(express.json());
app.use(cookieParser());


mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
.then(() => console.log('MongoDB connected'))
.catch(err => console.log(err));

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

app.get('/', (req, res) => res.send('API Running'));

const taskRoutes = require('./routes/tasks');
app.use('/api/tasks', taskRoutes);

const authRoutes = require('./routes/auth');
const { authenticateToken, authorizeRoles } = require('./middleware');
app.use('/node_api/auth', authRoutes);

app.get('/node_api/profile', authenticateToken, (req, res) => {
  res.send(`Welcome ${req.user.username}`);
});

app.get('/node_api/admin', authenticateToken, authorizeRoles('admin'), (req, res) => {
  res.send('Admin Access Granted');
});

// GET /api/tasks
// POST /api/tasks
// PUT /api/tasks/:id
// DELETE /api/tasks/:id

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
