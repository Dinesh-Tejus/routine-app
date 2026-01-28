const mongoose = require('mongoose');

const dailyLogSchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true },
  workedOn: { type: String, default: '' },
  finished: { type: String, default: '' },
  feedback: { type: String, default: '' },
  tomorrowNotes: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('DailyLog', dailyLogSchema);