const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../config/database');
const { sendOTP } = require('../utils/mailer');
const router = express.Router();

// Helper to generate a 6 digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    const pool = getDb();
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      const result = await pool.query(
        'INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING id, email, name',
        [email, hashedPassword, name]
      );
      
      const user = result.rows[0];

      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET || 'your-secret-key-change-in-production',
        { expiresIn: '7d' }
      );

      res.status(201).json({
        message: 'User registered successfully',
        token,
        user
      });
    } catch (err) {
      if (err.code === '23505') { // Postgres unique constraint violation
        return res.status(400).json({ error: 'Email already registered' });
      }
      throw err;
    }
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Step 1: Login (Password verification + sending OTP)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const pool = getDb();
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate and save OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60000); // 10 minutes

    await pool.query(
      'UPDATE users SET otp = $1, otp_expiry = $2 WHERE id = $3',
      [otp, otpExpiry, user.id]
    );

    // Send OTP via email
    await sendOTP(user.email, otp);

    res.json({
      message: 'OTP sent to email. Please verify to complete login.',
      requiresOTP: true,
      email: user.email
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Step 2: Verify OTP to complete login
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    const pool = getDb();
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid request' });
    }

    if (user.otp !== otp || new Date() > new Date(user.otp_expiry)) {
      return res.status(401).json({ error: 'Invalid or expired OTP' });
    }

    // Clear OTP
    await pool.query('UPDATE users SET otp = NULL, otp_expiry = NULL WHERE id = $1', [user.id]);

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, email: user.email, name: user.name }
    });
  } catch (error) {
    console.error('OTP Verification error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
