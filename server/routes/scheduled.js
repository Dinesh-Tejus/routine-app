const express = require('express');
const router = express.Router();
const ScheduledTask = require('../models/ScheduledTask');
const DailyTask = require('../models/DailyTask');
const auth = require('../middleware/auth');
const { getAdjustedDate } = require('../utils/dateUtils');
const { scheduled: log } = require('../utils/logger');

router.use(auth);

// Sync past-due scheduled tasks to daily tasks
router.post('/sync', async (req, res) => {
  try {
    const today = getAdjustedDate();
    const todayNoon = new Date(today + 'T12:00:00');
    const userId = req.user.userId;

    log.info('Syncing past-due scheduled tasks', { userId, today });

    // Find all scheduled tasks where date <= today (past-due and today's)
    const pastDueTasks = await ScheduledTask.find({
      userId,
      date: { $lt: todayNoon }
    });

    const converted = [];
    for (const task of pastDueTasks) {
      try {
        // Determine the date string for the daily task
        const taskDate = new Date(task.date);
        const dateStr = `${taskDate.getFullYear()}-${String(taskDate.getMonth() + 1).padStart(2, '0')}-${String(taskDate.getDate()).padStart(2, '0')}`;

        const dailyTask = new DailyTask({
          text: task.text,
          isEveryday: false,
          completed: false,
          notes: '',
          date: dateStr,
          fromScheduled: true,
          userId
        });
        await dailyTask.save();
        await ScheduledTask.findByIdAndDelete(task._id);
        converted.push(dailyTask);
      } catch (err) {
        log.warn('Failed to convert scheduled task', { taskId: task._id, error: err.message });
      }
    }

    // Get remaining scheduled tasks
    const remaining = await ScheduledTask.find({ userId }).sort({ date: 1 });

    log.success('Scheduled tasks synced', { userId, convertedCount: converted.length, remainingCount: remaining.length });
    res.json({ converted, remaining });
  } catch (error) {
    log.failure('Sync scheduled tasks', error, { userId: req.user.userId });
    res.status(500).json({ error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    log.info('Fetching scheduled tasks', { userId: req.user.userId });
    const tasks = await ScheduledTask.find({ userId: req.user.userId }).sort({ date: 1 });
    log.success('Scheduled tasks fetched', { userId: req.user.userId, count: tasks.length });
    res.json(tasks);
  } catch (error) {
    log.failure('Fetch scheduled tasks', error, { userId: req.user.userId });
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { text, date } = req.body;
    log.info('Creating scheduled task', { userId: req.user.userId, text, date });

    if (!text || typeof text !== 'string' || !text.trim()) {
      log.warn('Create scheduled task failed - missing text', { userId: req.user.userId });
      return res.status(400).json({ error: 'Task text is required' });
    }

    const task = new ScheduledTask({
      ...req.body,
      userId: req.user.userId
    });
    await task.save();

    log.success('Scheduled task created', { userId: req.user.userId, taskId: task._id, text, date });
    res.json(task);
  } catch (error) {
    log.failure('Create scheduled task', error, { userId: req.user.userId, text: req.body?.text });
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const taskId = req.params.id;
    log.info('Updating scheduled task', { userId: req.user.userId, taskId, date: req.body.date });

    const task = await ScheduledTask.findOneAndUpdate(
      { _id: taskId, userId: req.user.userId },
      req.body,
      { new: true }
    );

    if (!task) {
      log.warn('Update scheduled task failed - not found', { userId: req.user.userId, taskId });
      return res.status(404).json({ message: 'Scheduled task not found' });
    }

    log.success('Scheduled task updated', { userId: req.user.userId, taskId, text: task.text });
    res.json(task);
  } catch (error) {
    log.failure('Update scheduled task', error, { userId: req.user.userId, taskId: req.params.id });
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const taskId = req.params.id;
    log.info('Deleting scheduled task', { userId: req.user.userId, taskId });

    const task = await ScheduledTask.findOneAndDelete({
      _id: taskId,
      userId: req.user.userId
    });

    if (!task) {
      log.warn('Delete scheduled task failed - not found', { userId: req.user.userId, taskId });
      return res.status(404).json({ message: 'Scheduled task not found' });
    }

    log.success('Scheduled task deleted', { userId: req.user.userId, taskId, text: task.text });
    res.json({ message: 'Scheduled task deleted' });
  } catch (error) {
    log.failure('Delete scheduled task', error, { userId: req.user.userId, taskId: req.params.id });
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
