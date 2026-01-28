const mongoose = require('mongoose');

const weeklyGoalSchema = new mongoose.Schema({
  text: { type: String, required: true },
  completed: { type: Boolean, default: false },
  notes: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('WeeklyGoal', weeklyGoalSchema);