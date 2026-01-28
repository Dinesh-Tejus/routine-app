const mongoose = require('mongoose');

const dailyTaskSchema = new mongoose.Schema({
  text: { type: String, required: true },
  isEveryday: { type: Boolean, default: false },
  completed: { type: Boolean, default: false },
  notes: { type: String, default: '' },
  date: { type: String, required: true },
  fromScheduled: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('DailyTask', dailyTaskSchema);