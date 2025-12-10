import { useState, useEffect } from 'react';
import { tasksAPI, tagsAPI } from '../utils/api';
import TaskModal from '../components/TaskModal';
import ConfirmModal from '../components/ConfirmModal';
import { 
  Target, 
  CheckSquare, 
  Plus, 
  Edit2,
  Sparkles,
  TrendingUp,
  Trash2,
  Check,
  FileText
} from 'lucide-react';
import './Home.css';

function Home({ user }) {
  const [tasks, setTasks] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, taskId: null });
  const [sortBy, setSortBy] = useState('created_desc');
  const [hoveredTaskId, setHoveredTaskId] = useState(null);

  // Load tasks and tags on mount
  useEffect(() => {
    loadTasks();
    loadTags();
  }, []);

  // Sort tasks whenever sortBy changes
  const getSortedTasks = () => {
    const sorted = [...tasks];
    sorted.sort((a, b) => {
      switch (sortBy) {
        case 'created_desc':
          return new Date(b.created_at) - new Date(a.created_at);
        case 'created_asc':
          return new Date(a.created_at) - new Date(b.created_at);
        case 'name_asc':
          return a.title.localeCompare(b.title);
        case 'name_desc':
          return b.title.localeCompare(a.title);
        case 'priority':
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        default:
          return 0;
      }
    });
    return sorted;
  };

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

  const loadTags = async () => {
    try {
      const response = await tagsAPI.getTags();
      if (response.success) {
        setTags(response.tags);
      }
    } catch (err) {
      console.error('Failed to load tags:', err);
    }
  };

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleCreateTask = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleSaveTask = async (taskData) => {
    try {
      if (editingTask) {
        // Update existing task
        const response = await tasksAPI.updateTask(editingTask.id, taskData);
        if (response.success) {
          showSuccess('Task updated successfully!');
          loadTasks();
        }
      } else {
        // Create new task
        const response = await tasksAPI.createTask(taskData);
        if (response.success) {
          showSuccess('Task created successfully!');
          loadTasks();
        }
      }
      setIsModalOpen(false);
    } catch (err) {
      alert('Failed to save task: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleToggleComplete = async (task) => {
    try {
      const response = await tasksAPI.updateTask(task.id, {
        completed: !task.completed
      });
      if (response.success) {
        showSuccess(task.completed ? 'Task reopened!' : 'Task completed!');
        loadTasks();
      }
    } catch (err) {
      alert('Failed to update task');
    }
  };

  const handleDeleteTask = (taskId) => {
    setDeleteConfirm({ isOpen: true, taskId });
  };

  const confirmDelete = async () => {
    try {
      const response = await tasksAPI.deleteTask(deleteConfirm.taskId);
      if (response.success) {
        showSuccess('Task deleted successfully!');
        loadTasks();
      }
    } catch (err) {
      alert('Failed to delete task');
    } finally {
      setDeleteConfirm({ isOpen: false, taskId: null });
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

  const getStats = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayTasks = tasks.filter(t => t.scheduled_date === today);
    const completedToday = todayTasks.filter(t => t.completed).length;
    const totalCompleted = tasks.filter(t => t.completed).length;
    
    return {
      todayTasks: todayTasks.length,
      completedToday,
      totalCompleted
    };
  };

  const stats = getStats();

  return (
    <div className="home-page">
      {/* Success Message */}
      {successMessage && (
        <div className="success-toast">
          <Check size={18} />
          {successMessage}
        </div>
      )}

      {/* Task Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTask}
        task={editingTask}
        tags={tags}
        onTagsUpdate={loadTags}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, taskId: null })}
        onConfirm={confirmDelete}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
      />

      {/* Main Content */}
      <div className="home-main">
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
                <div className="section-actions">
                  <select 
                    className="sort-select-inline"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="created_desc">Newest First</option>
                    <option value="created_asc">Oldest First</option>
                    <option value="name_asc">Name (A-Z)</option>
                    <option value="name_desc">Name (Z-A)</option>
                    <option value="priority">Priority</option>
                  </select>
                  <button className="btn-primary" onClick={handleCreateTask}>
                    <Plus size={18} />
                    Add Task
                  </button>
                </div>
              </div>
              
              {tasks.length === 0 ? (
                <div className="empty-state-card">
                  <CheckSquare size={48} className="empty-icon" />
                  <p>No tasks yet. Create your first task to get started!</p>
                </div>
              ) : (
                <div className="tasks-grid">
                  {getSortedTasks().map((task) => (
                    <div key={task.id} className={`task-card ${task.completed ? 'completed' : ''}`}>
                      <div className="task-header">
                        <div className="task-title-row">
                          <button 
                            className="task-checkbox"
                            onClick={() => handleToggleComplete(task)}
                            title={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
                          >
                            {task.completed ? <Check size={18} /> : <div className="checkbox-empty" />}
                          </button>
                          <div className="task-title-container">
                            <h3 className="task-title">{task.title}</h3>
                            {task.description && (
                              <div 
                                className="description-indicator"
                                onMouseEnter={() => setHoveredTaskId(task.id)}
                                onMouseLeave={() => setHoveredTaskId(null)}
                              >
                                <FileText size={14} />
                                {hoveredTaskId === task.id && (
                                  <div className="description-tooltip">
                                    {task.description}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <span className={`priority-badge priority-${task.priority}`}>
                          {task.priority}
                        </span>
                      </div>
                      
                      {task.tags && task.tags.length > 0 && (
                        <div className="task-tags">
                          {task.tags.map(tag => (
                            <span 
                              key={tag.id} 
                              className="task-tag"
                              style={{ 
                                backgroundColor: `${tag.color}20`,
                                color: tag.color,
                                borderColor: `${tag.color}40`
                              }}
                            >
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      <div className="task-footer">
                        <button 
                          className="task-action-icon"
                          onClick={() => handleEditTask(task)}
                          title="Edit task"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          className="task-action-icon delete"
                          onClick={() => handleDeleteTask(task.id)}
                          title="Delete task"
                        >
                          <Trash2 size={16} />
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
                  <div className="stat-value">{tasks.length}</div>
                  <div className="stat-label">Total Tasks</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{stats.totalCompleted}</div>
                  <div className="stat-label">Completed</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{tasks.length - stats.totalCompleted}</div>
                  <div className="stat-label">Active</div>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;

