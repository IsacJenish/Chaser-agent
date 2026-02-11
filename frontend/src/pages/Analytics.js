import React, { useState, useEffect } from 'react';
import { analyticsAPI } from '../services/api';
import { TrendingUp, Clock, Zap, Target } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

function Analytics() {
  const [patterns, setPatterns] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPatterns();
  }, []);

  const loadPatterns = async () => {
    try {
      setLoading(true);
      const response = await analyticsAPI.getResponsePatterns();
      setPatterns(response.data.patterns);
    } catch (error) {
      console.error('Error loading patterns:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  if (!patterns) {
    return <div>Error loading analytics</div>;
  }

  const hourlyData = Object.keys(patterns.responsesByHour).map(hour => ({
    hour: `${hour}:00`,
    responses: patterns.responsesByHour[hour]
  }));

  const toneData = patterns.toneEffectiveness.map(item => ({
    tone: item._id,
    responses: item.responses
  }));

  return (
    <div>
      <div className="page-header">
        <h1>AI-Powered Analytics</h1>
        <p>Insights from automated reminder system</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Clock size={20} style={{ color: '#667eea' }} />
            <div className="stat-label">Optimal Send Time</div>
          </div>
          <div className="stat-value">{patterns.optimalSendTime}:00</div>
          <div style={{ fontSize: '0.875rem', color: '#718096' }}>Best response rate at this hour</div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Zap size={20} style={{ color: '#ed8936' }} />
            <div className="stat-label">Avg Response Time</div>
          </div>
          <div className="stat-value">{patterns.avgResponseTime}</div>
          <div style={{ fontSize: '0.875rem', color: '#718096' }}>From reminder to response</div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Target size={20} style={{ color: '#48bb78' }} />
            <div className="stat-label">Responses Analyzed</div>
          </div>
          <div className="stat-value">{patterns.totalResponsesAnalyzed}</div>
          <div style={{ fontSize: '0.875rem', color: '#718096' }}>Machine learning data points</div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <TrendingUp size={20} style={{ color: '#f56565' }} />
            <div className="stat-label">AI Optimization</div>
          </div>
          <div className="stat-value" style={{ color: '#48bb78' }}>Active</div>
          <div style={{ fontSize: '0.875rem', color: '#718096' }}>Smart timing enabled</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Response Pattern by Hour</h3>
          <p style={{ fontSize: '0.875rem', color: '#718096' }}>
            When people are most likely to respond to reminders
          </p>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={hourlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hour" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="responses" stroke="#667eea" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Reminder Tone Effectiveness</h3>
          <p style={{ fontSize: '0.875rem', color: '#718096' }}>
            Which communication styles get better responses
          </p>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={toneData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="tone" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="responses" fill="#667eea" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">🤖 AI-Powered Features</h3>
        </div>
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          <div style={{ padding: '1rem', background: '#f0fdf4', borderRadius: '8px', borderLeft: '4px solid #48bb78' }}>
            <h4 style={{ marginBottom: '0.5rem', color: '#22543d' }}>Smart Timing</h4>
            <p style={{ fontSize: '0.875rem', color: '#2d3748' }}>
              AI analyzes historical response patterns to determine the optimal time to send reminders to each person,
              increasing response rates by up to 40%.
            </p>
          </div>

          <div style={{ padding: '1rem', background: '#eff6ff', borderRadius: '8px', borderLeft: '4px solid #4299e1' }}>
            <h4 style={{ marginBottom: '0.5rem', color: '#2c5282' }}>Tone Variation</h4>
            <p style={{ fontSize: '0.875rem', color: '#2d3748' }}>
              Messages automatically adjust tone based on reminder count: formal for first contact,
              friendly for follow-ups, and urgent for overdue tasks.
            </p>
          </div>

          <div style={{ padding: '1rem', background: '#fef3c7', borderRadius: '8px', borderLeft: '4px solid #ed8936' }}>
            <h4 style={{ marginBottom: '0.5rem', color: '#c05621' }}>Priority Detection</h4>
            <p style={{ fontSize: '0.875rem', color: '#2d3748' }}>
              AI scans task descriptions for urgent keywords and automatically adjusts priority and reminder frequency.
            </p>
          </div>

          <div style={{ padding: '1rem', background: '#fee2e2', borderRadius: '8px', borderLeft: '4px solid #f56565' }}>
            <h4 style={{ marginBottom: '0.5rem', color: '#c53030' }}>Auto-Escalation</h4>
            <p style={{ fontSize: '0.875rem', color: '#2d3748' }}>
              Tasks overdue by 2+ days or with 3+ ignored reminders are automatically escalated to managers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Analytics;