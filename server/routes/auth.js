const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const { auth: log } = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';
const JWT_EXPIRES_IN = '7d'; // Token expires in 7 days

// Register new user
router.post('/register', async (req, res) => {
    try {
        const { userId, password } = req.body;
        log.info('Registration attempt', { userId });

        // Validation
        if (!userId || !password) {
            log.warn('Registration failed - missing credentials', { userId });
            return res.status(400).json({ error: 'UserId and password are required' });
        }

        if (userId.length < 3) {
            log.warn('Registration failed - userId too short', { userId, length: userId.length });
            return res.status(400).json({ error: 'UserId must be at least 3 characters' });
        }

        if (password.length < 6) {
            log.warn('Registration failed - password too short', { userId });
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ userId });
        if (existingUser) {
            log.warn('Registration failed - user already exists', { userId });
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

        log.success('User registered', { userId });
        res.json({
            success: true,
            user: { userId: user.userId },
            token
        });
    } catch (error) {
        log.failure('User registration', error, { userId: req.body?.userId });
        res.status(500).json({ error: 'Failed to register user' });
    }
});

// Login user
router.post('/login', async (req, res) => {
    try {
        const { userId, password } = req.body;
        log.info('Login attempt', { userId });

        // Validation
        if (!userId || !password) {
            log.warn('Login failed - missing credentials', { userId });
            return res.status(400).json({ error: 'UserId and password are required' });
        }

        // Find user
        const user = await User.findOne({ userId });
        if (!user) {
            log.warn('Login failed - user not found', { userId });
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Validate password
        if (!user.validatePassword(password)) {
            log.warn('Login failed - invalid password', { userId });
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

        log.success('User logged in', { userId });
        res.json({
            success: true,
            user: { userId: user.userId },
            token
        });
    } catch (error) {
        log.failure('User login', error, { userId: req.body?.userId });
        res.status(500).json({ error: 'Failed to login' });
    }
});

// Logout user
router.post('/logout', (req, res) => {
    const userId = req.user?.userId || 'unknown';
    log.info('User logged out', { userId });
    res.clearCookie('token');
    res.json({ success: true });
});

// Get current user
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-passwordHash -salt');
        if (!user) {
            log.warn('Get user failed - user not found', { userId: req.user.userId });
            return res.status(404).json({ error: 'User not found' });
        }
        log.debug('User session validated', { userId: user.userId });
        res.json({ user: { userId: user.userId } });
    } catch (error) {
        log.failure('Get current user', error, { userId: req.user?.userId });
        res.status(500).json({ error: 'Failed to get user' });
    }
});

module.exports = router;
