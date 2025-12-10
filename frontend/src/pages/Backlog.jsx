import { useState, useEffect } from 'react';
import { tasksAPI, tagsAPI } from '../utils/api';
import TaskModal from '../components/TaskModal';
import ConfirmModal from '../components/ConfirmModal';
import { 
  Search, 
  Filter,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  ListTodo,
  AlertCircle
} from 'lucide-react';
import './Backlog.css';

function Backlog() {
  const [tasks, setTasks] = useState([]);
  const [tags, setTags] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, taskId: null });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadTasks();
    loadTags();
  }, []);

  useEffect(() => {
    filterTasks();
  }, [tasks, searchQuery, priorityFilter, statusFilter]);

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

  const filterTasks = () => {
    let filtered = [...tasks];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query)
      );
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(task => task.priority === priorityFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'completed') {
        filtered = filtered.filter(task => task.completed);
      } else if (statusFilter === 'active') {
        filtered = filtered.filter(task => !task.completed);
      }
    }

    setFilteredTasks(filtered);
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
        const response = await tasksAPI.updateTask(editingTask.id, taskData);
        if (response.success) {
          showSuccess('Task updated successfully!');
          loadTasks();
        }
      } else {
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

  const clearFilters = () => {
    setSearchQuery('');
    setPriorityFilter('all');
    setStatusFilter('all');
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (searchQuery) count++;
    if (priorityFilter !== 'all') count++;
    if (statusFilter !== 'all') count++;
    return count;
  };

  return (
    <div className="backlog-container">
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

      {/* Header */}
      <div className="backlog-header">
        <div className="header-title">
          <ListTodo size={32} className="header-icon" />
          <div>
            <h1>Backlog</h1>
            <p className="header-subtitle">
              {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
              {getActiveFilterCount() > 0 && ` (filtered)`}
            </p>
          </div>
        </div>
        <button className="btn-add-task" onClick={handleCreateTask}>
          <Plus size={18} />
          Add Task
        </button>
      </div>

      {/* Search and Filters */}
      <div className="backlog-controls">
        <div className="search-container">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-search" onClick={() => setSearchQuery('')}>
              <X size={16} />
            </button>
          )}
        </div>

        <button 
          className={`btn-filter ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={16} />
          Filters
          {getActiveFilterCount() > 0 && (
            <span className="filter-badge">{getActiveFilterCount()}</span>
          )}
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="filter-panel">
          <div className="filter-group">
            <label>Priority</label>
            <div className="filter-buttons">
              <button 
                className={priorityFilter === 'all' ? 'active' : ''}
                onClick={() => setPriorityFilter('all')}
              >
                All
              </button>
              <button 
                className={priorityFilter === 'high' ? 'active priority-high-btn' : ''}
                onClick={() => setPriorityFilter('high')}
              >
                High
              </button>
              <button 
                className={priorityFilter === 'medium' ? 'active priority-medium-btn' : ''}
                onClick={() => setPriorityFilter('medium')}
              >
                Medium
              </button>
              <button 
                className={priorityFilter === 'low' ? 'active priority-low-btn' : ''}
                onClick={() => setPriorityFilter('low')}
              >
                Low
              </button>
            </div>
          </div>

          <div className="filter-group">
            <label>Status</label>
            <div className="filter-buttons">
              <button 
                className={statusFilter === 'all' ? 'active' : ''}
                onClick={() => setStatusFilter('all')}
              >
                All
              </button>
              <button 
                className={statusFilter === 'active' ? 'active' : ''}
                onClick={() => setStatusFilter('active')}
              >
                Active
              </button>
              <button 
                className={statusFilter === 'completed' ? 'active' : ''}
                onClick={() => setStatusFilter('completed')}
              >
                Completed
              </button>
            </div>
          </div>

          {getActiveFilterCount() > 0 && (
            <button className="btn-clear-filters" onClick={clearFilters}>
              <X size={14} />
              Clear All Filters
            </button>
          )}
        </div>
      )}

      {/* Task List */}
      <div className="backlog-content">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading tasks...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <AlertCircle size={48} />
            <p>{error}</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="empty-state">
            <ListTodo size={64} className="empty-icon" />
            <h3>
              {tasks.length === 0 
                ? 'No tasks yet' 
                : 'No tasks found'}
            </h3>
            <p>
              {tasks.length === 0
                ? 'Create your first task to get started!'
                : 'Try adjusting your filters or search query'}
            </p>
            {tasks.length === 0 && (
              <button className="btn-create-first" onClick={handleCreateTask}>
                <Plus size={18} />
                Create Task
              </button>
            )}
          </div>
        ) : (
          <div className="tasks-list">
            {filteredTasks.map((task) => (
              <div key={task.id} className={`backlog-task-card ${task.completed ? 'completed' : ''}`}>
                <div className="task-main">
                  <button 
                    className="task-checkbox"
                    onClick={() => handleToggleComplete(task)}
                    title={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
                  >
                    {task.completed ? <Check size={18} /> : <div className="checkbox-empty" />}
                  </button>
                  
                  <div className="task-content">
                    <div className="task-header-row">
                      <h3 className="task-title">{task.title}</h3>
                      <span className={`priority-badge priority-${task.priority}`}>
                        {task.priority}
                      </span>
                    </div>
                    
                    {task.description && (
                      <p className="task-description">{task.description}</p>
                    )}
                    
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
                  </div>
                </div>

                <div className="task-actions">
                  <button 
                    className="task-action-btn edit"
                    onClick={() => handleEditTask(task)}
                    title="Edit task"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    className="task-action-btn delete"
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
      </div>
    </div>
  );
}

export default Backlog;

