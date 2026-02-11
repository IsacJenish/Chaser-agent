const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Reminder = require('../models/Reminder');
const ReminderScheduler = require('../services/reminderScheduler');

// GET dashboard analytics
router.get('/dashboard', async (req, res) => {
  try {
    const totalTasks = await Task.countDocuments();
    const pendingTasks = await Task.countDocuments({ status: 'pending' });
    const inProgressTasks = await Task.countDocuments({ status: 'in-progress' });
    const completedTasks = await Task.countDocuments({ status: 'completed' });
    
    const now = new Date();
    const overdueTasks = await Task.countDocuments({
      dueDate: { $lt: now },
      status: { $ne: 'completed' }
    });

    const dueSoon = await Task.countDocuments({
      dueDate: { 
        $gte: now,
        $lte: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
      },
      status: { $ne: 'completed' }
    });

    const reminderStats = await ReminderScheduler.getReminderStats();

    const tasksByPriority = await Task.aggregate([
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    const recentTasks = await Task.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title assignee.name dueDate status priority');

    const recentReminders = await Reminder.find()
      .populate('taskId', 'title')
      .sort({ sentAt: -1 })
      .limit(5)
      .select('taskId type status sentAt');

    const escalatedTasks = await Task.countDocuments({ escalated: true });

    res.json({
      success: true,
      dashboard: {
        tasks: {
          total: totalTasks,
          pending: pendingTasks,
          inProgress: inProgressTasks,
          completed: completedTasks,
          overdue: overdueTasks,
          dueSoon: dueSoon,
          byPriority: tasksByPriority,
          escalated: escalatedTasks
        },
        reminders: reminderStats,
        recent: {
          tasks: recentTasks,
          reminders: recentReminders
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET response patterns
router.get('/response-patterns', async (req, res) => {
  try {
    const respondedReminders = await Reminder.find({
      responseReceived: true,
      respondedAt: { $exists: true }
    }).populate('taskId', 'assignee');

    const responsesByHour = {};
    for (let i = 0; i < 24; i++) {
      responsesByHour[i] = 0;
    }

    respondedReminders.forEach(reminder => {
      if (reminder.respondedAt) {
        const hour = new Date(reminder.respondedAt).getHours();
        responsesByHour[hour]++;
      }
    });

    let bestHour = 0;
    let maxResponses = 0;
    Object.keys(responsesByHour).forEach(hour => {
      if (responsesByHour[hour] > maxResponses) {
        maxResponses = responsesByHour[hour];
        bestHour = parseInt(hour);
      }
    });

    const toneEffectiveness = await Reminder.aggregate([
      {
        $match: { responseReceived: true }
      },
      {
        $group: {
          _id: '$tone',
          responses: { $sum: 1 }
        }
      }
    ]);

    const responseTimes = respondedReminders
      .filter(r => r.sentAt && r.respondedAt)
      .map(r => {
        const sent = new Date(r.sentAt);
        const responded = new Date(r.respondedAt);
        return (responded - sent) / (1000 * 60 * 60);
      });

    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;

    res.json({
      success: true,
      patterns: {
        optimalSendTime: bestHour,
        responsesByHour,
        toneEffectiveness,
        avgResponseTime: avgResponseTime.toFixed(2) + ' hours',
        totalResponsesAnalyzed: respondedReminders.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;