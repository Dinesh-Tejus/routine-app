const express = require('express');
const router = express.Router();
const DailyTask = require('../models/DailyTask');
const auth = require('../middleware/auth');
const { getAdjustedDate, getAdjustedYesterday, getStartOfWeek } = require('../utils/dateUtils');
const { GoogleGenAI } = require("@google/genai");
const { tasks: log } = require('../utils/logger');

// Initialize Gemini AI for lock validation
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Apply auth middleware to all task routes
router.use(auth);

// Get all tasks for today (including everyday tasks)
router.get('/', async (req, res) => {
  try {
    const today = getAdjustedDate();
    const yesterday = getAdjustedYesterday();
    log.info('Fetching tasks', { userId: req.user.userId, date: today });

    const tasks = await DailyTask.find({
      userId: req.user.userId,
      $or: [
        { date: today },
        { isEveryday: true }
      ]
    });

    // Update streak logic for everyday tasks
    const updatedTasks = await Promise.all(tasks.map(async (task) => {
      if (task.isEveryday) {
        let changed = false;

        // Reset streak if last completed before yesterday
        if (task.streak > 0 && task.lastCompletedDate && task.lastCompletedDate < yesterday) {
          log.info('Resetting streak for task', { taskId: task._id, taskText: task.text, oldStreak: task.streak });
          task.streak = 0;
          changed = true;
        }

        if (task.completed && task.lastCompletedDate !== today) {
          log.debug('Resetting daily task completion', { taskId: task._id });
          task.completed = false;
          changed = true;
        }

        if (changed) {
          await task.save();
        }
      }
      return task;
    }));

    log.success('Tasks fetched', { userId: req.user.userId, count: updatedTasks.length });
    res.json(updatedTasks);
  } catch (error) {
    log.failure('Fetch tasks', error, { userId: req.user.userId });
    res.status(500).json({ error: error.message });
  }
});

// Get tasks for a specific date (supports ±2 weeks navigation)
router.get('/date/:date', async (req, res) => {
  try {
    const requestedDate = req.params.date;
    const today = getAdjustedDate();

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(requestedDate)) {
      log.warn('Invalid date format', { userId: req.user.userId, date: requestedDate });
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    // Validate date is within ±2 weeks
    const todayDate = new Date(today + 'T12:00:00');
    const reqDate = new Date(requestedDate + 'T12:00:00');
    const diffDays = Math.round((reqDate - todayDate) / (1000 * 60 * 60 * 24));

    if (Math.abs(diffDays) > 14) {
      log.warn('Date out of range', { userId: req.user.userId, date: requestedDate, diffDays });
      return res.status(400).json({ error: 'Date must be within ±2 weeks of today' });
    }

    log.info('Fetching tasks for date', { userId: req.user.userId, date: requestedDate, diffDays });

    const yesterday = getAdjustedYesterday();

    // Always get everyday tasks
    const everydayTasks = await DailyTask.find({
      userId: req.user.userId,
      isEveryday: true
    });

    // Process everyday tasks with streak logic
    const processedEverydayTasks = await Promise.all(everydayTasks.map(async (task) => {
      let changed = false;

      // Reset streak if last completed before yesterday
      if (task.streak > 0 && task.lastCompletedDate && task.lastCompletedDate < yesterday) {
        log.info('Resetting streak for task', { taskId: task._id, taskText: task.text, oldStreak: task.streak });
        task.streak = 0;
        changed = true;
      }

      if (task.completed && task.lastCompletedDate !== today) {
        log.debug('Resetting daily task completion', { taskId: task._id });
        task.completed = false;
        changed = true;
      }

      if (changed) {
        await task.save();
      }

      // For viewing purposes, calculate if task was completed on the requested date
      const taskData = task.toObject();
      if (requestedDate !== today) {
        taskData.wasCompletedOnDate = task.lastCompletedDate === requestedDate;
        // For past dates, show as completed if it was completed on that date
        if (diffDays < 0) {
          taskData.completed = task.lastCompletedDate === requestedDate;
        } else {
          // Future dates: everyday tasks show as incomplete
          taskData.completed = false;
        }
      }

      return taskData;
    }));

    let dateTasks = [];

    if (diffDays < 0) {
      // Past date: Get daily tasks for that specific date
      dateTasks = await DailyTask.find({
        userId: req.user.userId,
        date: requestedDate,
        isEveryday: false
      });
    } else if (diffDays === 0) {
      // Today: Get today's tasks
      dateTasks = await DailyTask.find({
        userId: req.user.userId,
        date: today,
        isEveryday: false
      });
    } else {
      // Future date: Get scheduled tasks for that date
      const ScheduledTask = require('../models/ScheduledTask');
      const startOfDay = new Date(requestedDate + 'T00:00:00');
      const endOfDay = new Date(requestedDate + 'T23:59:59');

      const scheduled = await ScheduledTask.find({
        userId: req.user.userId,
        date: { $gte: startOfDay, $lte: endOfDay }
      });

      // Convert scheduled tasks to a similar format
      dateTasks = scheduled.map(t => ({
        _id: t._id,
        text: t.text,
        date: requestedDate,
        completed: false,
        isEveryday: false,
        isScheduled: true, // Flag to identify scheduled tasks
        notes: ''
      }));
    }

    const allTasks = [...processedEverydayTasks, ...dateTasks];

    log.success('Tasks fetched for date', {
      userId: req.user.userId,
      date: requestedDate,
      everydayCount: processedEverydayTasks.length,
      dateTasksCount: dateTasks.length
    });

    res.json(allTasks);
  } catch (error) {
    log.failure('Fetch tasks for date', error, { userId: req.user.userId, date: req.params.date });
    res.status(500).json({ error: error.message });
  }
});

