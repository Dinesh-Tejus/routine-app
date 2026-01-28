const mongoose = require('mongoose');

const scheduledTaskSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  text: { type: String, required: true },
  date: { type: Date, required: true }
}, { timestamps: true });

module.exports = mongoose.model('ScheduledTask', scheduledTaskSchema);