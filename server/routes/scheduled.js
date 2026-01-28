const express = require('express');
const router = express.Router();
const ScheduledTask = require('../models/ScheduledTask');

router.get('/', async (req, res) => {
  try {
    const tasks = await ScheduledTask.find().sort({ date: 1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const task = new ScheduledTask(req.body);
    await task.save();
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await ScheduledTask.findByIdAndDelete(req.params.id);
    res.json({ message: 'Scheduled task deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
