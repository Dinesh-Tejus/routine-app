const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  url: { type: String, required: true },
  status: { type: String, enum: ['read', 'saved'], default: 'read' },
  addedAt: { type: Date, default: Date.now }
}, { _id: false });

const dailyTaskSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  text: { type: String, required: true },
  isEveryday: { type: Boolean, default: false },
  completed: { type: Boolean, default: false },
  notes: { type: String, default: '' },
  articles: { type: [articleSchema], default: [] },
  date: { type: String, required: true },
  fromScheduled: { type: Boolean, default: false },
  streak: { type: Number, default: 0 },
  lastCompletedDate: { type: String, default: null },
  isLocked: { type: Boolean, default: false },
  unlockCriteria: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('DailyTask', dailyTaskSchema);