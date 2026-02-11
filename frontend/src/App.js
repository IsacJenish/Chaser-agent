import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import TaskList from './pages/TaskList';
import TaskDetail from './pages/TaskDetail';
import Analytics from './pages/Analytics';
import { LayoutDashboard, ListTodo, BarChart3 } from 'lucide-react';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <nav className="sidebar">
          <div className="logo">
            <h1>🎯 Chaser Agent</h1>
            <p>Automated Reminder System</p>
          </div>
          
          <ul className="nav-menu">
            <li>
              <Link to="/" className="nav-link">
                <LayoutDashboard size={20} />
                <span>Dashboard</span>
              </Link>
            </li>
            <li>
              <Link to="/tasks" className="nav-link">
                <ListTodo size={20} />
                <span>Tasks</span>
              </Link>
            </li>
            <li>
              <Link to="/analytics" className="nav-link">
                <BarChart3 size={20} />
                <span>Analytics</span>
              </Link>
            </li>
          </ul>

          <div className="sidebar-footer">
            <p>Built with ❤️ for Hacktims</p>
            <p>Powered by Boltic</p>
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tasks" element={<TaskList />} />
            <Route path="/tasks/:id" element={<TaskDetail />} />
            <Route path="/analytics" element={<Analytics />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;