/**
 * AI Service for Smart Reminder Generation
 */

class AIService {
  // Generate a smart reminder message based on context
  static generateReminderMessage(task, reminderType, tone) {
    const messages = {
      formal: {
        'auto-3days': `Hi ${task.assignee.name},\n\nThis is a friendly reminder that "${task.title}" is due in 3 days (${this.formatDate(task.dueDate)}).\n\nPlease let us know if you need any support to complete this task on time.\n\nBest regards`,
        'auto-1day': `Hi ${task.assignee.name},\n\nJust a heads up that "${task.title}" is due tomorrow (${this.formatDate(task.dueDate)}).\n\nPlease ensure it's completed on time or reach out if you need assistance.\n\nThank you`,
        'auto-deadline': `Hi ${task.assignee.name},\n\n"${task.title}" is due today (${this.formatDate(task.dueDate)}).\n\nPlease mark it as complete once finished.\n\nRegards`,
        'auto-overdue': `Hi ${task.assignee.name},\n\n"${task.title}" was due on ${this.formatDate(task.dueDate)} and is now overdue.\n\nPlease complete it as soon as possible or update us on the status.\n\nThank you`
      },
      friendly: {
        'auto-3days': `Hey ${task.assignee.name}! 👋\n\nQuick reminder: "${task.title}" is coming up in 3 days (${this.formatDate(task.dueDate)}).\n\nYou've got this! Let me know if you need anything.\n\nCheers!`,
        'auto-1day': `Hey ${task.assignee.name}! ⏰\n\n"${task.title}" is due tomorrow (${this.formatDate(task.dueDate)}).\n\nAlmost there! Ping me if you need help.\n\nThanks!`,
        'auto-deadline': `Hi ${task.assignee.name}! 📅\n\nToday's the day! "${task.title}" is due today.\n\nLet us know once it's done!\n\nBest`,
        'auto-overdue': `Hey ${task.assignee.name},\n\nJust checking in - "${task.title}" was due on ${this.formatDate(task.dueDate)}.\n\nWhat's the status? Can we help with anything?\n\nThanks!`
      },
      casual: {
        'auto-3days': `Hey ${task.assignee.name},\n\n"${task.title}" - 3 days to go! (${this.formatDate(task.dueDate)})\n\nJust a nudge 😊`,
        'auto-1day': `${task.assignee.name},\n\n"${task.title}" - tomorrow's the deadline!\n\nYou got this! 💪`,
        'auto-deadline': `${task.assignee.name},\n\n"${task.title}" - due today! ⚡\n\nWrap it up when you can!`,
        'auto-overdue': `${task.assignee.name},\n\n"${task.title}" is past due. What's up?\n\nNeed help?`
      },
      urgent: {
        'auto-3days': `ATTENTION: ${task.assignee.name},\n\n⚠️ "${task.title}" - HIGH PRIORITY\nDue: ${this.formatDate(task.dueDate)} (3 days)\n\nImmediate attention required.`,
        'auto-1day': `URGENT: ${task.assignee.name},\n\n⚠️ "${task.title}" - CRITICAL DEADLINE\nDue: Tomorrow (${this.formatDate(task.dueDate)})\n\nPlease prioritize this task.`,
        'auto-deadline': `URGENT: ${task.assignee.name},\n\n🚨 "${task.title}" - DUE TODAY\nDeadline: ${this.formatDate(task.dueDate)}\n\nComplete immediately.`,
        'auto-overdue': `CRITICAL: ${task.assignee.name},\n\n🚨 "${task.title}" - OVERDUE\nWas due: ${this.formatDate(task.dueDate)}\n\nEscalation pending. Update status ASAP.`
      }
    };

    const toneMessages = messages[tone] || messages.formal;
    return toneMessages[reminderType] || toneMessages['auto-3days'];
  }

  // Generate email subject
  static generateSubject(task, reminderType) {
    const priorityPrefix = task.priority === 'urgent' ? '[URGENT] ' : '';
    
    const subjects = {
      'auto-3days': `${priorityPrefix}Reminder: "${task.title}" due in 3 days`,
      'auto-1day': `${priorityPrefix}Reminder: "${task.title}" due tomorrow`,
      'auto-deadline': `${priorityPrefix}Reminder: "${task.title}" due TODAY`,
      'auto-overdue': `${priorityPrefix}OVERDUE: "${task.title}"`,
      'manual': `${priorityPrefix}Follow-up: "${task.title}"`,
      'escalation': `🚨 ESCALATION: "${task.title}" - Action Required`
    };

    return subjects[reminderType] || `Reminder: "${task.title}"`;
  }

  // Determine optimal send time
  static determineOptimalSendTime(task, reminderHistory = []) {
    if (reminderHistory.length > 0) {
      const responseTimes = reminderHistory
        .filter(r => r.responseReceived && r.respondedAt)
        .map(r => new Date(r.respondedAt).getHours());
      
      if (responseTimes.length > 0) {
        const avgHour = Math.round(
          responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        );
        return avgHour;
      }
    }

    // Default times based on priority
    const defaultTimes = {
      'urgent': 9,
      'high': 10,
      'medium': 14,
      'low': 16
    };

    return defaultTimes[task.priority] || 10;
  }

  // Check if escalation needed
  static shouldEscalate(task, reminders) {
    const daysOverdue = task.isOverdue ? Math.abs(task.daysUntilDue()) : 0;
    const reminderCount = reminders.length;
    const hasResponse = reminders.some(r => r.responseReceived);

    if (task.priority === 'urgent' && daysOverdue > 0) {
      return { shouldEscalate: true, reason: 'Urgent task is overdue' };
    }

    if (daysOverdue > 2) {
      return { shouldEscalate: true, reason: `Task overdue by ${daysOverdue} days` };
    }

    if (reminderCount >= 3 && !hasResponse) {
      return { shouldEscalate: true, reason: 'No response after 3 reminders' };
    }

    return { shouldEscalate: false, reason: null };
  }

  // Get reminder schedule
  static getReminderSchedule(priority) {
    const schedules = {
      'urgent': [3, 1, 0, -1],
      'high': [3, 1, 0],
      'medium': [3, 0],
      'low': [3]
    };

    return schedules[priority] || schedules.medium;
  }

  // Format date
  static formatDate(date) {
    const d = new Date(date);
    const options = { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    return d.toLocaleDateString('en-US', options);
  }

  // Analyze sentiment
  static analyzeSentiment(text) {
    const urgentKeywords = ['urgent', 'asap', 'critical', 'emergency', 'immediately'];
    const importantKeywords = ['important', 'priority', 'key', 'essential'];
    
    const lowerText = text.toLowerCase();
    
    if (urgentKeywords.some(word => lowerText.includes(word))) {
      return 'urgent';
    }
    
    if (importantKeywords.some(word => lowerText.includes(word))) {
      return 'high';
    }
    
    return 'medium';
  }
}

module.exports = AIService;