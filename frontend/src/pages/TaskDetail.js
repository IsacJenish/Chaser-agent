import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tasksAPI, remindersAPI } from '../services/api';
import { ArrowLeft, Send, Trash2 } from 'lucide-react';

function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadTaskDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await tasksAPI.getById(id);
      setTask(response.data.task);
      setReminders(response.data.reminders);
    } catch (error) {
      console.error('Error loading task:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadTaskDetails();
  }, [loadTaskDetails, id]);

  const handleSendReminder = async () => {
    try {
      await remindersAPI.sendManual({ taskId: id });
      alert('Reminder sent successfully!');
      loadTaskDetails();
    } catch (error) {
      alert('Error sending reminder: ' + error.message);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await tasksAPI.delete(id);
        navigate('/tasks');
      } catch (error) {
        alert('Error deleting task: ' + error.message);
      }
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await tasksAPI.update(id, { status: newStatus });
      loadTaskDetails();
    } catch (error) {
      alert('Error updating status: ' + error.message);
    }
  };

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  if (!task) {
    return <div>Task not found</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/tasks')}>
          <ArrowLeft size={16} /> Back to Tasks
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>{task.title}</h1>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span className={`badge badge-${task.status}`}>{task.status}</span>
              <span className={`badge badge-${task.priority}`}>{task.priority}</span>
              {task.isOverdue && <span className="badge badge-overdue">Overdue</span>}
              {task.escalated && <span className="badge badge-urgent">Escalated</span>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-primary" onClick={handleSendReminder}>
              <Send size={16} /> Send Reminder
            </button>
            <button className="btn btn-danger" onClick={handleDelete}>
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#718096', marginBottom: '0.5rem' }}>Assignee</div>
            <div style={{ fontWeight: 500 }}>{task.assignee.name}</div>
            <div style={{ fontSize: '0.875rem', color: '#718096' }}>{task.assignee.email}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#718096', marginBottom: '0.5rem' }}>Due Date</div>
            <div style={{ fontWeight: 500 }}>{new Date(task.dueDate).toLocaleDateString()}</div>
            <div style={{ fontSize: '0.875rem', color: task.isOverdue ? '#f56565' : '#718096' }}>
              {task.isOverdue ? `${Math.abs(task.daysUntilDue)} days overdue` : `${task.daysUntilDue} days remaining`}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#718096', marginBottom: '0.5rem' }}>Reminders Sent</div>
            <div style={{ fontWeight: 500, fontSize: '1.5rem' }}>{task.reminderCount || 0}</div>
          </div>
        </div>

        {task.description && (
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ fontSize: '0.875rem', color: '#718096', marginBottom: '0.5rem' }}>Description</div>
            <div style={{ padding: '1rem', background: '#f7fafc', borderRadius: '8px' }}>{task.description}</div>
          </div>
        )}

        <div style={{ marginTop: '2rem' }}>
          <div style={{ fontSize: '0.875rem', color: '#718096', marginBottom: '0.5rem' }}>Update Status</div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button 
              className={`btn ${task.status === 'pending' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              onClick={() => handleStatusChange('pending')}
            >
              Pending
            </button>
            <button 
              className={`btn ${task.status === 'in-progress' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              onClick={() => handleStatusChange('in-progress')}
            >
              In Progress
            </button>
            <button 
              className={`btn ${task.status === 'completed' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              onClick={() => handleStatusChange('completed')}
            >
              Completed
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Reminder History</h3>
        </div>
        {reminders.length === 0 ? (
          <div className="empty-state">
            <p>No reminders sent yet</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Sent At</th>
                  <th>Type</th>
                  <th>Channel</th>
                  <th>Tone</th>
                  <th>Status</th>
                  <th>Message Preview</th>
                </tr>
              </thead>
              <tbody>
                {reminders.map(reminder => (
                  <tr key={reminder._id}>
                    <td>{new Date(reminder.sentAt).toLocaleString()}</td>
                    <td><span className="badge badge-medium">{reminder.type}</span></td>
                    <td>{reminder.channel}</td>
                    <td><span className={`badge badge-${reminder.tone}`}>{reminder.tone}</span></td>
                    <td><span className={`badge badge-${reminder.status}`}>{reminder.status}</span></td>
                    <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {reminder.message.substring(0, 100)}...
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default TaskDetail;