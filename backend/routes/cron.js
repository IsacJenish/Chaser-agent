const express = require('express');
const router = express.Router();
const ReminderScheduler = require('../services/reminderScheduler');

// POST daily check
router.post('/daily-check', async (req, res) => {
  try {
    console.log('⏰ Running daily deadline check...');
    
    const result = await ReminderScheduler.checkAndSendReminders();

    res.json({
      success: true,
      message: 'Daily check completed',
      ...result
    });
  } catch (error) {
    console.error('❌ Daily check failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;