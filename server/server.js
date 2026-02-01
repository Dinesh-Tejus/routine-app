require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const { server: log } = require('./utils/logger');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const userId = req.user?.userId || 'anonymous';
    log.info(`${req.method} ${req.originalUrl} ${res.statusCode}`, {
      userId,
      duration: `${duration}ms`,
      ip: req.ip
    });
  });
  next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/goals', require('./routes/goals'));
app.use('/api/scheduled', require('./routes/scheduled'));
app.use('/api/logs', require('./routes/logs'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/reflection', require('./routes/reflection'));
app.use('/api/planner', require('./routes/planner'));
app.use('/api/research', require('./routes/research'));

// Global error handler
app.use((err, req, res, next) => {
    log.error('Unhandled error', {
      error: err.message,
      stack: err.stack,
      path: req.originalUrl,
      method: req.method
    });
    res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  log.info(`Server started on port ${PORT}`, {
    env: process.env.NODE_ENV || 'development',
    logLevel: process.env.LOG_LEVEL || 'info'
  });
});