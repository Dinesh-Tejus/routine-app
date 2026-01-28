const express = require('express');
const router = express.Router();
const DailyLog = require('../models/DailyLog');

router.get('/:date', async (req, res) => {
  try {
    const log = await DailyLog.findOne({ date: req.params.date });
    res.json(log || {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const log = await DailyLog.findOneAndUpdate(
      { date: req.body.date },
      req.body,
      { new: true, upsert: true }
    );
    res.json(log);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;