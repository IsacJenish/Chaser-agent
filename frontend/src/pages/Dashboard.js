import React, { useState, useEffect } from 'react';
import { analyticsAPI, cronAPI } from '../services/api';
import { CheckCircle2, Clock, AlertTriangle, TrendingUp, Bell, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const response = await analyticsAPI.getDashboard();
      setDashboard(response.data.dashboard);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDailyCheck = async () => {
    try {
      setSyncing(true);
      await cronAPI.triggerDailyCheck();
      alert('Daily check triggered successfully!');
      loadDashboard();
    } catch (error) {
      alert('Error triggering daily check: ' + error.message);
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!dashboard) {
    return <div>Error loading dashboard</div>;
  }

  const { tasks, reminders } = dashboard;

  const priorityData = tasks.byPriority.map(p => ({
    name: p._id.toUpperCase(),
    value: p.count
  }));

  const COLORS = {
    URGENT: '#f56565',
    HIGH: '#ed8936',
    MEDIUM: '#4299e1',
    LOW: '#48bb78'
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Dashboard</h1>
          <p>Monitor your automated reminder system</p>
        </div>
        <button className="btn btn-primary" onClick={handleDailyCheck} disabled={syncing}>
          <RefreshCw size={16} />
          <span>Run Daily Check</span>
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Tasks</div>
          <div className="stat-value">{tasks.total}</div>
          <div style={{ color: '#48bb78', fontSize: '0.875rem' }}>
            <TrendingUp size={16} style={{ display: 'inline', marginRight: '4px' }} />
            Active monitoring
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Pending</div>
          <div className="stat-value">{tasks.pending}</div>
          <div style={{ color: '#ed8936', fontSize: '0.875rem' }}>
            <Clock size={16} style={{ display: 'inline', marginRight: '4px' }} />
            Awaiting completion
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Overdue</div>
          <div className="stat-value" style={{ color: '#f56565' }}>{tasks.overdue}</div>
          <div style={{ color: '#f56565', fontSize: '0.875rem' }}>
            <AlertTriangle size={16} style={{ display: 'inline', marginRight: '4px' }} />
            Needs attention
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Completed</div>
          <div className="stat-value" style={{ color: '#48bb78' }}>{tasks.completed}</div>
          <div style={{ color: '#48bb78', fontSize: '0.875rem' }}>
            <CheckCircle2 size={16} style={{ display: 'inline', marginRight: '4px' }} />
            {tasks.total > 0 ? Math.round((tasks.completed / tasks.total) * 100) : 0}% completion
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <Bell size={20} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
            Reminder Statistics
          </h3>
        </div>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Sent</div>
            <div className="stat-value">{reminders.total}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Success Rate</div>
            <div className="stat-value" style={{ color: '#48bb78' }}>
              {reminders.total > 0 ? Math.round((reminders.sent / reminders.total) * 100) : 0}%
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Failed</div>
            <div className="stat-value" style={{ color: '#f56565' }}>{reminders.failed}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Escalated</div>
            <div className="stat-value">{tasks.escalated}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Tasks by Priority</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={priorityData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {priorityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.name]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Reminder Types</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={reminders.byType}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#667eea" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;