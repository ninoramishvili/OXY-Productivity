const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

// Register endpoint
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  // Validate input
  if (!name || !email || !password) {
    return res.status(400).json({ 
      success: false, 
      message: 'Name, email, and password are required' 
    });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid email format' 
    });
  }

  // Validate password length
  if (password.length < 6) {
    return res.status(400).json({ 
      success: false, 
      message: 'Password must be at least 6 characters' 
    });
  }

  try {
    // Check if email already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ 
        success: false, 
        message: 'Email already registered' 
      });
    }

    // Create new user
    const result = await query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email, created_at',
      [name, email, password]
    );

    const user = result.rows[0];

    // Create session token
    const token = `session_${user.id}_${Date.now()}`;
    
    // Store session in database
    await query(
      'INSERT INTO sessions (user_id, token) VALUES ($1, $2)',
      [user.id, token]
    );

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      user,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during registration' 
    });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    return res.status(400).json({ 
      success: false, 
      message: 'Email and password are required' 
    });
  }

  try {
    // Find user in database
    const result = await query(
      'SELECT * FROM users WHERE email = $1 AND password = $2',
      [email, password]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    const user = result.rows[0];

    // Create session token
    const token = `session_${user.id}_${Date.now()}`;
    
    // Store session in database
    await query(
      'INSERT INTO sessions (user_id, token) VALUES ($1, $2)',
      [user.id, token]
    );

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
      success: true,
      message: 'Login successful',
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during login' 
    });
  }
});

// Logout endpoint
router.post('/logout', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (token) {
    try {
      await query('DELETE FROM sessions WHERE token = $1', [token]);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  res.json({ 
    success: true, 
    message: 'Logout successful' 
  });
});

// Verify token middleware
const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'No token provided' 
    });
  }

  try {
    // Check if session exists and is valid
    const result = await query(
      'SELECT user_id FROM sessions WHERE token = $1 AND expires_at > NOW()',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid or expired token' 
      });
    }

    req.userId = result.rows[0].user_id;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during authentication' 
    });
  }
};

module.exports = { router, verifyToken };
