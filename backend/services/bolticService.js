const axios = require('axios');

/**
 * Boltic Integration Service
 */

class BolticService {
  // Trigger workflow
  static async triggerWorkflow(workflowUrl, payload) {
    try {
      console.log(`🚀 Triggering Boltic workflow: ${workflowUrl}`);
      
      const response = await axios.post(workflowUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000
      });

      console.log(`✅ Boltic workflow triggered successfully`);
      return {
        success: true,
        data: response.data,
        workflowId: response.data?.workflowId || null
      };
    } catch (error) {
      console.error(`❌ Boltic workflow trigger failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
        workflowId: null
      };
    }
  }

  // Send email reminder
  static async sendEmailReminder(task, reminder) {
  const workflowUrl = process.env.BOLTIC_MANUAL_REMINDER_WEBHOOK;
  
  if (!workflowUrl) {
    console.warn('⚠️ Boltic webhook URL not configured - running in demo mode');
    return { success: true, mode: 'demo' };
  }

  // Format date properly
  const dueDate = new Date(task.dueDate);
  const formattedDate = dueDate.toLocaleDateString('en-US', { 
    weekday: 'short', 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });

  // Prepare payload with all fields properly defined
  const payload = {
    // Email fields (MUST have these)
    to: task.assignee.email || '',
    from: process.env.SENDER_EMAIL || 'noreply@chaseragent.com',
    subject: reminder.subject || `Reminder: ${task.title}`,
    message: reminder.message || '',
    body: reminder.message || '', // Some email services use 'body' instead
    
    // Additional task data
    taskId: task._id ? task._id.toString() : '',
    reminderId: reminder._id ? reminder._id.toString() : '',
    taskTitle: task.title || 'Untitled Task',
    assigneeName: task.assignee.name || 'User',
    assigneeEmail: task.assignee.email || '',
    dueDate: formattedDate,
    priority: task.priority ? task.priority.toUpperCase() : 'MEDIUM',
    reminderType: reminder.type || 'manual',
    tone: reminder.tone || 'formal',
    status: task.status || 'pending'
  };

  console.log('📧 Sending reminder to Boltic:', {
    to: payload.to,
    subject: payload.subject,
    taskTitle: payload.taskTitle
  });

  return await this.triggerWorkflow(workflowUrl, payload);
}

  // Send Slack reminder
  static async sendSlackReminder(task, reminder) {
    const payload = {
      slackUserId: task.assignee.slackId,
      channel: task.assignee.slackId || 'general',
      message: reminder.message,
      taskId: task._id.toString(),
      reminderId: reminder._id.toString(),
      taskTitle: task.title,
      dueDate: task.dueDate
    };

    console.log('📱 Slack reminder (demo mode):', payload);
    return { success: true, message: 'Slack demo mode' };
  }

  // Trigger daily check
  static async triggerDailyCheck(tasks) {
    const workflowUrl = process.env.BOLTIC_DAILY_CHECK_WEBHOOK;
    
    if (!workflowUrl) {
      console.log('⚠️ Daily check webhook not configured, running locally');
      return { success: true, mode: 'local' };
    }

    const payload = {
      checkDate: new Date().toISOString(),
      taskCount: tasks.length,
      tasks: tasks.map(t => ({
        id: t._id.toString(),
        title: t.title,
        dueDate: t.dueDate,
        assignee: t.assignee.email,
        priority: t.priority
      }))
    };

    return await this.triggerWorkflow(workflowUrl, payload);
  }

  // Trigger escalation
  static async triggerEscalation(task, reason) {
    const workflowUrl = process.env.BOLTIC_ESCALATION_WEBHOOK;
    
    if (!workflowUrl) {
      console.warn('⚠️ Escalation webhook not configured - demo mode');
      return { success: true, mode: 'demo' };
    }

    const payload = {
      taskId: task._id.toString(),
      taskTitle: task.title,
      assignee: task.assignee,
      dueDate: task.dueDate,
      priority: task.priority,
      escalationReason: reason,
      overdueBy: Math.abs(task.daysUntilDue()),
      reminderCount: task.reminderCount,
      escalatedAt: new Date().toISOString(),
      escalationEmail: process.env.ESCALATION_EMAIL || 'manager@example.com'
    };

    return await this.triggerWorkflow(workflowUrl, payload);
  }

  // Process webhook callback
  static processWebhookCallback(payload) {
    console.log('📥 Received Boltic webhook callback:', payload);
    
    return {
      reminderId: payload.reminderId,
      status: payload.status,
      deliveredAt: payload.deliveredAt,
      errorMessage: payload.error || null
    };
  }
}

module.exports = BolticService;