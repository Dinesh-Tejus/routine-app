const mongoose = require('mongoose');

const dailyLogSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  date: { type: String, required: true },
  workedOn: { type: String, default: '' },
  finished: { type: String, default: '' },
  feedback: { type: String, default: '' },
  tomorrowNotes: { type: String, default: '' },
  chatHistory: { type: Array, default: [] },
  searchHistory: { type: Array, default: [] }
}, { timestamps: true });

dailyLogSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyLog', dailyLogSchema);