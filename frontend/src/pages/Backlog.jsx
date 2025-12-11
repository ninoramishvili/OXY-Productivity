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
  AlertCircle,
  GripVertical,
  Clock
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import './Backlog.css';

// Helper to get Eisenhower quadrant info from task
const getQuadrantInfo = (task) => {
  if (task.is_urgent && task.is_important) {
    return { label: 'Do First', icon: '🔥', className: 'doFirst' };
  }
  if (!task.is_urgent && task.is_important) {
    return { label: 'Schedule', icon: '📅', className: 'schedule' };
  }
  if (task.is_urgent && !task.is_important) {
    return { label: 'Delegate', icon: '👥', className: 'delegate' };
  }
  return { label: 'Eliminate', icon: '🗑️', className: 'eliminate' };
};

// Sortable Task Card Component for Backlog
function SortableBacklogCard({ task, onToggleComplete, onEditTask, onDeleteTask }) {
  const quadrant = getQuadrantInfo(task);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`task-card ${task.completed ? 'completed' : ''} ${isDragging ? 'dragging' : ''}`}
    >
      <div className="task-header">
        <div className="task-title-row">
          <div className="drag-handle" {...attributes} {...listeners}>
            <GripVertical size={16} />
          </div>
          <button 
            className="task-checkbox"
            onClick={() => onToggleComplete(task)}
            title={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
          >
            {task.completed ? <Check size={18} /> : <div className="checkbox-empty" />}
          </button>
          <h3 className="task-title">{task.title}</h3>
        </div>
        <div className="task-header-right">
          {task.tags && task.tags.length > 0 && (
            <span 
              className="task-tag"
              style={{ 
                backgroundColor: `${task.tags[0].color}20`,
                color: task.tags[0].color,
                borderColor: `${task.tags[0].color}40`
              }}
            >
              {task.tags[0].name}
            </span>
          )}
          <span className={`priority-badge quadrant-${quadrant.className}`}>
            {quadrant.icon} {quadrant.label}
          </span>
        </div>
      </div>
      
      {/* Time stats - always show space */}
      <div className="task-time-stats">
        <span className="time-stat">
          <Clock size={12} />
          {task.time_spent > 0 ? Math.floor(task.time_spent / 60) : 0}m
        </span>
        <span className="time-stat">
          🍅 {task.pomodoro_count || 0}
        </span>
      </div>
      
      <div className="task-footer">
        <button 
          className="task-action-icon"
          onClick={() => onEditTask(task)}
          title="Edit task"
        >
          <Edit2 size={16} />
        </button>
        <button 
          className="task-action-icon delete"
          onClick={() => onDeleteTask(task.id)}
          title="Delete task"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

function Backlog() {
  const [tasks, setTasks] = useState([]);
  const [tags, setTags] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('manual'); // manual, created_asc, created_desc, name_asc, name_desc, priority
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, taskId: null });
  const [showFilters, setShowFilters] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    loadTasks();
    loadTags();
  }, []);

  useEffect(() => {
    filterAndSortTasks();
  }, [tasks, searchQuery, priorityFilter, statusFilter, sortBy]);

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

  const filterAndSortTasks = () => {
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

    // Sorting
    if (sortBy === 'manual') {
      filtered.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    } else {
      filtered.sort((a, b) => {
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
    }

    setFilteredTasks(filtered);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = filteredTasks.findIndex((task) => task.id === active.id);
      const newIndex = filteredTasks.findIndex((task) => task.id === over.id);

      const newTasks = arrayMove(filteredTasks, oldIndex, newIndex);
      
      // Update display_order for all tasks
      const taskOrders = newTasks.map((task, index) => ({
        id: task.id,
        display_order: index
      }));

      // Optimistically update UI
      setFilteredTasks(newTasks);

      // Save to backend
      try {
        await tasksAPI.reorderTasks(taskOrders);
        loadTasks(); // Reload to sync
      } catch (err) {
        console.error('Failed to save task order:', err);
        loadTasks(); // Revert on error
      }
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

      {/* Search, Sort and Filters */}
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

        <select 
          className="sort-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="manual">Manual Order (Drag)</option>
          <option value="created_desc">Newest First</option>
          <option value="created_asc">Oldest First</option>
          <option value="name_asc">Name (A-Z)</option>
          <option value="name_desc">Name (Z-A)</option>
          <option value="priority">Priority</option>
        </select>

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
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={filteredTasks.map(t => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="tasks-list">
                {filteredTasks.map((task) => (
                  <SortableBacklogCard
                    key={task.id}
                    task={task}
                    onToggleComplete={handleToggleComplete}
                    onEditTask={handleEditTask}
                    onDeleteTask={handleDeleteTask}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}

export default Backlog;

