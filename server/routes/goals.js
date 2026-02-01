const express = require('express');
const router = express.Router();
const WeeklyGoal = require('../models/WeeklyGoal');
const auth = require('../middleware/auth');
const { goals: log } = require('../utils/logger');

router.use(auth);

router.get('/', async (req, res) => {
  try {
    log.info('Fetching goals', { userId: req.user.userId });
    const goals = await WeeklyGoal.find({ userId: req.user.userId });
    log.success('Goals fetched', { userId: req.user.userId, count: goals.length });
    res.json(goals);
  } catch (error) {
    log.failure('Fetch goals', error, { userId: req.user.userId });
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { text } = req.body;
    log.info('Creating goal', { userId: req.user.userId, text });

    if (!text || typeof text !== 'string' || !text.trim()) {
      log.warn('Create goal failed - missing text', { userId: req.user.userId });
      return res.status(400).json({ error: 'Goal text is required' });
    }

    const goal = new WeeklyGoal({
      ...req.body,
      userId: req.user.userId
    });
    await goal.save();

    log.success('Goal created', { userId: req.user.userId, goalId: goal._id, text: goal.text });
    res.json(goal);
  } catch (error) {
    log.failure('Create goal', error, { userId: req.user.userId, text: req.body?.text });
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const goalId = req.params.id;
    log.info('Updating goal', { userId: req.user.userId, goalId, completed: req.body.completed });

    const goal = await WeeklyGoal.findOneAndUpdate(
      { _id: goalId, userId: req.user.userId },
      req.body,
      { new: true }
    );

    if (!goal) {
      log.warn('Update goal failed - not found', { userId: req.user.userId, goalId });
      return res.status(404).json({ message: 'Goal not found' });
    }

    log.success('Goal updated', { userId: req.user.userId, goalId, text: goal.text });
    res.json(goal);
  } catch (error) {
    log.failure('Update goal', error, { userId: req.user.userId, goalId: req.params.id });
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const goalId = req.params.id;
    log.info('Deleting goal', { userId: req.user.userId, goalId });

    const goal = await WeeklyGoal.findOneAndDelete({
      _id: goalId,
      userId: req.user.userId
    });

    if (!goal) {
      log.warn('Delete goal failed - not found', { userId: req.user.userId, goalId });
      return res.status(404).json({ message: 'Goal not found' });
    }

    log.success('Goal deleted', { userId: req.user.userId, goalId, text: goal.text });
    res.json({ message: 'Goal deleted' });
  } catch (error) {
    log.failure('Delete goal', error, { userId: req.user.userId, goalId: req.params.id });
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
