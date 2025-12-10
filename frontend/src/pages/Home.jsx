import { useState, useEffect } from 'react';
import { tasksAPI, authAPI } from '../utils/api';
import ThemeSelector from '../components/ThemeSelector';
import { 
  Zap, 
  List, 
  Timer, 
  BarChart3, 
  Target, 
  CheckSquare, 
  Plus, 
  Play, 
  Edit2,
  Sparkles,
  TrendingUp,
  LogOut
} from 'lucide-react';
import './Home.css';

function Home({ user, onLogout }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load tasks on mount
  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const response = await tasksAPI.getTasks();
      if (response.success) {
        setTasks(response.tasks);
      }
    } catch (err) {
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (err) {
      console.error('Logout error:', err);
    }
    onLogout();
  };

  const getCurrentDate = () => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date().toLocaleDateString('en-US', options);
  };

  return (
    <div className="home-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-container">
            <div className="logo-main">OXY</div>
            <div className="logo-sub">Productivity</div>
          </div>
        </div>

        <nav className="nav-menu">
          <a href="#" className="nav-item active">
            <Zap className="nav-icon" size={20} />
            <span>Today</span>
            <span className="nav-badge">2</span>
          </a>
          <a href="#" className="nav-item">
            <List className="nav-icon" size={20} />
            <span>Backlog</span>
          </a>
          <a href="#" className="nav-item">
            <Timer className="nav-icon" size={20} />
            <span>Pomodoro</span>
          </a>
          <a href="#" className="nav-item">
            <BarChart3 className="nav-icon" size={20} />
            <span>Analytics</span>
          </a>
        </nav>

        <div className="sidebar-footer">
          <ThemeSelector />
          
          <div className="user-info">
            <div className="user-avatar">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="user-details">
              <div className="user-name">{user?.name || 'User'}</div>
              <div className="user-email">{user?.email}</div>
            </div>
          </div>
          
          <button onClick={handleLogout} className="logout-button">
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="content-header">
          <div>
            <h1 className="page-title">Good Day, {user?.name?.split(' ')[0] || 'there'}!</h1>
            <p className="page-subtitle">{getCurrentDate()}</p>
          </div>
        </header>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading your workspace...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <p>{error}</p>
          </div>
        ) : (
          <div className="content-grid">
            {/* Daily Highlight Section */}
            <section className="highlight-section">
              <div className="section-header">
                <div className="section-title">
                  <Target size={24} className="section-icon" />
                  <h2>Daily Highlight</h2>
                </div>
                <p>Your most important task today</p>
              </div>
              <div className="highlight-card empty">
                <div className="empty-state">
                  <Sparkles size={48} className="empty-icon" />
                  <p>No highlight set yet</p>
                  <button className="btn-secondary">
                    <Plus size={16} />
                    Set Your Highlight
                  </button>
                </div>
              </div>
            </section>

            {/* Tasks Section */}
            <section className="tasks-section">
              <div className="section-header">
                <div className="section-title">
                  <CheckSquare size={24} className="section-icon" />
                  <h2>Your Tasks</h2>
                </div>
                <button className="btn-primary">
                  <Plus size={18} />
                  Add Task
                </button>
              </div>
              
              {tasks.length === 0 ? (
                <div className="empty-state-card">
                  <CheckSquare size={48} className="empty-icon" />
                  <p>No tasks yet. Create your first task to get started!</p>
                </div>
              ) : (
                <div className="tasks-grid">
                  {tasks.map((task) => (
                    <div key={task.id} className="task-card">
                      <div className="task-header">
                        <h3 className="task-title">{task.title}</h3>
                        <span className={`priority-badge priority-${task.priority}`}>
                          {task.priority}
                        </span>
                      </div>
                      {task.description && (
                        <p className="task-description">{task.description}</p>
                      )}
                      <div className="task-footer">
                        <button className="task-action">
                          <Play size={14} />
                          Start
                        </button>
                        <button className="task-action-icon">
                          <Edit2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Quick Stats */}
            <section className="stats-section">
              <div className="section-header">
                <div className="section-title">
                  <TrendingUp size={24} className="section-icon" />
                  <h2>Quick Stats</h2>
                </div>
              </div>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-value">0</div>
                  <div className="stat-label">Tasks Today</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">0</div>
                  <div className="stat-label">Completed</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">0</div>
                  <div className="stat-label">Pomodoros</div>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

export default Home;

