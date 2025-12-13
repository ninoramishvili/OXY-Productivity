import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  Calendar,
  CheckCircle2,
  Circle
} from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { tasksAPI } from '../utils/api';
import TaskModal from '../components/TaskModal';
import './Weekly.css';

// Helper to get local date string in YYYY-MM-DD format
const getLocalDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Get start of week (Monday)
const getStartOfWeek = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

// Generate week days array
const getWeekDays = (startOfWeek) => {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    days.push(day);
  }
  return days;
};

// Format date for display
const formatDayHeader = (date) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return {
    dayName: days[date.getDay()],
    dayNum: date.getDate(),
    month: months[date.getMonth()]
  };
};

// Draggable Task Card Component
function DraggableTask({ task, onToggleComplete, onClick }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `task-${task.id}`,
    data: { task }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0.5 : 1,
  } : undefined;

  const getQuadrantInfo = () => {
    if (task.is_urgent && task.is_important) return { label: 'Do First', class: 'do-first' };
    if (!task.is_urgent && task.is_important) return { label: 'Schedule', class: 'schedule' };
    if (task.is_urgent && !task.is_important) return { label: 'Delegate', class: 'delegate' };
    return { label: 'Eliminate', class: 'eliminate' };
  };

  const quadrant = getQuadrantInfo();

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`weekly-task-card ${task.is_completed ? 'completed' : ''} ${isDragging ? 'dragging' : ''}`}
      onClick={(e) => {
        if (!isDragging) onClick(task);
      }}
    >
      <div className="task-drag-handle" {...attributes} {...listeners}>
        ⋮⋮
      </div>
      <button
        className="task-complete-btn"
        onClick={(e) => {
          e.stopPropagation();
          onToggleComplete(task);
        }}
      >
        {task.is_completed ? (
          <CheckCircle2 size={16} className="check-icon completed" />
        ) : (
          <Circle size={16} className="check-icon" />
        )}
      </button>
      <span className={`task-title ${task.is_completed ? 'completed' : ''}`}>
        {task.title}
      </span>
      <span className={`task-priority-dot ${quadrant.class}`} title={quadrant.label} />
    </div>
  );
}

// Droppable Day Column Component
function DayColumn({ date, tasks, isToday, onTaskClick, onToggleComplete, onAddTask, onGoToDay }) {
  const dateString = getLocalDateString(date);
  const { setNodeRef, isOver } = useDroppable({
    id: `day-${dateString}`,
    data: { date: dateString }
  });

  const dayInfo = formatDayHeader(date);
  const completedCount = tasks.filter(t => t.is_completed).length;

  return (
    <div
      ref={setNodeRef}
      className={`day-column ${isToday ? 'today' : ''} ${isOver ? 'drag-over' : ''}`}
    >
      <div className="day-header" onClick={() => onGoToDay(dateString)} style={{ cursor: 'pointer' }}>
        <div className="day-name">{dayInfo.dayName}</div>
        <div className={`day-number ${isToday ? 'today-badge' : ''}`}>
          {dayInfo.dayNum}
        </div>
        <div className="day-month">{dayInfo.month}</div>
      </div>
      
      <div className="day-stats">
        <span className="task-count">{tasks.length} tasks</span>
        {tasks.length > 0 && (
          <span className="completed-count">{completedCount}/{tasks.length} done</span>
        )}
      </div>

      <div className="day-tasks">
        {tasks.map(task => (
          <DraggableTask
            key={task.id}
            task={task}
            onClick={onTaskClick}
            onToggleComplete={onToggleComplete}
          />
        ))}
        {tasks.length === 0 && (
          <div className="empty-day">No tasks</div>
        )}
      </div>

      <div className="day-actions">
        <button className="go-to-day-btn" onClick={() => onGoToDay(dateString)}>
          View Day →
        </button>
        <button className="add-task-day-btn" onClick={() => onAddTask(dateString)}>
          <Plus size={14} /> Add
        </button>
      </div>
    </div>
  );
}

