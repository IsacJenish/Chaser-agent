const express = require('express');
const router = express.Router();
const BolticService = require('../services/bolticService');
const Reminder = require('../models/Reminder');

// POST webhook callback
router.post('/webhook', async (req, res) => {
  try {
    console.log('📥 Received Boltic webhook:', req.body);
    
    const callbackData = BolticService.processWebhookCallback(req.body);

    if (callbackData.reminderId) {
      const reminder = await Reminder.findById(callbackData.reminderId);
      
      if (reminder) {
        reminder.status = callbackData.status;
        if (callbackData.deliveredAt) {
          reminder.sentAt = new Date(callbackData.deliveredAt);
        }
        if (callbackData.errorMessage) {
          reminder.errorMessage = callbackData.errorMessage;
        }
        await reminder.save();
      }
    }

    res.json({
      success: true,
      message: 'Webhook processed successfully'
    });
  } catch (error) {
    console.error('❌ Error processing Boltic webhook:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;