const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Reminder = require('../models/Reminder');
const AIService = require('../services/aiService');

// GET all tasks
router.get('/', async (req, res) => {
  try {
    const { status, priority, assignee } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignee) filter['assignee.email'] = assignee;

    const tasks = await Task.find(filter).sort({ dueDate: 1 });
    
    const tasksWithExtras = tasks.map(task => ({
      ...task.toObject(),
      isOverdue: task.isOverdue,
      daysUntilDue: task.daysUntilDue()
    }));

    res.json({
      success: true,
      count: tasks.length,
      tasks: tasksWithExtras
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET single task
router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    const reminders = await Reminder.find({ taskId: task._id }).sort({ sentAt: -1 });

    res.json({
      success: true,
      task: {
        ...task.toObject(),
        isOverdue: task.isOverdue,
        daysUntilDue: task.daysUntilDue()
      },
      reminders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST create task
router.post('/', async (req, res) => {
  try {
    const { title, description, assignee, dueDate, priority } = req.body;

    if (!title || !assignee?.name || !assignee?.email || !dueDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: title, assignee (name, email), dueDate'
      });
    }

    let taskPriority = priority;
    if (!taskPriority && description) {
      taskPriority = AIService.analyzeSentiment(description);
    }

    const task = new Task({
      title,
      description,
      assignee,
      dueDate: new Date(dueDate),
      priority: taskPriority || 'medium'
    });

    await task.save();

    res.status(201).json({
      success: true,
      task: {
        ...task.toObject(),
        isOverdue: task.isOverdue,
        daysUntilDue: task.daysUntilDue()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// PUT update task
router.put('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    const allowedUpdates = ['title', 'description', 'assignee', 'dueDate', 'status', 'priority'];
    const updates = Object.keys(req.body);
    
    updates.forEach(update => {
      if (allowedUpdates.includes(update)) {
        if (update === 'dueDate') {
          task[update] = new Date(req.body[update]);
        } else {
          task[update] = req.body[update];
        }
      }
    });

    await task.save();

    res.json({
      success: true,
      task: {
        ...task.toObject(),
        isOverdue: task.isOverdue,
        daysUntilDue: task.daysUntilDue()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// DELETE task
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    await Reminder.deleteMany({ taskId: task._id });
    await task.deleteOne();

    res.json({
      success: true,
      message: 'Task and associated reminders deleted'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;