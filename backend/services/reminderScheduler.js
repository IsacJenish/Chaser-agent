const Task = require('../models/Task');
const Reminder = require('../models/Reminder');
const AIService = require('./aiService');
const BolticService = require('./bolticService');

/**
 * Reminder Scheduler Service
 */

class ReminderScheduler {
  // Check and send reminders
  static async checkAndSendReminders() {
    console.log('🔍 Checking tasks for reminders...');
    
    try {
      const now = new Date();
      const tasks = await Task.find({ 
        status: { $in: ['pending', 'in-progress'] }
      });

      let remindersSent = 0;
      const results = [];

      for (const task of tasks) {
        const daysUntil = task.daysUntilDue();
        const reminderSchedule = AIService.getReminderSchedule(task.priority);
        
        let reminderType = null;
        
        if (daysUntil === 3 && reminderSchedule.includes(3)) {
          reminderType = 'auto-3days';
        } else if (daysUntil === 1 && reminderSchedule.includes(1)) {
          reminderType = 'auto-1day';
        } else if (daysUntil === 0 && reminderSchedule.includes(0)) {
          reminderType = 'auto-deadline';
        } else if (daysUntil < 0 && task.isOverdue && reminderSchedule.includes(-1)) {
          reminderType = 'auto-overdue';
        }

        if (reminderType) {
          const todayStart = new Date(now.setHours(0, 0, 0, 0));
          const existingReminder = await Reminder.findOne({
            taskId: task._id,
            type: reminderType,
            sentAt: { $gte: todayStart }
          });

          if (!existingReminder) {
            const result = await this.sendReminder(task, reminderType);
            results.push(result);
            if (result.success) remindersSent++;
          }
        }

        const reminders = await Reminder.find({ taskId: task._id });
        const escalationCheck = AIService.shouldEscalate(task, reminders);
        
        if (escalationCheck.shouldEscalate && !task.escalated) {
          await this.escalateTask(task, escalationCheck.reason);
        }
      }

      console.log(`✅ Daily check complete. Sent ${remindersSent} reminders.`);
      return {
        success: true,
        remindersSent,
        results
      };
    } catch (error) {
      console.error(`❌ Error in daily check: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Send reminder
  static async sendReminder(task, reminderType, channel = 'email') {
    try {
      const tone = task.getReminderTone();
      const message = AIService.generateReminderMessage(task, reminderType, tone);
      const subject = AIService.generateSubject(task, reminderType);

      const reminder = new Reminder({
        taskId: task._id,
        type: reminderType,
        channel,
        message,
        subject,
        tone,
        aiGenerated: true,
        status: 'pending'
      });

      await reminder.save();

      let sendResult;
      if (channel === 'email' || channel === 'both') {
        sendResult = await BolticService.sendEmailReminder(task, reminder);
      } else if (channel === 'slack') {
        sendResult = await BolticService.sendSlackReminder(task, reminder);
      }

      if (sendResult.success) {
        reminder.status = 'sent';
        reminder.bolticWorkflowId = sendResult.workflowId;
        
        task.reminderCount += 1;
        task.lastReminderSent = new Date();
        await task.save();
      } else {
        reminder.status = 'failed';
        reminder.errorMessage = sendResult.error;
      }

      await reminder.save();

      console.log(`📧 Reminder ${sendResult.success ? 'sent' : 'failed'} for task: ${task.title}`);
      
      return {
        success: sendResult.success,
        taskId: task._id,
        reminderId: reminder._id,
        type: reminderType
      };
    } catch (error) {
      console.error(`❌ Error sending reminder: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Send manual reminder
  static async sendManualReminder(taskId, customMessage = null, channel = 'email') {
    try {
      const task = await Task.findById(taskId);
      if (!task) {
        throw new Error('Task not found');
      }

      const tone = task.getReminderTone();
      const message = customMessage || AIService.generateReminderMessage(task, 'manual', tone);
      const subject = AIService.generateSubject(task, 'manual');

      const reminder = new Reminder({
        taskId: task._id,
        type: 'manual',
        channel,
        message,
        subject,
        tone,
        aiGenerated: !customMessage,
        status: 'pending'
      });

      await reminder.save();

      const sendResult = await BolticService.sendEmailReminder(task, reminder);

      if (sendResult.success) {
        reminder.status = 'sent';
        reminder.bolticWorkflowId = sendResult.workflowId;
        task.reminderCount += 1;
        task.lastReminderSent = new Date();
        await task.save();
      } else {
        reminder.status = 'failed';
        reminder.errorMessage = sendResult.error;
      }

      await reminder.save();

      return {
        success: sendResult.success,
        reminder: reminder.toObject()
      };
    } catch (error) {
      throw error;
    }
  }

  // Escalate task
  static async escalateTask(task, reason) {
    try {
      console.log(`⚠️ Escalating task: ${task.title} - Reason: ${reason}`);
      
      const escalationResult = await BolticService.triggerEscalation(task, reason);

      if (escalationResult.success) {
        task.escalated = true;
        task.escalatedAt = new Date();
        await task.save();

        const reminder = new Reminder({
          taskId: task._id,
          type: 'escalation',
          channel: 'email',
          message: `Task escalated: ${reason}`,
          subject: `🚨 ESCALATION: ${task.title}`,
          tone: 'urgent',
          status: 'sent',
          bolticWorkflowId: escalationResult.workflowId
        });

        await reminder.save();
      }

      return escalationResult;
    } catch (error) {
      console.error(`❌ Error escalating task: ${error.message}`);
      throw error;
    }
  }

  // Get stats
  static async getReminderStats() {
    const totalReminders = await Reminder.countDocuments();
    const sentReminders = await Reminder.countDocuments({ status: 'sent' });
    const failedReminders = await Reminder.countDocuments({ status: 'failed' });
    const pendingReminders = await Reminder.countDocuments({ status: 'pending' });

    const remindersByType = await Reminder.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    const remindersByTone = await Reminder.aggregate([
      {
        $group: {
          _id: '$tone',
          count: { $sum: 1 }
        }
      }
    ]);

    return {
      total: totalReminders,
      sent: sentReminders,
      failed: failedReminders,
      pending: pendingReminders,
      byType: remindersByType,
      byTone: remindersByTone
    };
  }
}

module.exports = ReminderScheduler;