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
  Star,
  X
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
  const [showCelebration, setShowCelebration] = useState(false);

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
        console.log('Loaded tasks:', response.tasks);
        console.log('First task highlight fields:', response.tasks[0]?.is_daily_highlight, response.tasks[0]?.highlight_date);
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
        // Show celebration if completing a daily highlight or frog
        if (!task.completed && task.is_daily_highlight) {
          setShowCelebration(true);
          setTimeout(() => setShowCelebration(false), 3000);
          showSuccess('🎉 Daily Highlight Completed! Amazing work!');
        } else if (!task.completed && task.is_frog) {
          setShowCelebration(true);
          setTimeout(() => setShowCelebration(false), 3000);
          showSuccess('🐸 You Ate That Frog! Incredible!');
        } else {
          showSuccess(task.completed ? 'Task reopened!' : 'Task completed!');
        }
        loadTasks();
      }
    } catch (err) {
      alert('Failed to update task');
    }
  };

  const handleSetHighlight = async (taskId) => {
    try {
      // Get user's local date (in their timezone)
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const localDate = `${year}-${month}-${day}`;
      
      const response = await tasksAPI.setHighlight(taskId, localDate);
      if (response.success) {
        showSuccess('✨ Task set as Daily Highlight!');
        await loadTasks();
      }
    } catch (err) {
      console.error('Set highlight error:', err);
      alert('Failed to set highlight: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleRemoveHighlight = async (taskId) => {
    try {
      const response = await tasksAPI.removeHighlight(taskId);
      if (response.success) {
        showSuccess('Highlight removed');
        loadTasks();
      }
    } catch (err) {
      alert('Failed to remove highlight');
    }
  };

  const handleSetFrog = async (taskId) => {
    try {
      const response = await tasksAPI.setFrog(taskId);
      if (response.success) {
        showSuccess('🐸 Task marked as your Frog!');
        await loadTasks();
      }
    } catch (err) {
      alert('Failed to set frog: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleRemoveFrog = async (taskId) => {
    try {
      const response = await tasksAPI.removeFrog(taskId);
      if (response.success) {
        showSuccess('Frog status removed');
        loadTasks();
      }
    } catch (err) {
      alert('Failed to remove frog');
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
        onTasksUpdate={loadTasks}
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
            {/* Celebration Animation */}
            {showCelebration && (() => {
              const completedTask = tasks.find(t => t.completed && (t.is_daily_highlight || t.is_frog));
              const isFrog = completedTask?.is_frog;
              
              return (
                <div className="celebration-overlay">
                  <div className="celebration-content">
                    {isFrog ? (
                      <>
                        <span style={{ fontSize: '80px' }}>🐸</span>
                        <h2>You Ate That Frog! 🎉</h2>
                        <p>The hardest task is done!</p>
                      </>
                    ) : (
                      <>
                        <Sparkles size={64} className="celebration-icon" />
                        <h2>Outstanding! 🎉</h2>
                        <p>You completed your Daily Highlight!</p>
                      </>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Daily Highlight and Frog Section */}
            <div className="focus-sections">
              {/* Daily Highlight */}
              <section className="focus-card">
                <div className="focus-header">
                  <div className="cute-icon highlight-icon">✨</div>
                  <div>
                    <h3>Daily Highlight</h3>
                    <p className="focus-subtitle">Most Important Task</p>
                  </div>
                </div>
                {(() => {
                  const now = new Date();
                  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                  const highlightedTask = tasks.find(t => {
                    if (!t.is_daily_highlight) return false;
                    const taskDate = t.highlight_date ? new Date(t.highlight_date).toISOString().split('T')[0] : null;
                    return t.is_daily_highlight && taskDate === today;
                  });
                  
                  if (!highlightedTask) {
                    return (
                      <div className="focus-empty">
                        <Sparkles size={32} className="empty-icon" />
                        <p>No highlight set</p>
                      </div>
                    );
                  }
                  
                  return (
                    <div className={`focus-task ${highlightedTask.completed ? 'completed' : ''}`}>
                      <div className="focus-task-header">
                        <div className="focus-task-content">
                          <h4 className="focus-task-title">{highlightedTask.title}</h4>
                          {highlightedTask.tags && highlightedTask.tags.length > 0 && (
                            <div className="focus-tags">
                              {highlightedTask.tags.slice(0, 2).map(tag => (
                                <span 
                                  key={tag.id} 
                                  className="focus-tag"
                                  style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                                >
                                  {tag.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <button 
                          className="focus-remove"
                          onClick={() => handleRemoveHighlight(highlightedTask.id)}
                        >
                          <X size={16} />
                        </button>
                      </div>
                      <button 
                        className={`focus-complete-btn ${highlightedTask.completed ? 'completed' : ''}`}
                        onClick={() => handleToggleComplete(highlightedTask)}
                      >
                        {highlightedTask.completed ? (
                          <>
                            <Check size={18} />
                            Completed!
                          </>
                        ) : (
                          <>
                            <Check size={18} />
                            Complete Highlight
                          </>
                        )}
                      </button>
                    </div>
                  );
                })()}
              </section>

              {/* Eat That Frog */}
              <section className="focus-card frog-card">
                <div className="focus-header">
                  <div className="cute-icon frog-icon">🐸</div>
                  <div>
                    <h3>Eat That Frog</h3>
                    <p className="focus-subtitle">Hardest Task First</p>
                  </div>
                </div>
                {(() => {
                  const frogTask = tasks.find(t => t.is_frog);
                  
                  if (!frogTask) {
                    return (
                      <div className="focus-empty">
                        <span style={{ fontSize: '32px' }}>🐸</span>
                        <p>No frog set</p>
                      </div>
                    );
                  }
                  
                  return (
                    <div className={`focus-task ${frogTask.completed ? 'completed' : ''}`}>
                      <div className="focus-task-header">
                        <div className="focus-task-content">
                          <h4 className="focus-task-title">{frogTask.title}</h4>
                          {frogTask.tags && frogTask.tags.length > 0 && (
                            <div className="focus-tags">
                              {frogTask.tags.slice(0, 2).map(tag => (
                                <span 
                                  key={tag.id} 
                                  className="focus-tag"
                                  style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                                >
                                  {tag.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <button 
                          className="focus-remove"
                          onClick={() => handleRemoveFrog(frogTask.id)}
                        >
                          <X size={16} />
                        </button>
                      </div>
                      <button 
                        className={`focus-complete-btn ${frogTask.completed ? 'completed' : ''}`}
                        onClick={() => handleToggleComplete(frogTask)}
                      >
                        {frogTask.completed ? (
                          <>
                            <Check size={18} />
                            Completed!
                          </>
                        ) : (
                          <>
                            🐸
                            Eat That Frog
                          </>
                        )}
                      </button>
                    </div>
                  );
                })()}
              </section>
            </div>

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
                  {getSortedTasks().map((task) => {
                    // Get user's local date (not UTC)
                    const now = new Date();
                    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                    const taskDate = task.highlight_date ? new Date(task.highlight_date).toISOString().split('T')[0] : null;
                    const isHighlight = task.is_daily_highlight && taskDate === today;
                    
                    return (
                      <div key={task.id} className={`task-card ${task.completed ? 'completed' : ''} ${isHighlight ? 'is-highlight' : ''}`}>
                        <div className="task-header">
                          <div className="task-title-row">
                            <button 
                              className="task-checkbox"
                              onClick={() => handleToggleComplete(task)}
                              title={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
                            >
                              {task.completed ? <Check size={18} /> : <div className="checkbox-empty" />}
                            </button>
                            <h3 className="task-title">{task.title}</h3>
                            {isHighlight && <Star size={16} className="highlight-indicator" fill="currentColor" />}
                            {task.is_frog && <span className="frog-indicator" title="Your Frog - Hardest Task">🐸</span>}
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
                          {!isHighlight && !task.completed && (
                            <button 
                              className="task-action-icon highlight-btn"
                              onClick={() => handleSetHighlight(task.id)}
                              title="Set as Daily Highlight"
                            >
                              <Star size={16} />
                            </button>
                          )}
                          {!task.completed && (
                            task.is_frog ? (
                              <button 
                                className="task-action-icon frog-btn active"
                                onClick={() => handleRemoveFrog(task.id)}
                                title="Remove Frog status"
                              >
                                🐸
                              </button>
                            ) : (
                              <button 
                                className="task-action-icon frog-btn"
                                onClick={() => handleSetFrog(task.id)}
                                title="Mark as Frog (Hardest Task)"
                              >
                                🐸
                              </button>
                            )
                          )}
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
                    );
                  })}
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

