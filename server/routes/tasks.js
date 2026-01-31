const express = require('express');
const router = express.Router();
const DailyTask = require('../models/DailyTask');
const auth = require('../middleware/auth');
const { getAdjustedDate, getAdjustedYesterday, getStartOfWeek } = require('../utils/dateUtils');
const { GoogleGenAI } = require("@google/genai");

// Initialize Gemini AI for lock validation
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Apply auth middleware to all task routes
router.use(auth);

// Get all tasks for today (including everyday tasks)
router.get('/', async (req, res) => {
  try {
    const today = getAdjustedDate();
    const yesterday = getAdjustedYesterday();

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
          task.streak = 0;
          changed = true;
        }

        if (task.completed && task.lastCompletedDate !== today) {
          task.completed = false;
          changed = true;
        }

        if (changed) {
          await task.save();
        }
      }
      return task;
    }));

    res.json(updatedTasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get completed tasks for the current week
router.get('/history/weekly', async (req, res) => {
  try {
    const startOfWeek = getStartOfWeek();
    const tasks = await DailyTask.find({
      userId: req.user.userId,
      completed: true,
      lastCompletedDate: { $gte: startOfWeek }
    });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new task
router.post('/', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Task text is required' });
    }

    const today = getAdjustedDate();
    const task = new DailyTask({
      ...req.body,
      date: today,
      userId: req.user.userId
    });
    await task.save();
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Validate lock criteria using LLM
router.post('/validate-lock', async (req, res) => {
  try {
    const { criteria, notes } = req.body;
    if (!criteria || !notes) {
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

    res.json(result);
  } catch (error) {
    console.error('Lock validation error:', error);
    res.status(503).json({
      error: 'Validation service unavailable',
      allowOverride: true
    });
  }
});

// Update task
router.put('/:id', async (req, res) => {
  try {
    const task = await DailyTask.findOne({ _id: req.params.id, userId: req.user.userId });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Prevent removing lock once set
    if (task.isLocked && req.body.isLocked === false) {
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
        } else if (task.lastCompletedDate === today) {
          // Already completed today, no streak change needed (idempotent)
        } else {
          // Streak broken or new
          task.streak = 1;
        }
        task.lastCompletedDate = today;
      } else if (!req.body.completed && task.completed) {
        // Unmarking (undo)
        if (task.lastCompletedDate === today) {
          // Revert streak
          if (task.streak > 0) task.streak -= 1;
          task.lastCompletedDate = task.streak > 0 ? yesterday : null;
        }
      }
    }

    // Update other fields
    delete req.body.streak;
    delete req.body.lastCompletedDate;
    Object.assign(task, req.body);

    // Explicitly re-set the calculated values to ensure they persist
    // (In case I decide to move Object.assign up later, this logic is safer if structured well, 
    // but deleting from req.body is cleaner given the current structure).

    await task.save();
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete task
router.delete('/:id', async (req, res) => {
  try {
    const result = await DailyTask.findOneAndDelete({ _id: req.params.id, userId: req.user.userId });
    if (!result) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;