// Create task for a specific date
router.post('/date/:date', async (req, res) => {
  try {
    const requestedDate = req.params.date;
    const { text, isEveryday } = req.body;
    const today = getAdjustedDate();

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(requestedDate)) {
      log.warn('Invalid date format', { userId: req.user.userId, date: requestedDate });
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    if (!text || typeof text !== 'string' || !text.trim()) {
      log.warn('Create task failed - missing text', { userId: req.user.userId });
      return res.status(400).json({ error: 'Task text is required' });
    }

    // Validate date is within ±2 weeks
    const todayDate = new Date(today + 'T12:00:00');
    const reqDate = new Date(requestedDate + 'T12:00:00');
    const diffDays = Math.round((reqDate - todayDate) / (1000 * 60 * 60 * 24));

    if (Math.abs(diffDays) > 14) {
      log.warn('Date out of range', { userId: req.user.userId, date: requestedDate, diffDays });
      return res.status(400).json({ error: 'Date must be within ±2 weeks of today' });
    }

    log.info('Creating task for date', { userId: req.user.userId, date: requestedDate, text });

    if (diffDays > 0) {
      // Future date: Create as scheduled task
      const ScheduledTask = require('../models/ScheduledTask');
      const scheduledDate = new Date(requestedDate + 'T12:00:00');

      const task = new ScheduledTask({
        text: text.trim(),
        date: scheduledDate,
        userId: req.user.userId
      });
      await task.save();

      log.success('Scheduled task created', { userId: req.user.userId, taskId: task._id, text: task.text, date: requestedDate });
      res.json({
        _id: task._id,
        text: task.text,
        date: requestedDate,
        completed: false,
        isEveryday: false,
        isScheduled: true,
        notes: ''
      });
    } else {
      // Today or past date: Create as daily task
      const task = new DailyTask({
        text: text.trim(),
        isEveryday: isEveryday || false,
        completed: false,
        notes: '',
        date: requestedDate,
        userId: req.user.userId
      });
      await task.save();

      log.success('Task created for date', { userId: req.user.userId, taskId: task._id, text: task.text, date: requestedDate });
      res.json(task);
    }
  } catch (error) {
    log.failure('Create task for date', error, { userId: req.user.userId, date: req.params.date });
    res.status(500).json({ error: error.message });
  }
});

