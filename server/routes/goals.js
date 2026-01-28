const express = require('express');
const router = express.Router();
const WeeklyGoal = require('../models/WeeklyGoal');

router.get('/', async (req, res) => {
  try {
    const goals = await WeeklyGoal.find();
    res.json(goals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const goal = new WeeklyGoal(req.body);
    await goal.save();
    res.json(goal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const goal = await WeeklyGoal.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(goal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await WeeklyGoal.findByIdAndDelete(req.params.id);
    res.json({ message: 'Goal deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
