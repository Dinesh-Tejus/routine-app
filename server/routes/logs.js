const express = require('express');
const router = express.Router();
const DailyLog = require('../models/DailyLog');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/:date', async (req, res) => {
  try {
    const log = await DailyLog.findOne({
      date: req.params.date,
      userId: req.user.userId
    });
    res.json(log || {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const log = await DailyLog.findOneAndUpdate(
      { date: req.body.date, userId: req.user.userId },
      { ...req.body, userId: req.user.userId },
      { new: true, upsert: true }
    );
    res.json(log);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;