// Get all incomplete tasks from past dates (excluding everyday tasks)
router.get('/incomplete', async (req, res) => {
  try {
    const today = getAdjustedDate();
    log.info('Fetching incomplete tasks', { userId: req.user.userId, today });

    const incompleteTasks = await DailyTask.find({
      userId: req.user.userId,
      isEveryday: false,
      completed: false,
      date: { $lt: today }
    }).sort({ date: -1 });

    log.success('Incomplete tasks fetched', { userId: req.user.userId, count: incompleteTasks.length });
    res.json(incompleteTasks);
  } catch (error) {
    log.failure('Fetch incomplete tasks', error, { userId: req.user.userId });
    res.status(500).json({ error: error.message });
  }
});

// Complete a past task and move it to today
router.post('/:id/complete-today', async (req, res) => {
  try {
    const taskId = req.params.id;
    const { notes } = req.body;
    const today = getAdjustedDate();

    log.info('Completing task today', { userId: req.user.userId, taskId });

    const task = await DailyTask.findOne({ _id: taskId, userId: req.user.userId });
    if (!task) {
      log.warn('Complete task today failed - not found', { userId: req.user.userId, taskId });
      return res.status(404).json({ message: 'Task not found' });
    }

    // Update task: move to today and mark as completed
    task.date = today;
    task.completed = true;
    task.lastCompletedDate = today;
    if (notes !== undefined) {
      task.notes = notes;
    }

    await task.save();

    log.success('Task completed today', { userId: req.user.userId, taskId, text: task.text });
    res.json(task);
  } catch (error) {
    log.failure('Complete task today', error, { userId: req.user.userId, taskId: req.params.id });
    res.status(500).json({ error: error.message });
  }
});

// Get completed tasks for the current week
router.get('/history/weekly', async (req, res) => {
  try {
    const startOfWeek = getStartOfWeek();
    log.info('Fetching weekly history', { userId: req.user.userId, startOfWeek });

    const tasks = await DailyTask.find({
      userId: req.user.userId,
      completed: true,
      lastCompletedDate: { $gte: startOfWeek }
    });

    log.success('Weekly history fetched', { userId: req.user.userId, count: tasks.length });
    res.json(tasks);
  } catch (error) {
    log.failure('Fetch weekly history', error, { userId: req.user.userId });
    res.status(500).json({ error: error.message });
  }
});

// Create new task
router.post('/', async (req, res) => {
  try {
    const { text, isEveryday } = req.body;
    log.info('Creating task', { userId: req.user.userId, text, isEveryday: !!isEveryday });

    if (!text || typeof text !== 'string' || !text.trim()) {
      log.warn('Create task failed - missing text', { userId: req.user.userId });
      return res.status(400).json({ error: 'Task text is required' });
    }

    const today = getAdjustedDate();
    const task = new DailyTask({
      ...req.body,
      date: today,
      userId: req.user.userId
    });
    await task.save();

    log.success('Task created', { userId: req.user.userId, taskId: task._id, text: task.text });
    res.json(task);
  } catch (error) {
    log.failure('Create task', error, { userId: req.user.userId, text: req.body?.text });
    res.status(500).json({ error: error.message });
  }
});

