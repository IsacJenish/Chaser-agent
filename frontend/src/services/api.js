import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const tasksAPI = {
  getAll: (params) => api.get('/tasks', { params }),
  getById: (id) => api.get(`/tasks/${id}`),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
};

export const remindersAPI = {
  getAll: (params) => api.get('/reminders', { params }),
  getByTask: (taskId) => api.get(`/reminders/task/${taskId}`),
  sendManual: (data) => api.post('/reminders/manual', data),
  getStats: () => api.get('/reminders/stats'),
};

export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getResponsePatterns: () => api.get('/analytics/response-patterns'),
};

export const cronAPI = {
  triggerDailyCheck: () => api.post('/cron/daily-check'),
};

export default api;