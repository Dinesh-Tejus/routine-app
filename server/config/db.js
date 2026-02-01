const mongoose = require('mongoose');
const { db: log } = require('../utils/logger');

const connectDB = async () => {
  try {
    log.info('Attempting to connect to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    log.success('MongoDB connection established');

    mongoose.connection.on('error', (err) => {
      log.error('MongoDB connection error', { error: err.message });
    });

    mongoose.connection.on('disconnected', () => {
      log.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      log.info('MongoDB reconnected');
    });

  } catch (error) {
    log.failure('MongoDB connection', error);
    process.exit(1);
  }
};

module.exports = connectDB;
