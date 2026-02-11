require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cron = require('node-cron');
const connectDB = require('./config/database');
const ReminderScheduler = require('./services/reminderScheduler');

// Initialize Express
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Connect to MongoDB
connectDB();

// Import routes
const taskRoutes = require('./routes/tasks');
const reminderRoutes = require('./routes/reminders');
const bolticRoutes = require('./routes/boltic');
const analyticsRoutes = require('./routes/analytics');
const cronRoutes = require('./routes/cron');

// API Routes
app.use('/api/tasks', taskRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/boltic', bolticRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/cron', cronRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Chaser Agent API is running',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Chaser Agent - Automated Reminder System',
    version: '1.0.0',
    endpoints: {
      tasks: '/api/tasks',
      reminders: '/api/reminders',
      boltic: '/api/boltic',
      analytics: '/api/analytics',
      health: '/health'
    }
  });
});

// Setup cron jobs
cron.schedule('0 9 * * *', async () => {
  console.log('⏰ Running scheduled daily check...');
  try {
    await ReminderScheduler.checkAndSendReminders();
  } catch (error) {
    console.error('❌ Scheduled daily check failed:', error);
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║        🚀 Chaser Agent API Server Running            ║
║                                                       ║
║        Port: ${PORT}                                      ║
║        Environment: ${process.env.NODE_ENV || 'development'}                        ║
║        Time: ${new Date().toLocaleString()}          ║
║                                                       ║
║        📝 API Documentation:                          ║
║        http://localhost:${PORT}/                          ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
  `);
});

module.exports = app;