// Validate lock criteria using LLM
router.post('/validate-lock', async (req, res) => {
  try {
    const { criteria, notes } = req.body;
    log.info('Validating lock criteria', { userId: req.user.userId, criteriaLength: criteria?.length });

    if (!criteria || !notes) {
      log.warn('Lock validation failed - missing data', { userId: req.user.userId });
      return res.status(400).json({ error: 'Criteria and notes required' });
    }

    const prompt = `You are a task completion validator.

UNLOCK CRITERIA set by user:
"${criteria}"

USER'S COMPLETION NOTES:
"${notes}"

Determine if the user's notes satisfy the unlock criteria.

Respond with JSON:
{
  "isValid": true/false,
  "explanation": "Brief explanation of why criteria is/isn't met"
}

Be reasonable - if the user's notes reasonably demonstrate they met the criteria, approve it.`;

    const response = await ai.models.generateContent({
      model: "gemini-flash-lite-latest",
      contents: prompt
    });

    const responseText = response.text;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const result = JSON.parse(jsonMatch ? jsonMatch[0] : responseText);

    log.success('Lock validation complete', { userId: req.user.userId, isValid: result.isValid });
    res.json(result);
  } catch (error) {
    log.failure('Lock validation', error, { userId: req.user.userId });
    res.status(503).json({
      error: 'Validation service unavailable',
      allowOverride: true
    });
  }
});

// Update task
router.put('/:id', async (req, res) => {
  try {
    const taskId = req.params.id;
    log.info('Updating task', { userId: req.user.userId, taskId, completed: req.body.completed });

    const task = await DailyTask.findOne({ _id: taskId, userId: req.user.userId });
    if (!task) {
      log.warn('Update task failed - not found', { userId: req.user.userId, taskId });
      return res.status(404).json({ message: 'Task not found' });
    }

    // Prevent removing lock once set
    if (task.isLocked && req.body.isLocked === false) {
      log.warn('Update task failed - cannot remove lock', { userId: req.user.userId, taskId });
      return res.status(400).json({ error: 'Cannot remove lock once set' });
    }

    const today = getAdjustedDate();
    const yesterday = getAdjustedYesterday();

    // Handle streak logic for everyday tasks
    if (task.isEveryday && req.body.completed !== undefined) {
      if (req.body.completed && !task.completed) {
        // Marking as complete
        if (task.lastCompletedDate === yesterday) {
          task.streak += 1;
          log.info('Streak extended', { taskId, newStreak: task.streak });
        } else if (task.lastCompletedDate === today) {
          // Already completed today, no streak change needed (idempotent)
        } else {
          // Streak broken or new
          task.streak = 1;
          log.info('New streak started', { taskId });
        }
        task.lastCompletedDate = today;
      } else if (!req.body.completed && task.completed) {
        // Unmarking (undo)
        if (task.lastCompletedDate === today) {
          // Revert streak
          if (task.streak > 0) task.streak -= 1;
          task.lastCompletedDate = task.streak > 0 ? yesterday : null;
          log.info('Task uncompleted, streak reverted', { taskId, newStreak: task.streak });
        }
      }
    }

    // Update other fields
    delete req.body.streak;
    delete req.body.lastCompletedDate;
    Object.assign(task, req.body);

    await task.save();
    log.success('Task updated', { userId: req.user.userId, taskId, text: task.text });
    res.json(task);
  } catch (error) {
    log.failure('Update task', error, { userId: req.user.userId, taskId: req.params.id });
    res.status(500).json({ error: error.message });
  }
});

// Delete task
router.delete('/:id', async (req, res) => {
  try {
    const taskId = req.params.id;
    log.info('Deleting task', { userId: req.user.userId, taskId });

    const result = await DailyTask.findOneAndDelete({ _id: taskId, userId: req.user.userId });
    if (!result) {
      log.warn('Delete task failed - not found', { userId: req.user.userId, taskId });
      return res.status(404).json({ message: 'Task not found' });
    }

    log.success('Task deleted', { userId: req.user.userId, taskId, text: result.text });
    res.json({ message: 'Task deleted' });
  } catch (error) {
    log.failure('Delete task', error, { userId: req.user.userId, taskId: req.params.id });
    res.status(500).json({ error: error.message });
  }
});

