const express = require('express');
const router = express.Router();
const ScheduledTask = require('../models/ScheduledTask');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const tasks = await ScheduledTask.find({ userId: req.user.userId }).sort({ date: 1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const task = new ScheduledTask({
      ...req.body,
      userId: req.user.userId
    });
    await task.save();
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const task = await ScheduledTask.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      req.body,
      { new: true }
    );
    if (!task) return res.status(404).json({ message: 'Scheduled task not found' });
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const task = await ScheduledTask.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId
    });
    if (!task) return res.status(404).json({ message: 'Scheduled task not found' });
    res.json({ message: 'Scheduled task deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
