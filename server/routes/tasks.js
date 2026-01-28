const express = require('express');
const router = express.Router();
const DailyTask = require('../models/DailyTask');

// Get all tasks for today (including everyday tasks)
router.get('/', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const tasks = await DailyTask.find({
      $or: [
        { date: today },
        { isEveryday: true }
      ]
    });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new task
router.post('/', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const task = new DailyTask({ ...req.body, date: today });
    await task.save();
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update task
router.put('/:id', async (req, res) => {
  try {
    const task = await DailyTask.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete task
router.delete('/:id', async (req, res) => {
  try {
    await DailyTask.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;