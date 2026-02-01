const express = require('express');
const router = express.Router();
const DailyLog = require('../models/DailyLog');
const auth = require('../middleware/auth');
const { logs: logger } = require('../utils/logger');

router.use(auth);

router.get('/:date', async (req, res) => {
  try {
    const date = req.params.date;
    logger.info('Fetching daily log', { userId: req.user.userId, date });

    const log = await DailyLog.findOne({
      date,
      userId: req.user.userId
    });

    logger.success('Daily log fetched', { userId: req.user.userId, date, found: !!log });
    res.json(log || {});
  } catch (error) {
    logger.failure('Fetch daily log', error, { userId: req.user.userId, date: req.params.date });
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { date } = req.body;
    logger.info('Saving daily log', {
      userId: req.user.userId,
      date,
      hasWorkedOn: !!req.body.workedOn,
      hasFinished: !!req.body.finished,
      hasTomorrowNotes: !!req.body.tomorrowNotes
    });

    const log = await DailyLog.findOneAndUpdate(
      { date, userId: req.user.userId },
      { ...req.body, userId: req.user.userId },
      { new: true, upsert: true }
    );

    logger.success('Daily log saved', { userId: req.user.userId, date });
    res.json(log);
  } catch (error) {
    logger.failure('Save daily log', error, { userId: req.user.userId, date: req.body?.date });
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;