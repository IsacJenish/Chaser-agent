const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  assignee: {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    slackId: {
      type: String,
      default: null
    }
  },
  dueDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'overdue'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  reminderCount: {
    type: Number,
    default: 0
  },
  lastReminderSent: {
    type: Date,
    default: null
  },
  escalated: {
    type: Boolean,
    default: false
  },
  escalatedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Virtual to check if task is overdue
taskSchema.virtual('isOverdue').get(function() {
  return new Date() > this.dueDate && this.status !== 'completed';
});

// Method to calculate days until due
taskSchema.methods.daysUntilDue = function() {
  const now = new Date();
  const due = new Date(this.dueDate);
  const diffTime = due - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Method to determine reminder tone
taskSchema.methods.getReminderTone = function() {
  if (this.isOverdue) return 'urgent';
  if (this.reminderCount === 0) return 'formal';
  if (this.reminderCount === 1) return 'friendly';
  if (this.reminderCount >= 2) return 'casual';
  return 'formal';
};

module.exports = mongoose.model('Task', taskSchema);