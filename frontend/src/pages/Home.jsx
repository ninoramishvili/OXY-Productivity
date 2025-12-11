import { useState, useEffect } from 'react';
import { tasksAPI, tagsAPI, pomodoroAPI } from '../utils/api';
import TaskModal from '../components/TaskModal';
import ConfirmModal from '../components/ConfirmModal';
import PomodoroTimer from '../components/PomodoroTimer';
import FloatingTimer from '../components/FloatingTimer';
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
  X,
  GripVertical,
  Timer,
  Clock,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Calendar
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
import './Home.css';

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

// Sortable Task Card Component
function SortableTaskCard({ task, isHighlight, isFrog, onToggleComplete, onEditTask, onDeleteTask, onToggleHighlight, onToggleFrog, onStartPomodoro, onResetPomodoro }) {
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
      className={`task-card ${task.completed ? 'completed' : ''} ${isHighlight ? 'is-highlight' : ''} ${isDragging ? 'dragging' : ''}`}
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
          {isHighlight && <span className="task-emoji-indicator" title="Daily Highlight">✨</span>}
          {task.is_frog && <span className="task-emoji-indicator" title="Your Frog - Hardest Task">🐸</span>}
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
        {(task.time_spent > 0 || task.pomodoro_count > 0) && (
          <button 
            className="reset-pomodoro-btn"
            onClick={(e) => {
              e.stopPropagation();
              onResetPomodoro(task.id);
            }}
            title="Reset Pomodoro data"
          >
            <RotateCcw size={12} />
          </button>
        )}
      </div>
      
      <div className="task-footer">
        <button 
          className="task-action-icon pomodoro-btn"
          onClick={() => onStartPomodoro(task)}
          title="Start Pomodoro"
          disabled={task.completed}
          style={{ opacity: task.completed ? 0.5 : 1, cursor: task.completed ? 'not-allowed' : 'pointer' }}
        >
          <Timer size={16} />
        </button>
        <button 
          className={`task-action-icon highlight-btn ${isHighlight ? 'active' : ''}`}
          onClick={() => onToggleHighlight(task.id)}
          title={isHighlight ? "Remove Highlight" : "Set as Daily Highlight"}
          disabled={task.completed}
          style={{ opacity: task.completed ? 0.5 : 1, cursor: task.completed ? 'not-allowed' : 'pointer' }}
        ></button>
        <button 
          className={`task-action-icon frog-btn ${isFrog ? 'active' : ''}`}
          onClick={() => onToggleFrog(task.id)}
          title={isFrog ? "Remove Frog" : "Mark as Frog (Hardest Task)"}
          disabled={task.completed}
          style={{ opacity: task.completed ? 0.5 : 1, cursor: task.completed ? 'not-allowed' : 'pointer' }}
        ></button>
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

function Home({ user }) {
  const [tasks, setTasks] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, taskId: null });
  const [resetPomodoroConfirm, setResetPomodoroConfirm] = useState({ isOpen: false, taskId: null });
  const [sortBy, setSortBy] = useState('manual');
  const [showCelebration, setShowCelebration] = useState(false);
  const [activePomodoroTask, setActivePomodoroTask] = useState(null);
  const [showPomodoroComplete, setShowPomodoroComplete] = useState(false);
  const [showFloatingTimer, setShowFloatingTimer] = useState(false);
  const [showHighlightCelebration, setShowHighlightCelebration] = useState(false);
  const [showFrogCelebration, setShowFrogCelebration] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Load tasks and tags on mount
  useEffect(() => {
    loadTasks();
    loadTags();
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

  // Date navigation functions
  const getCurrentDate = () => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return selectedDate.toLocaleDateString('en-US', options);
  };

  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  const handlePrevDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const handleGoToToday = () => {
    setSelectedDate(new Date());
  };

  // Task filtering and sorting
  const getFilteredTasks = () => {
    // Convert selected date to YYYY-MM-DD string in local time
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const selectedDateString = `${year}-${month}-${day}`;

    // Filter tasks for the selected date
    const dayTasks = tasks.filter(task => {
      // If task has no date, it shouldn't appear in calendar view (it's backlog)
      if (!task.scheduled_date) return false;
      
      // Get task date string (handle both ISO string and YYYY-MM-DD format)
      const taskDate = task.scheduled_date.split('T')[0];
      return taskDate === selectedDateString;
    });

    return dayTasks;
  };

  const getSortedTasks = () => {
    const sorted = [...getFilteredTasks()];
    
    if (sortBy === 'manual') {
      // Manual order - use display_order
      sorted.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    } else {
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
    }
    return sorted;
  };

  const getStats = () => {
    const dayTasks = getFilteredTasks();
    const completedToday = dayTasks.filter(t => t.completed).length;
    const totalCompleted = tasks.filter(t => t.completed).length;
    
    return {
      todayTasks: dayTasks.length,
      completedToday,
      totalCompleted
    };
  };

  // Highlight and Frog logic - filter by selected date
  const getHighlightedTask = () => {
    const selectedDateString = getLocalDateString(selectedDate);
    
    // Find task that is: highlighted AND scheduled for this day
    return getFilteredTasks().find(task => {
      if (!task.is_daily_highlight) return false;
      return true; // Task is already filtered by date via getFilteredTasks
    });
  };

  const getFrogTask = () => {
    // Find task that is: frog AND scheduled for this day (keep showing even when completed)
    return getFilteredTasks().find(task => task.is_frog);
  };

  // Helper to get local date string (YYYY-MM-DD) without timezone shift
  const getLocalDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Task CRUD handlers
  const handleCreateTask = () => {
    setEditingTask({
      scheduled_date: getLocalDateString(selectedDate)
    });
    setIsModalOpen(true);
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleSaveTask = async (taskData) => {
    try {
      if (editingTask && editingTask.id) {
        // Update existing task
        const response = await tasksAPI.updateTask(editingTask.id, taskData);
        if (response.success) {
          // Also update Eisenhower quadrant if changed
          if (taskData.isUrgent !== undefined && taskData.isImportant !== undefined) {
            await tasksAPI.updateEisenhower(editingTask.id, taskData.isUrgent, taskData.isImportant);
          }
          showSuccess('Task updated successfully!');
          loadTasks();
        }
      } else {
        // Create new task - include scheduled_date using local date
        const createData = {
          ...taskData,
          scheduledDate: editingTask?.scheduled_date || getLocalDateString(selectedDate)
        };
        const response = await tasksAPI.createTask(createData);
        if (response.success) {
          showSuccess('Task created successfully!');
          loadTasks();
        }
      }
      setIsModalOpen(false);
      setEditingTask(null);
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

  // Highlight handlers - toggle functionality
  const handleToggleHighlight = async (taskId) => {
    try {
      // Check if task is already highlighted
      const task = tasks.find(t => t.id === taskId);
      if (task?.is_daily_highlight) {
        // Remove highlight
        const response = await tasksAPI.removeHighlight(taskId);
        if (response.success) {
          showSuccess('Highlight removed');
          await loadTasks();
        }
      } else {
        // Set as highlight with selected date
        const localDate = getLocalDateString(selectedDate);
        const response = await tasksAPI.setHighlight(taskId, localDate);
        if (response.success) {
          showSuccess('✨ Task set as Daily Highlight!');
          await loadTasks();
        }
      }
    } catch (err) {
      console.error('Highlight error:', err);
      alert('Failed to update highlight: ' + (err.response?.data?.message || err.message));
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

  // Frog handlers - toggle functionality
  const handleToggleFrog = async (taskId) => {
    try {
      // Check if task is already a frog
      const task = tasks.find(t => t.id === taskId);
      if (task?.is_frog) {
        // Remove frog status
        const response = await tasksAPI.removeFrog(taskId);
        if (response.success) {
          showSuccess('Frog status removed');
          await loadTasks();
        }
      } else {
        // Set as frog
        const response = await tasksAPI.setFrog(taskId);
        if (response.success) {
          showSuccess('🐸 Task marked as your Frog!');
          await loadTasks();
        }
      }
    } catch (err) {
      alert('Failed to update frog: ' + (err.response?.data?.message || err.message));
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

  // Drag and drop handler
  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const filteredTasks = getFilteredTasks();
      const oldIndex = filteredTasks.findIndex((task) => task.id === active.id);
      const newIndex = filteredTasks.findIndex((task) => task.id === over.id);

      const newTasks = arrayMove(filteredTasks, oldIndex, newIndex);
      
      // Update display_order for all tasks
      const taskOrders = newTasks.map((task, index) => ({
        id: task.id,
        display_order: index
      }));

      // Optimistically update UI
      const updatedTasks = tasks.map(task => {
        const newOrder = taskOrders.find(t => t.id === task.id);
        return newOrder ? { ...task, display_order: newOrder.display_order } : task;
      });
      setTasks(updatedTasks);

      // Save to backend
      try {
        await tasksAPI.reorderTasks(taskOrders);
      } catch (err) {
        console.error('Failed to save task order:', err);
        // Revert on error
        loadTasks();
      }
    }
  };

  // Pomodoro handlers
  const handleStartPomodoro = (task) => {
    setActivePomodoroTask(task);
  };

  const handlePomodoroComplete = () => {
    setShowPomodoroComplete(true);
    setTimeout(() => {
      setShowPomodoroComplete(false);
      setActivePomodoroTask(null);
    }, 3000);
  };

  const handlePomodoroCancel = () => {
    setActivePomodoroTask(null);
  };

  const handleUpdateTaskFromPomodoro = (updatedTask) => {
    setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
  };

  const handleResetPomodoro = (taskId) => {
    setResetPomodoroConfirm({ isOpen: true, taskId });
  };

  const confirmResetPomodoro = async () => {
    const taskId = resetPomodoroConfirm.taskId;
    
    try {
      const response = await pomodoroAPI.resetTaskPomodoro(taskId);
      if (response.success && response.task) {
        setTasks(tasks.map(t => t.id === response.task.id ? response.task : t));
        showSuccess('Pomodoro data reset successfully!');
      }
    } catch (error) {
      console.error('Failed to reset pomodoro:', error);
      showSuccess('Failed to reset Pomodoro data');
    } finally {
      setResetPomodoroConfirm({ isOpen: false, taskId: null });
    }
  };

  // Get computed values
  const stats = getStats();
  const highlightedTask = getHighlightedTask();
  const frogTask = getFrogTask();
  const sortedTasks = getSortedTasks();

  if (loading) {
    return (
      <div className="home-page">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="home-page">
      {/* Success Message */}
      {successMessage && (
        <div className="success-message">
          {successMessage}
        </div>
      )}

      {/* Celebration Animation */}
      {showCelebration && (
        <div className="celebration-overlay">
          <div className="celebration-content">
            <span className="celebration-emoji">🎉</span>
            <h2>Amazing Work!</h2>
          </div>
        </div>
      )}

      {/* Header with date navigation */}
      <div className="home-header">
        <div className="header-left">
          <h1>
            <Target className="header-icon" />
            {isToday(selectedDate) ? 'Today' : 'Tasks'}
          </h1>
          <div className="date-navigation">
            <button className="nav-btn" onClick={handlePrevDay} title="Previous day">
              <ChevronLeft size={20} />
            </button>
            <div className="current-date-display">
              <Calendar size={16} className="calendar-icon" />
              <span>{getCurrentDate()}</span>
            </div>
            <button className="nav-btn" onClick={handleNextDay} title="Next day">
              <ChevronRight size={20} />
            </button>
            {!isToday(selectedDate) && (
              <button className="today-btn" onClick={handleGoToToday}>
                Today
              </button>
            )}
          </div>
        </div>
        <div className="header-actions">
          <button 
            className="floating-timer-toggle"
            onClick={() => setShowFloatingTimer(!showFloatingTimer)}
            title="Toggle Pomodoro Timer"
          >
            <Timer size={20} />
          </button>
          <select 
            className="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="manual">Manual Order</option>
            <option value="created_desc">Newest First</option>
            <option value="created_asc">Oldest First</option>
            <option value="name_asc">Name A-Z</option>
            <option value="name_desc">Name Z-A</option>
            <option value="priority">Priority</option>
          </select>
          <button className="btn-primary" onClick={handleCreateTask}>
            <Plus size={18} />
            Add Task
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="home-content">
        {/* Left Column - Tasks */}
        <div className="tasks-column">
          {/* Focus Sections Row - Highlight & Frog Side by Side */}
          <div className="focus-sections-row">
            {/* Daily Highlight Section */}
            <div className="highlight-section compact">
              <div className="section-header">
                <h2><span className="section-icon">✨</span> Daily Highlight</h2>
              </div>
              {highlightedTask ? (
                <div className={`highlight-card compact ${highlightedTask.completed ? 'completed' : ''}`}>
                  <div className="highlight-info">
                    <span className={`highlight-title ${highlightedTask.completed ? 'completed' : ''}`}>
                      {highlightedTask.completed && '✓ '}{highlightedTask.title}
                    </span>
                    <span className={`priority-badge quadrant-${getQuadrantInfo(highlightedTask).className}`}>
                      {getQuadrantInfo(highlightedTask).icon}
                    </span>
                  </div>
                  <div className="highlight-actions">
                    <button 
                      className={`btn-focus-complete ${highlightedTask.completed ? 'done' : ''}`}
                      onClick={() => handleToggleComplete(highlightedTask)}
                    >
                      <Check size={16} />
                      {highlightedTask.completed ? '🎉 Done!' : 'Complete'}
                    </button>
                    <button 
                      className="btn-focus-remove"
                      onClick={() => handleRemoveHighlight(highlightedTask.id)}
                      title="Remove from highlight"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <p className="no-highlight">Click ✨ on a task to set it as highlight</p>
              )}
            </div>

            {/* Eat That Frog Section */}
            <div className="frog-section compact">
              <div className="section-header">
                <h2><span className="section-icon">🐸</span> Eat That Frog</h2>
              </div>
              {frogTask ? (
                <div className={`frog-card compact ${frogTask.completed ? 'completed' : ''}`}>
                  <div className="frog-info">
                    <span className={`frog-title ${frogTask.completed ? 'completed' : ''}`}>
                      {frogTask.completed && '✓ '}{frogTask.title}
                    </span>
                    <span className={`priority-badge quadrant-${getQuadrantInfo(frogTask).className}`}>
                      {getQuadrantInfo(frogTask).icon}
                    </span>
                  </div>
                  <div className="frog-actions">
                    <button 
                      className={`btn-focus-complete frog ${frogTask.completed ? 'eaten' : ''}`}
                      onClick={() => handleToggleComplete(frogTask)}
                    >
                      <Check size={16} />
                      {frogTask.completed ? '🎉 Eaten!' : 'Eat It!'}
                    </button>
                    <button 
                      className="btn-focus-remove"
                      onClick={() => handleRemoveFrog(frogTask.id)}
                      title="Remove from frog"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <p className="no-frog">Click 🐸 on your hardest task</p>
              )}
            </div>
          </div>

          {/* Tasks List */}
          <div className="tasks-section">
            <div className="section-header">
              <h2><CheckSquare size={20} /> Tasks ({sortedTasks.length})</h2>
            </div>
            
            {sortedTasks.length === 0 ? (
              <div className="empty-state">
                <Sparkles size={48} />
                <h3>No tasks for {isToday(selectedDate) ? 'today' : 'this day'}</h3>
                <p>Add a task to get started!</p>
              </div>
            ) : (
              <DndContext 
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext 
                  items={sortedTasks.map(t => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="tasks-list">
                    {sortedTasks.map(task => (
                      <SortableTaskCard
                        key={task.id}
                        task={task}
                        isHighlight={highlightedTask?.id === task.id}
                        isFrog={frogTask?.id === task.id}
                        onToggleComplete={handleToggleComplete}
                        onEditTask={handleEditTask}
                        onDeleteTask={handleDeleteTask}
                        onToggleHighlight={handleToggleHighlight}
                        onToggleFrog={handleToggleFrog}
                        onStartPomodoro={handleStartPomodoro}
                        onResetPomodoro={handleResetPomodoro}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </div>

        {/* Right Column - Stats */}
        <div className="stats-column">
          <div className="quick-stats compact">
            <h3><TrendingUp size={18} /> Quick Stats</h3>
            <div className="stat-item">
              <span className="stat-label">{isToday(selectedDate) ? "Today's" : "Day's"} Tasks</span>
              <span className="stat-value">{stats.todayTasks}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Completed</span>
              <span className="stat-value">{stats.completedToday}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total Completed</span>
              <span className="stat-value">{stats.totalCompleted}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <TaskModal
        isOpen={isModalOpen}
        task={editingTask}
        tags={tags}
        onSave={handleSaveTask}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTask(null);
        }}
        onTagsUpdate={loadTags}
        onTasksUpdate={loadTasks}
      />

      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, taskId: null })}
      />

      <ConfirmModal
        isOpen={resetPomodoroConfirm.isOpen}
        title="Reset Pomodoro Data"
        message="Are you sure you want to reset the Pomodoro data for this task? This will clear all time spent and session count."
        onConfirm={confirmResetPomodoro}
        onCancel={() => setResetPomodoroConfirm({ isOpen: false, taskId: null })}
      />

      {activePomodoroTask && (
        <PomodoroTimer
          task={activePomodoroTask}
          onComplete={handlePomodoroComplete}
          onCancel={handlePomodoroCancel}
          onUpdateTask={handleUpdateTaskFromPomodoro}
          onClose={() => setActivePomodoroTask(null)}
        />
      )}

      {showFloatingTimer && (
        <FloatingTimer onClose={() => setShowFloatingTimer(false)} />
      )}
    </div>
  );
}

export default Home;
