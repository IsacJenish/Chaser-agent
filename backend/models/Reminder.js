const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true
  },
  sentAt: {
    type: Date,
    default: Date.now
  },
  type: {
    type: String,
    enum: ['auto-3days', 'auto-1day', 'auto-deadline', 'auto-overdue', 'manual', 'escalation'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed', 'delivered'],
    default: 'pending'
  },
  channel: {
    type: String,
    enum: ['email', 'slack', 'both'],
    default: 'email'
  },
  message: {
    type: String,
    required: true
  },
  subject: {
    type: String
  },
  tone: {
    type: String,
    enum: ['formal', 'friendly', 'casual', 'urgent'],
    default: 'formal'
  },
  aiGenerated: {
    type: Boolean,
    default: false
  },
  bolticWorkflowId: {
    type: String,
    default: null
  },
  errorMessage: {
    type: String,
    default: null
  },
  responseReceived: {
    type: Boolean,
    default: false
  },
  respondedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for efficient querying
reminderSchema.index({ taskId: 1, sentAt: -1 });
reminderSchema.index({ status: 1 });

module.exports = mongoose.model('Reminder', reminderSchema);