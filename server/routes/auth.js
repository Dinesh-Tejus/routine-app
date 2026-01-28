const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';
const JWT_EXPIRES_IN = '7d'; // Token expires in 7 days

// Register new user
router.post('/register', async (req, res) => {
    try {
        const { userId, password } = req.body;

        // Validation
        if (!userId || !password) {
            return res.status(400).json({ error: 'UserId and password are required' });
        }

        if (userId.length < 3) {
            return res.status(400).json({ error: 'UserId must be at least 3 characters' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ userId });
        if (existingUser) {
            return res.status(400).json({ error: 'UserId already exists' });
        }

        // Create new user
        const user = new User({ userId });
        user.setPassword(password);
        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id, userId: user.userId },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        // Set cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.json({
            success: true,
            user: { userId: user.userId },
            token
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Failed to register user' });
    }
});

// Login user
router.post('/login', async (req, res) => {
    try {
        const { userId, password } = req.body;

        // Validation
        if (!userId || !password) {
            return res.status(400).json({ error: 'UserId and password are required' });
        }

        // Find user
        const user = await User.findOne({ userId });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Validate password
        if (!user.validatePassword(password)) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id, userId: user.userId },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        // Set cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.json({
            success: true,
            user: { userId: user.userId },
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Failed to login' });
    }
});

// Logout user
router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ success: true });
});

// Get current user
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-passwordHash -salt');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ user: { userId: user.userId } });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user' });
    }
});

module.exports = router;
