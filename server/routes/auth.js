import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../config/database.js';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    //const db = await connectDB();

    // Check if user exists
    const [existingUsers] = await db.execute(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email or username'
      });
    }

    // Check if it's the super admin email
    // const isSuperAdmin = email === 'athamaraiselvan694@gmail.com';
    const initialRole = 'user';
    const initialStatus = 'approved' ;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const [result] = await db.execute(
      'INSERT INTO users (username, email, password, role, status) VALUES (?, ?, ?, ?, ?)',
      [username, email, hashedPassword, initialRole, initialStatus]
    );

    // Generate token only if approved (Super Admin)
    let token = null;
    if (initialStatus === 'approved') {
      token = jwt.sign(
        { userId: result.insertId, role: initialRole },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );
    }

    // Seed default categories for the new user
    const defaultCategories = [
      { name: 'Salary', type: 'income', color: '#10B981' },
      { name: 'Freelance', type: 'income', color: '#3B82F6' },
      { name: 'Investments', type: 'income', color: '#8B5CF6' },
      { name: 'Other Income', type: 'income', color: '#6B7280' },
      { name: 'Food & Dining', type: 'expense', color: '#EF4444' },
      { name: 'Transportation', type: 'expense', color: '#F59E0B' },
      { name: 'Shopping', type: 'expense', color: '#EC4899' },
      { name: 'Entertainment', type: 'expense', color: '#8B5CF6' },
      { name: 'Bills & Utilities', type: 'expense', color: '#6366F1' },
      { name: 'Health & Fitness', type: 'expense', color: '#14B8A6' },
      { name: 'Travel', type: 'expense', color: '#0EA5E9' },
      { name: 'Education', type: 'expense', color: '#F97316' },
      { name: 'Personal Care', type: 'expense', color: '#D946EF' },
      { name: 'Gifts & Donations', type: 'expense', color: '#FB7185' },
      { name: 'Other Expense', type: 'expense', color: '#6B7280' }
    ];

    try {
      const values = defaultCategories.map(c => [result.insertId, c.name, c.type, c.color]);
      await db.query(
        'INSERT INTO categories (user_id, name, type, color) VALUES ?',
        [values]
      );
    } catch (seedError) {
      console.error('Failed to seed default categories:', seedError);
      // Don't fail the registration, just log it
    }

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token, // Will be null for normal users
      user: {
        id: result.insertId,
        username,
        email,
        role: initialRole,
        status: initialStatus,
        user_image: null
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed'
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    //const db = await connectDB();

    // Find user
    const [users] = await db.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const user = users[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // // ✅ CHECK STATUS (Unless it's the Super Admin logic-fail-safe)
    // if (user.status !== 'approved' && user.email !== 'athamaraiselvan694@gmail.com') {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'Your account is pending approval. Please contact the Admin.'
    //   });
    // }

    // Generate token
    const token = jwt.sign(
      { userId: user.id, role: user.role || 'user' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        user_image: user.user_image
      }
    });


  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
});

// Get current user profile
router.get('/profile', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ success: false, message: 'Access denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const [users] = await db.execute(
      'SELECT id, username, email, role, status, user_image FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user: users[0] });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
});

export default router;