function Weekly() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState(getStartOfWeek(new Date()));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [defaultDate, setDefaultDate] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTask, setActiveTask] = useState(null);

  const weekDays = getWeekDays(weekStart);
  const today = getLocalDateString(new Date());

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Define load functions first
  const loadTasks = async () => {
    try {
      const response = await tasksAPI.getTasks();
      if (response.success) {
        setTasks(response.tasks || []);
      }
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTags = async () => {
    try {
      const response = await tasksAPI.getTags();
      if (response.success) {
        setTags(response.tags || []);
      }
    } catch (err) {
      console.error('Failed to load tags:', err);
    }
  };

  // Load tasks and tags when component mounts
  useEffect(() => {
    loadTasks();
    loadTags();
  }, []);

  // Reload tasks when week changes
  useEffect(() => {
    if (weekStart) {
      loadTasks();
    }
  }, [weekStart]);

  // Keyboard shortcut for adding task
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleAddTask(today);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [today]);

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Get tasks for a specific day
  const getTasksForDay = (date) => {
    if (!tasks || !Array.isArray(tasks)) return [];
    const dateString = getLocalDateString(date);
    const dayTasks = tasks.filter(task => {
      if (!task.scheduled_date) return false;
      const taskDate = task.scheduled_date.split('T')[0];
      return taskDate === dateString;
    });
    return dayTasks;
  };

  // Navigation handlers
  const goToPreviousWeek = () => {
    const newStart = new Date(weekStart);
    newStart.setDate(newStart.getDate() - 7);
    setWeekStart(newStart);
  };

  const goToNextWeek = () => {
    const newStart = new Date(weekStart);
    newStart.setDate(newStart.getDate() + 7);
    setWeekStart(newStart);
  };

  const goToThisWeek = () => {
    setWeekStart(getStartOfWeek(new Date()));
  };

  // Get week range string
  const getWeekRangeString = () => {
    const endOfWeek = new Date(weekStart);
    endOfWeek.setDate(weekStart.getDate() + 6);
    
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
    
    if (weekStart.getMonth() === endOfWeek.getMonth()) {
      return `${months[weekStart.getMonth()]} ${weekStart.getDate()} - ${endOfWeek.getDate()}, ${weekStart.getFullYear()}`;
    } else {
      return `${months[weekStart.getMonth()]} ${weekStart.getDate()} - ${months[endOfWeek.getMonth()]} ${endOfWeek.getDate()}, ${weekStart.getFullYear()}`;
    }
  };

  // Task handlers
  const handleAddTask = (dateString) => {
    setDefaultDate(dateString);
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const handleTaskClick = (task) => {
    setEditingTask(task);
    setDefaultDate('');
    setIsModalOpen(true);
  };

  const handleToggleComplete = async (task) => {
    try {
      const response = await tasksAPI.updateTask(task.id, {
        isCompleted: !task.is_completed
      });
      if (response.success) {
        loadTasks();
      }
    } catch (err) {
      console.error('Failed to toggle task:', err);
    }
  };

  const handleSaveTask = async (taskData) => {
    try {
      if (editingTask && editingTask.id) {
        const response = await tasksAPI.updateTask(editingTask.id, taskData);
        if (response.success) {
          if (taskData.scheduledDate && taskData.isUrgent !== undefined && taskData.isImportant !== undefined) {
            await tasksAPI.updateEisenhower(editingTask.id, taskData.isUrgent, taskData.isImportant);
          }
          showSuccess('Task updated!');
          loadTasks();
        }
      } else {
        const createData = {
          ...taskData,
          scheduledDate: taskData.scheduledDate || defaultDate || null
        };
        const response = await tasksAPI.createTask(createData);
        if (response.success) {
          showSuccess('Task created!');
          loadTasks();
        }
      }
      setIsModalOpen(false);
      setEditingTask(null);
      setDefaultDate('');
    } catch (err) {
      alert('Failed to save task: ' + (err.response?.data?.message || err.message));
    }
  };

  // Drag and drop handler
  const handleDragStart = (event) => {
    const { active } = event;
    const taskId = parseInt(active.id.replace('task-', ''));
    const task = tasks.find(t => t.id === taskId);
    setActiveTask(task);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = parseInt(active.id.replace('task-', ''));
    const newDate = over.id.replace('day-', '');

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const currentDate = task.scheduled_date?.split('T')[0];
    if (currentDate === newDate) return;

    try {
      await tasksAPI.updateTask(taskId, { scheduledDate: newDate });
      showSuccess('Task moved!');
      loadTasks();
    } catch (err) {
      console.error('Failed to move task:', err);
    }
  };

  // Navigate to day view
  const goToDay = (date) => {
    const dateString = getLocalDateString(date);
    navigate(`/home?date=${dateString}`);
  };

  if (loading) {
    return <div className="weekly-page loading">Loading...</div>;
  }

  return (
    <div className="weekly-page">
      <header className="weekly-header">
        <div className="header-left">
          <Calendar className="header-icon" size={28} />
          <div>
            <h1>Weekly View</h1>
            <p className="week-range">{getWeekRangeString()}</p>
          </div>
        </div>
        <div className="header-right">
          <div className="week-navigation">
            <button className="nav-btn" onClick={goToPreviousWeek}>
              <ChevronLeft size={20} />
            </button>
            <button className="nav-btn today-btn" onClick={goToThisWeek}>
              Today
            </button>
            <button className="nav-btn" onClick={goToNextWeek}>
              <ChevronRight size={20} />
            </button>
          </div>
          <button className="btn-add-task" onClick={() => handleAddTask(today)}>
            <Plus size={18} /> Add Task
          </button>
        </div>
      </header>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="week-grid">
          {weekDays.map(day => (
            <DayColumn
              key={getLocalDateString(day)}
              date={day}
              tasks={getTasksForDay(day)}
              isToday={getLocalDateString(day) === today}
              onTaskClick={handleTaskClick}
              onToggleComplete={handleToggleComplete}
              onAddTask={handleAddTask}
              onGoToDay={(dateString) => navigate(`/home?date=${dateString}`)}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="weekly-task-card dragging-overlay">
              <span className="task-title">{activeTask.title}</span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {successMessage && (
        <div className="success-message">{successMessage}</div>
      )}

      <TaskModal
        isOpen={isModalOpen}
        task={editingTask}
        tags={tags}
        defaultDate={defaultDate}
        onSave={handleSaveTask}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTask(null);
          setDefaultDate('');
        }}
        onTagsUpdate={loadTags}
        onTasksUpdate={loadTasks}
      />
    </div>
  );
}

export default Weekly;

