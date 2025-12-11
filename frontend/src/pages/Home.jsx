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
  RotateCcw
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
        <span className={`priority-badge priority-${task.priority}`}>
          {task.priority}
        </span>
      </div>
      
      {/* Tags - always show space */}
      {task.tags && task.tags.length > 0 ? (
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
      ) : (
        <div className="task-tags-placeholder"></div>
      )}
      
      {/* Time stats - always show space */}
      {task.time_spent > 0 || task.pomodoro_count > 0 ? (
        <div className="task-time-stats">
          {task.time_spent > 0 && (
            <span className="time-stat">
              <Clock size={12} />
              {Math.floor(task.time_spent / 60)}m
            </span>
          )}
          {task.pomodoro_count > 0 && (
            <span className="time-stat">
              🍅 {task.pomodoro_count}
            </span>
          )}
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
        </div>
      ) : (
        <div className="task-time-stats-placeholder"></div>
      )}
      
      <div className="task-footer">
        {!task.completed && (
          <button 
            className="task-action-icon pomodoro-btn"
            onClick={() => onStartPomodoro(task)}
            title="Start Pomodoro"
          >
            <Timer size={16} />
          </button>
        )}
        {!isHighlight && !task.completed && (
          <button 
            className="task-action-icon highlight-btn"
            onClick={() => onSetHighlight(task.id)}
            title="Set as Daily Highlight"
          ></button>
        )}
        {!task.is_frog && !task.completed && (
          <button 
            className="task-action-icon frog-btn"
            onClick={() => onSetFrog(task.id)}
            title="Mark as Frog (Hardest Task)"
          ></button>
        )}
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

  // Sort tasks whenever sortBy changes
  const getSortedTasks = () => {
    const sorted = [...tasks];
    
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
      {/* Floating Timer */}
      {showFloatingTimer && (
        <FloatingTimer onClose={() => setShowFloatingTimer(false)} />
      )}
      {/* Pomodoro Timer Modal */}
      {activePomodoroTask && (
        <div className="modal-overlay" onClick={handlePomodoroCancel}>
          <div className="modal-content pomodoro-modal" onClick={(e) => e.stopPropagation()}>
            <PomodoroTimer
              task={activePomodoroTask}
              onComplete={handlePomodoroComplete}
              onCancel={handlePomodoroCancel}
              onUpdateTask={handleUpdateTaskFromPomodoro}
            />
          </div>
        </div>
      )}

      {/* Pomodoro Completion Celebration */}
      {showPomodoroComplete && (
        <div className="celebration-overlay pomodoro-celebration">
          <div className="celebration-content">
            <span className="celebration-icon">🍅</span>
            <h2>Pomodoro Complete! 🎉</h2>
            <p>Great focus session!</p>
          </div>
        </div>
      )}

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

      {/* Reset Pomodoro Confirmation Modal */}
      <ConfirmModal
        isOpen={resetPomodoroConfirm.isOpen}
        onClose={() => setResetPomodoroConfirm({ isOpen: false, taskId: null })}
        onConfirm={confirmResetPomodoro}
        title="Reset Pomodoro Data"
        message="Are you sure you want to reset all Pomodoro data for this task? This will delete all time tracking and session history."
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
                  <span className="simple-icon">✨</span>
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
                        <span className="empty-icon">✨</span>
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
                  <span className="simple-icon">🐸</span>
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
                        <span className="empty-icon">🐸</span>
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
                            <Check size={18} />
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
                    <option value="manual">Manual Order (Drag)</option>
                    <option value="created_desc">Newest First</option>
                    <option value="created_asc">Oldest First</option>
                    <option value="name_asc">Name (A-Z)</option>
                    <option value="name_desc">Name (Z-A)</option>
                    <option value="priority">Priority</option>
                  </select>
                  <button 
                    className="btn-secondary" 
                    onClick={() => setShowFloatingTimer(!showFloatingTimer)}
                    title="Independent Timer"
                  >
                    <Timer size={18} />
                  </button>
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
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={getSortedTasks().map(t => t.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="tasks-grid">
                      {getSortedTasks().map((task) => {
                        const now = new Date();
                        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                        const taskDate = task.highlight_date ? new Date(task.highlight_date).toISOString().split('T')[0] : null;
                        const isHighlight = task.is_daily_highlight && taskDate === today;
                        
                        return (
                          <SortableTaskCard
                            key={task.id}
                            task={task}
                            isHighlight={isHighlight}
                            onToggleComplete={handleToggleComplete}
                            onEditTask={handleEditTask}
                            onDeleteTask={handleDeleteTask}
                            onSetHighlight={handleSetHighlight}
                            onSetFrog={handleSetFrog}
                            onStartPomodoro={handleStartPomodoro}
                            onResetPomodoro={handleResetPomodoro}
                          />
                        );
                      })}
                    </div>
                  </SortableContext>
                </DndContext>
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

