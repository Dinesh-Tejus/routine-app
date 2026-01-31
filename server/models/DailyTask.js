const mongoose = require('mongoose');

const dailyTaskSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  text: { type: String, required: true },
  isEveryday: { type: Boolean, default: false },
  completed: { type: Boolean, default: false },
  notes: { type: String, default: '' },
  date: { type: String, required: true },
  fromScheduled: { type: Boolean, default: false },
  streak: { type: Number, default: 0 },
  lastCompletedDate: { type: String, default: null },
  isLocked: { type: Boolean, default: false },
  unlockCriteria: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('DailyTask', dailyTaskSchema);