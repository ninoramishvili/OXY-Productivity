import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  Calendar,
  List,
  LayoutGrid
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
        {task.estimated_minutes && (
          <span className={`time-stat estimate ${task.estimated_minutes <= 2 ? 'quick-task' : ''}`} title="Your estimate">
            ⏱️ {task.estimated_minutes}m
          </span>
        )}
        <span className="time-stat" title="Actual time spent">
          <Clock size={12} />
          {task.time_spent > 0 ? Math.floor(task.time_spent / 60) : 0}m
        </span>
        {/* Planning Fallacy: Show user-friendly accuracy message */}
        {task.estimated_minutes && task.time_spent > 0 && (() => {
          const actual = Math.floor(task.time_spent / 60);
          const estimate = task.estimated_minutes;
          const ratio = actual / estimate;
          const diff = actual - estimate;
          
          let message, className, icon;
          if (ratio <= 0.8) {
            message = `${Math.abs(diff)}m faster!`;
            className = 'accurate';
            icon = '🎯';
          } else if (ratio <= 1.1) {
            message = 'Spot on!';
            className = 'accurate';
            icon = '✅';
          } else if (ratio <= 1.5) {
            message = `+${diff}m over`;
            className = 'slightly-over';
            icon = '📊';
          } else {
            message = `+${diff}m under-estimated`;
            className = 'over';
            icon = '💡';
          }
          
          return (
            <span 
              className={`time-stat planning-fallacy ${className}`}
              title={`Planning Fallacy Check: You estimated ${estimate}m, took ${actual}m`}
            >
              {icon} {message}
            </span>
          );
        })()}
        <span className="time-stat" title="Pomodoro sessions">
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
  const [searchParams] = useSearchParams();
  
  // Parse date from URL or use today
  const getInitialDate = () => {
    const dateParam = searchParams.get('date');
    if (dateParam) {
      // Parse YYYY-MM-DD format
      const [year, month, day] = dateParam.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    return new Date();
  };

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
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
  const [showCelebration, setShowCelebration] = useState(false);
  const [activePomodoroTask, setActivePomodoroTask] = useState(null);
  const [showPomodoroComplete, setShowPomodoroComplete] = useState(false);
  const [showFloatingTimer, setShowFloatingTimer] = useState(false);
  const [showHighlightCelebration, setShowHighlightCelebration] = useState(false);
  const [showFrogCelebration, setShowFrogCelebration] = useState(false);
  const [selectedDate, setSelectedDate] = useState(getInitialDate);
  const timeSlotsRef = useRef(null);

  // Quick navigation - scroll to specific time range
  const scrollToTime = (hour) => {
    if (timeSlotsRef.current) {
      const slotHeight = 33; // 32px slot + 1px border
      const scrollPosition = hour * 2 * slotHeight; // 2 slots per hour (30 min each)
      timeSlotsRef.current.scrollTo({
        top: scrollPosition,
        behavior: 'smooth'
      });
    }
  };

  // Scroll to current time on calendar view load
  useEffect(() => {
    if (viewMode === 'calendar' && timeSlotsRef.current) {
      const currentHour = new Date().getHours();
      setTimeout(() => scrollToTime(Math.max(0, currentHour - 1)), 100);
    }
  }, [viewMode]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Update selectedDate when URL parameter changes
  useEffect(() => {
    const dateParam = searchParams.get('date');
    if (dateParam) {
      const [year, month, day] = dateParam.split('-').map(Number);
      setSelectedDate(new Date(year, month - 1, day));
    }
  }, [searchParams]);

  // Load tasks and tags on mount
  useEffect(() => {
    loadTasks();
    loadTags();
  }, []);

  // Hotkey: Ctrl+N to add task
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        handleCreateTask();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedDate]);

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
    // Exclude quick tasks (≤2 min) - they appear in Quick Wins section instead
    const sorted = [...getFilteredTasks()].filter(task => 
      !(task.estimated_minutes && task.estimated_minutes <= 2)
    );
    
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
            // Eisenhower quadrant order: Do First > Schedule > Delegate > Eliminate
            const getQuadrantOrder = (task) => {
              if (task.is_urgent && task.is_important) return 0; // Do First
              if (!task.is_urgent && task.is_important) return 1; // Schedule
              if (task.is_urgent && !task.is_important) return 2; // Delegate
              return 3; // Eliminate
            };
            return getQuadrantOrder(a) - getQuadrantOrder(b);
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

  // Get quick tasks (2-minute rule: estimated_minutes <= 2)
  const getQuickTasks = () => {
    // Include completed quick tasks - they stay in the section
    return getFilteredTasks().filter(task => 
      task.estimated_minutes && 
      task.estimated_minutes <= 2
    );
  };

  // Calculate total minutes for quick tasks (only incomplete ones)
  const getQuickTasksTotalMinutes = () => {
    return getQuickTasks()
      .filter(t => !t.completed)
      .reduce((sum, task) => sum + (task.estimated_minutes || 0), 0);
  };

  // Generate time slots for the calendar view (24 hours, 30-min intervals, 24h format)
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let min = 0; min < 60; min += 30) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
        
        slots.push({
          hour,
          minute: min,
          timeKey: `${hour}-${min}`,
          label: timeStr,
          displayLabel: timeStr // 24h format: "09:00", "14:30", etc.
        });
      }
    }
    return slots;
  };

  // Get tasks scheduled for a specific time slot (hour and minute)
  const getTasksForSlot = (hour, minute) => {
    return getFilteredTasks().filter(task => {
      if (!task.scheduled_time) return false;
      const [taskHour, taskMin] = task.scheduled_time.split(':').map(Number);
      // Match tasks that start in this 30-min slot
      return taskHour === hour && taskMin >= minute && taskMin < minute + 30;
    });
  };

  // Get tasks without a specific time (unscheduled within the day)
  const getUntimedTasks = () => {
    return getSortedTasks().filter(task => !task.scheduled_time);
  };

  // Get tasks with a specific time (time-blocked)
  const getTimedTasks = () => {
    return getSortedTasks().filter(task => task.scheduled_time);
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
          // Only update Eisenhower quadrant if task still has a date (not being unprioritized)
          // If date is being cleared, the backend already sets is_prioritized = false
          if (taskData.scheduledDate && taskData.isUrgent !== undefined && taskData.isImportant !== undefined) {
            await tasksAPI.updateEisenhower(editingTask.id, taskData.isUrgent, taskData.isImportant);
          }
          showSuccess('Task updated successfully!');
          loadTasks();
        }
      } else {
        // Create new task - use scheduledDate from form (can be empty for To Do/Eisenhower)
        const createData = {
          ...taskData,
          scheduledDate: taskData.scheduledDate || null,
          scheduledTime: taskData.scheduledTime || null
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
  const quickTasks = getQuickTasks();
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

          {/* Quick Wins Section - 2-Minute Rule */}
          {/* Quick Wins Section - Always visible */}
          <div className="quick-wins-section">
            <div className="section-header">
              <h2>
                <span className="section-icon">⚡</span> 
                Quick Wins ({quickTasks.length})
                {getQuickTasksTotalMinutes() > 0 && (
                  <span className="total-time">• {getQuickTasksTotalMinutes()}m total</span>
                )}
              </h2>
              <span className="section-hint">Tasks ≤2 min — do them now!</span>
            </div>
            {quickTasks.length > 0 ? (
              <div className="quick-wins-list">
                {quickTasks.map(task => (
                  <div key={task.id} className={`quick-task-card ${task.completed ? 'completed' : ''}`}>
                    <button 
                      className={`quick-checkbox ${task.completed ? 'checked' : ''}`}
                      onClick={() => handleToggleComplete(task)}
                      title={task.completed ? 'Mark incomplete' : 'Mark complete'}
                    >
                      {task.completed ? <Check size={14} /> : null}
                    </button>
                    <span className={`quick-task-title ${task.completed ? 'completed' : ''}`}>
                      {task.title}
                    </span>
                    <span className="quick-task-time">⏱️ {task.estimated_minutes}m</span>
                    <button 
                      className="quick-edit-btn"
                      onClick={() => handleEditTask(task)}
                      title="Edit task"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      className="quick-delete-btn"
                      onClick={() => handleDeleteTask(task.id)}
                      title="Delete task"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-quick-wins">No quick tasks yet. Add a task with ≤2 min estimate!</p>
            )}
          </div>

          {/* Tasks Section with View Toggle */}
          <div className="tasks-section">
            <div className="section-header">
              <h2><CheckSquare size={20} /> Tasks ({sortedTasks.length})</h2>
              <div className="view-toggle">
                <button 
                  className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                  title="List View"
                >
                  <List size={18} />
                </button>
                <button 
                  className={`view-btn ${viewMode === 'calendar' ? 'active' : ''}`}
                  onClick={() => setViewMode('calendar')}
                  title="Time Blocks (Parkinson's Law)"
                >
                  <LayoutGrid size={18} />
                </button>
              </div>
            </div>
            
            {viewMode === 'list' ? (
              // List View
              sortedTasks.length === 0 ? (
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
              )
            ) : (
              // Calendar/Time Block View (Parkinson's Law)
              <div className="time-block-view">
                <div className="parkinson-tip">
                  <span className="tip-icon">⏰</span>
                  <span className="tip-text">
                    <strong>Parkinson's Law:</strong> Work expands to fill the time available. 
                    Set specific time slots to create natural deadlines!
                  </span>
                </div>

                {/* Quick Navigation Bar */}
                <div className="time-nav-bar">
                  <button 
                    className="time-nav-btn" 
                    onClick={() => scrollToTime(6)}
                    title="Jump to 6:00"
                  >
                    🌅 Morning
                  </button>
                  <button 
                    className="time-nav-btn" 
                    onClick={() => scrollToTime(12)}
                    title="Jump to 12:00"
                  >
                    ☀️ Noon
                  </button>
                  <button 
                    className="time-nav-btn" 
                    onClick={() => scrollToTime(17)}
                    title="Jump to 17:00"
                  >
                    🌆 Evening
                  </button>
                  <button 
                    className="time-nav-btn" 
                    onClick={() => scrollToTime(21)}
                    title="Jump to 21:00"
                  >
                    🌙 Night
                  </button>
                  <button 
                    className="time-nav-btn now" 
                    onClick={() => scrollToTime(new Date().getHours())}
                    title="Jump to current time"
                  >
                    ⏰ Now
                  </button>
                </div>
                
                {/* Untimed tasks section */}
                {getUntimedTasks().length > 0 && (
                  <div className="untimed-tasks">
                    <h4>📋 Unscheduled ({getUntimedTasks().length})</h4>
                    <p className="untimed-hint">Drag to a time slot or edit to set a time</p>
                    <div className="untimed-list">
                      {getUntimedTasks().map(task => (
                        <div 
                          key={task.id} 
                          className={`time-block-task untimed ${task.completed ? 'completed' : ''}`}
                          onClick={() => handleEditTask(task)}
                        >
                          <span className="task-time-badge">No time</span>
                          <span className="task-name">{task.title}</span>
                          {task.estimated_minutes && (
                            <span className="task-duration">{task.estimated_minutes}m</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 30-minute time slots */}
                <div className="time-slots" ref={timeSlotsRef}>
                  {generateTimeSlots().map(slot => {
                    const slotTasks = getTasksForSlot(slot.hour, slot.minute);
                    const now = new Date();
                    const isCurrentSlot = now.getHours() === slot.hour && 
                      now.getMinutes() >= slot.minute && 
                      now.getMinutes() < slot.minute + 30 && 
                      isToday(selectedDate);
                    
                    return (
                      <div 
                        key={slot.timeKey} 
                        className={`time-slot ${isCurrentSlot ? 'current-slot' : ''} ${slotTasks.length > 0 ? 'has-tasks' : ''}`}
                      >
                        <div className="slot-time">
                          {slot.displayLabel}
                        </div>
                        <div className="slot-content">
                          {slotTasks.map(task => {
                            // Calculate height based on duration (44px per 30 min slot)
                            const duration = task.estimated_minutes || 30;
                            const slotsSpan = Math.ceil(duration / 30);
                            const taskHeight = slotsSpan * 32 - 4; // 32px per slot minus padding
                            
                            return (
                              <div 
                                key={task.id}
                                className={`calendar-task-card ${task.completed ? 'completed' : ''}`}
                                style={{ height: `${taskHeight}px` }}
                                onClick={() => handleEditTask(task)}
                              >
                                <div className="calendar-task-header">
                                  <button 
                                    className={`task-checkbox ${task.completed ? 'checked' : ''}`}
                                    onClick={(e) => { e.stopPropagation(); handleToggleComplete(task); }}
                                  >
                                    {task.completed && <Check size={14} />}
                                  </button>
                                  <span className={`task-title ${task.completed ? 'completed' : ''}`}>
                                    {task.title}
                                  </span>
                                </div>
                                <div className="calendar-task-meta">
                                  {task.estimated_minutes && (
                                    <span className="task-duration-badge">{task.estimated_minutes}m</span>
                                  )}
                                  <button 
                                    className="task-delete-btn"
                                    onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }}
                                    title="Delete task"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                          <button 
                            className="add-to-slot-btn"
                            onClick={() => {
                              setEditingTask({ 
                                scheduled_date: getLocalDateString(selectedDate),
                                scheduled_time: slot.label 
                              });
                              setIsModalOpen(true);
                            }}
                            title={`Add task at ${slot.displayLabel}`}
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
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

          {/* Planning Fallacy Educational Tip */}
          <div className="technique-tip planning-fallacy-tip">
            <div className="tip-header">
              <span className="tip-icon">📊</span>
              <span className="tip-title">Planning Fallacy</span>
            </div>
            <p className="tip-description">
              We tend to underestimate task time. Set estimates, track actual time with Pomodoro, and learn from the results!
            </p>
            <div className="tip-legend">
              <span className="legend-item accurate">🎯 Faster</span>
              <span className="legend-item accurate">✅ On time</span>
              <span className="legend-item slightly-over">📊 Slightly over</span>
              <span className="legend-item over">💡 Under-estimated</span>
            </div>
          </div>

          {/* Parkinson's Law Educational Tip */}
          <div className="technique-tip parkinson-law-tip">
            <div className="tip-header">
              <span className="tip-icon">⏰</span>
              <span className="tip-title">Parkinson's Law</span>
            </div>
            <p className="tip-description">
              Work expands to fill available time. Set specific time blocks to create natural deadlines and boost focus!
            </p>
            <div className="tip-action">
              <button 
                className="btn-try-technique"
                onClick={() => setViewMode('calendar')}
              >
                <LayoutGrid size={14} /> Try Time Blocks
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <TaskModal
        isOpen={isModalOpen}
        task={editingTask}
        tags={tags}
        defaultDate={getLocalDateString(selectedDate)}
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