// Add article to task
router.post('/:id/articles', async (req, res) => {
  try {
    const { title, url, status = 'read' } = req.body;
    const taskId = req.params.id;
    log.info('Adding article to task', { userId: req.user.userId, taskId, title, status });

    if (!title || !url) {
      log.warn('Add article failed - missing data', { userId: req.user.userId, taskId });
      return res.status(400).json({ error: 'Title and URL are required' });
    }

    const task = await DailyTask.findOne({ _id: taskId, userId: req.user.userId });
    if (!task) {
      log.warn('Add article failed - task not found', { userId: req.user.userId, taskId });
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check for duplicate URL
    const existingArticle = task.articles.find(a => a.url === url);
    if (existingArticle) {
      log.warn('Add article failed - duplicate', { userId: req.user.userId, taskId, url });
      return res.status(400).json({ error: 'Article already exists in the list' });
    }

    task.articles.push({
      title,
      url,
      status,
      addedAt: new Date()
    });

    await task.save();
    log.success('Article added', { userId: req.user.userId, taskId, title, status });
    res.json(task);
  } catch (error) {
    log.failure('Add article', error, { userId: req.user.userId, taskId: req.params.id });
    res.status(500).json({ error: error.message });
  }
});

// Update article status (move between tabs)
router.patch('/:id/articles/:articleIndex', async (req, res) => {
  try {
    const { articleIndex } = req.params;
    const { status } = req.body;
    const taskId = req.params.id;
    log.info('Updating article status', { userId: req.user.userId, taskId, articleIndex, newStatus: status });

    if (!status || !['read', 'saved'].includes(status)) {
      log.warn('Update article failed - invalid status', { userId: req.user.userId, status });
      return res.status(400).json({ error: 'Valid status (read/saved) is required' });
    }

    const task = await DailyTask.findOne({ _id: taskId, userId: req.user.userId });
    if (!task) {
      log.warn('Update article failed - task not found', { userId: req.user.userId, taskId });
      return res.status(404).json({ message: 'Task not found' });
    }

    const idx = parseInt(articleIndex, 10);
    if (isNaN(idx) || idx < 0 || idx >= task.articles.length) {
      log.warn('Update article failed - invalid index', { userId: req.user.userId, taskId, articleIndex });
      return res.status(400).json({ error: 'Invalid article index' });
    }

    const articleTitle = task.articles[idx].title;
    task.articles[idx].status = status;
    await task.save();

    log.success('Article status updated', { userId: req.user.userId, taskId, articleTitle, newStatus: status });
    res.json(task);
  } catch (error) {
    log.failure('Update article status', error, { userId: req.user.userId, taskId: req.params.id });
    res.status(500).json({ error: error.message });
  }
});

// Delete article from task
router.delete('/:id/articles/:articleIndex', async (req, res) => {
  try {
    const { articleIndex } = req.params;
    const taskId = req.params.id;
    log.info('Deleting article', { userId: req.user.userId, taskId, articleIndex });

    const task = await DailyTask.findOne({ _id: taskId, userId: req.user.userId });
    if (!task) {
      log.warn('Delete article failed - task not found', { userId: req.user.userId, taskId });
      return res.status(404).json({ message: 'Task not found' });
    }

    const idx = parseInt(articleIndex, 10);
    if (isNaN(idx) || idx < 0 || idx >= task.articles.length) {
      log.warn('Delete article failed - invalid index', { userId: req.user.userId, taskId, articleIndex });
      return res.status(400).json({ error: 'Invalid article index' });
    }

    const deletedArticle = task.articles[idx];
    task.articles.splice(idx, 1);
    await task.save();

    log.success('Article deleted', { userId: req.user.userId, taskId, articleTitle: deletedArticle.title });
    res.json(task);
  } catch (error) {
    log.failure('Delete article', error, { userId: req.user.userId, taskId: req.params.id });
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;