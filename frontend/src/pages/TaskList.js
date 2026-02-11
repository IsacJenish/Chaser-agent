import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { tasksAPI, remindersAPI } from '../services/api';
import { Plus, Search, Send } from 'lucide-react';
import CreateTaskModal from '../components/CreateTaskModal';

function TaskList() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterStatus !== 'all') params.status = filterStatus;
      if (filterPriority !== 'all') params.priority = filterPriority;
      
      const response = await tasksAPI.getAll(params);
      setTasks(response.data.tasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterPriority]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleSendReminder = async (taskId) => {
    try {
      await remindersAPI.sendManual({ taskId });
      alert('Reminder sent successfully!');
      loadTasks();
    } catch (error) {
      alert('Error sending reminder: ' + error.message);
    }
  };

  const filteredTasks = tasks.filter(task => 
    task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.assignee.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>Tasks</h1>
            <p>Manage all tasks and deadlines</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#718096' }} />
              <input
                type="text"
                className="form-input"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
          </div>

          <div>
            <select 
              className="form-select" 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ minWidth: '150px' }}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div>
            <select 
              className="form-select" 
              value={filterPriority} 
              onChange={(e) => setFilterPriority(e.target.value)}
              style={{ minWidth: '150px' }}
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="empty-state">
            <h3>No tasks found</h3>
            <p>Create your first task to get started</p>
            <button className="btn btn-primary" onClick={() => setShowCreateModal(true)} style={{ marginTop: '1rem' }}>
              <Plus size={16} />
              <span>Create Task</span>
            </button>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Assignee</th>
                  <th>Due Date</th>
                  <th>Days Until Due</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Reminders</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map(task => (
                  <tr key={task._id}>
                    <td>
                      <Link to={`/tasks/${task._id}`} style={{ color: '#667eea', textDecoration: 'none', fontWeight: 500 }}>
                        {task.title}
                      </Link>
                    </td>
                    <td>
                      <div>
                        <div style={{ fontWeight: 500 }}>{task.assignee.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#718096' }}>{task.assignee.email}</div>
                      </div>
                    </td>
                    <td>{new Date(task.dueDate).toLocaleDateString()}</td>
                    <td>
                      {task.isOverdue ? (
                        <span style={{ color: '#f56565', fontWeight: 600 }}>
                          {Math.abs(task.daysUntilDue)} days overdue
                        </span>
                      ) : task.daysUntilDue === 0 ? (
                        <span style={{ color: '#ed8936', fontWeight: 600 }}>Due today</span>
                      ) : (
                        <span>{task.daysUntilDue} days</span>
                      )}
                    </td>
                    <td><span className={`badge badge-${task.status}`}>{task.status}</span></td>
                    <td><span className={`badge badge-${task.priority}`}>{task.priority}</span></td>
                    <td>{task.reminderCount || 0}</td>
                    <td>
                      <button 
                        className="btn btn-secondary btn-sm" 
                        onClick={() => handleSendReminder(task._id)}
                        disabled={task.status === 'completed'}
                      >
                        <Send size={14} />
                        Send
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateTaskModal 
          onClose={() => setShowCreateModal(false)} 
          onSuccess={() => {
            setShowCreateModal(false);
            loadTasks();
          }}
        />
      )}
    </div>
  );
}

export default TaskList;