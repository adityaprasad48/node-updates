const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const router = express.Router();

const ACCESS_SECRET = process.env.ACCESS_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET;

// Register
router.post('/register', async (req, res) => {
  const { username, password, role } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ username, password: hashedPassword, role });
  await user.save();
  res.status(201).send('User registered');
});

// Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  console.log('Login attempt for:', username);
  if (!username || !password) return res.status(400).send('Username and password required');
  const user = await User.findOne({ username });
  if (!user) return res.status(400).send('Invalid credentials');

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).send('Invalid credentials');

  const accessToken = jwt.sign({ username, role: user.role }, ACCESS_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ username }, REFRESH_SECRET);

  user.refreshToken = refreshToken;
  await user.save();

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: true, // ✅ Use true in production (HTTPS)
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });


  res.json({ accessToken, refreshToken });
});

// Token Refresh
router.post('/token', async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) return res.sendStatus(401);
  const refreshToken = token;
  const user = await User.findOne({ refreshToken });
  if (!user) return res.sendStatus(403);

  jwt.verify(refreshToken, REFRESH_SECRET, (err, decoded) => {
    if (err) return res.sendStatus(403);
    const accessToken = jwt.sign({ username: decoded.username, role: user.role }, ACCESS_SECRET, { expiresIn: '15m' });
    res.json({ accessToken });
  });
});


router.post('/logout', async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) return res.sendStatus(204); // No token = already logged out

  try {
    const decoded = jwt.verify(token, process.env.REFRESH_SECRET);
    await User.findOneAndUpdate({ username: decoded.username }, { refreshToken: null });

    res.clearCookie('refreshToken', {
      httpOnly: true,
      sameSite: 'strict',
      secure: true, // Set to true if using HTTPS
    });

    res.send('Logged out successfully');
  } catch (err) {
    // Invalid token — still clear cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      sameSite: 'strict',
      secure: true,
    });
    res.send('Logged out');
  }
});
module.exports = router;

// Access Token
// API Access
// JWT Signature + Claims
// All API calls

// Refresh Token
// Session Refresh
// JWT Signature + DB Match
// /auth/token route only
