const express = require('express');
const router = express.Router();
const Reminder = require('../models/Reminder');
const ReminderScheduler = require('../services/reminderScheduler');

// GET all reminders
router.get('/', async (req, res) => {
  try {
    const { taskId, status, type } = req.query;
    
    const filter = {};
    if (taskId) filter.taskId = taskId;
    if (status) filter.status = status;
    if (type) filter.type = type;

    const reminders = await Reminder.find(filter)
      .populate('taskId', 'title assignee dueDate')
      .sort({ sentAt: -1 })
      .limit(100);

    res.json({
      success: true,
      count: reminders.length,
      reminders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET reminders for task
router.get('/task/:taskId', async (req, res) => {
  try {
    const reminders = await Reminder.find({ taskId: req.params.taskId })
      .sort({ sentAt: -1 });

    res.json({
      success: true,
      count: reminders.length,
      reminders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST send manual reminder
router.post('/manual', async (req, res) => {
  try {
    const { taskId, message, channel } = req.body;

    if (!taskId) {
      return res.status(400).json({
        success: false,
        error: 'taskId is required'
      });
    }

    const result = await ReminderScheduler.sendManualReminder(
      taskId,
      message,
      channel || 'email'
    );

    res.json({
      success: result.success,
      reminder: result.reminder
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET reminder stats
router.get('/stats', async (req, res) => {
  try {
    const stats = await ReminderScheduler.getReminderStats();

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;