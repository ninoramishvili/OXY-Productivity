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

// Sortable Task Card Component
function SortableTaskCard({ task, isHighlight, onToggleComplete, onEditTask, onDeleteTask, onSetHighlight, onSetFrog, onStartPomodoro, onResetPomodoro }) {
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
          <span className={`priority-badge priority-${task.priority}`}>
            {task.priority}
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
          onClick={() => onSetHighlight(task.id)}
          title={isHighlight ? "Already Daily Highlight" : "Set as Daily Highlight"}
          disabled={task.completed || isHighlight}
          style={{ opacity: (task.completed || isHighlight) ? 0.5 : 1, cursor: (task.completed || isHighlight) ? 'not-allowed' : 'pointer' }}
        ></button>
        <button 
          className={`task-action-icon frog-btn ${task.is_frog ? 'active' : ''}`}
          onClick={() => onSetFrog(task.id)}
          title={task.is_frog ? "Already Frog" : "Mark as Frog (Hardest Task)"}
          disabled={task.completed || task.is_frog}
          style={{ opacity: (task.completed || task.is_frog) ? 0.5 : 1, cursor: (task.completed || task.is_frog) ? 'not-allowed' : 'pointer' }}
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
  const [highlightedTask, setHighlightedTask] = useState(null);
  const [frogTask, setFrogTask] = useState(null);
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

  const stats = getStats();

  return (
    <div className="home-page">

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = tasks.findIndex((task) => task.id === active.id);
      const newIndex = tasks.findIndex((task) => task.id === over.id);

      const newTasks = arrayMove(tasks, oldIndex, newIndex);
      
      // Update display_order for all tasks
      const taskOrders = newTasks.map((task, index) => ({
        id: task.id,
        display_order: index
      }));

      // Optimistically update UI
      setTasks(newTasks);

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
    
    // Update highlighted/frog task if it's the one being updated
    if (highlightedTask && highlightedTask.id === updatedTask.id) {
      setHighlightedTask(updatedTask);
    }
    if (frogTask && frogTask.id === updatedTask.id) {
      setFrogTask(updatedTask);
    }
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
        
        // Update highlighted/frog task if needed
        if (highlightedTask && highlightedTask.id === response.task.id) {
          setHighlightedTask(response.task);
        }
        if (frogTask && frogTask.id === response.task.id) {
          setFrogTask(response.task);
        }
        
        showSuccess('Pomodoro data reset successfully!');
      }
    } catch (error) {
      console.error('Failed to reset pomodoro:', error);
      showSuccess('Failed to reset Pomodoro data');
    } finally {
      setResetPomodoroConfirm({ isOpen: false, taskId: null });
    }
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
    setEditingTask({
      scheduled_date: selectedDate.toISOString().split('T')[0]
    });
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

  const handleDragEnd = async (event) => {