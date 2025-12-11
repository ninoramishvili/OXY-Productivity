import { useState, useEffect } from 'react';
import { tasksAPI, tagsAPI } from '../utils/api';
import TaskModal from '../components/TaskModal';
import ConfirmModal from '../components/ConfirmModal';
import { 
  Grid3X3, 
  AlertTriangle, 
  Calendar, 
  Users, 
  Trash2,
  Plus,
  Edit2,
  Check,
  Clock,
  Star,
  ArrowRight
} from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import './Eisenhower.css';

// Quadrant definitions
const QUADRANTS = {
  doFirst: { 
    id: 'doFirst', 
    title: 'Do First', 
    subtitle: 'Urgent & Important',
    icon: '🔥',
    color: '#ef4444',
    isUrgent: true, 
    isImportant: true 
  },
  schedule: { 
    id: 'schedule', 
    title: 'Schedule', 
    subtitle: 'Not Urgent & Important',
    icon: '📅',
    color: '#3b82f6',
    isUrgent: false, 
    isImportant: true 
  },
  delegate: { 
    id: 'delegate', 
    title: 'Delegate', 
    subtitle: 'Urgent & Not Important',
    icon: '👥',
    color: '#f59e0b',
    isUrgent: true, 
    isImportant: false 
  },
  eliminate: { 
    id: 'eliminate', 
    title: 'Eliminate', 
    subtitle: 'Not Urgent & Not Important',
    icon: '🗑️',
    color: '#6b7280',
    isUrgent: false, 
    isImportant: false 
  },
};

// Draggable Task Card
function DraggableTask({ task, onToggleComplete, onEdit, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `task-${task.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`eisenhower-task ${task.completed ? 'completed' : ''} ${isDragging ? 'dragging' : ''}`}
      {...attributes}
      {...listeners}
    >
      <div className="task-main">
        <button 
          className="task-check"
          onClick={(e) => {
            e.stopPropagation();
            onToggleComplete(task);
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {task.completed ? <Check size={14} /> : <div className="check-empty" />}
        </button>
        <span className="task-name">{task.title}</span>
      </div>
      <div className="task-actions">
        <button 
          className="task-action-btn"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(task);
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <Edit2 size={12} />
        </button>
        <button 
          className="task-action-btn delete"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(task.id);
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}

// Droppable Quadrant Component
function DroppableQuadrant({ quadrant, tasks, onToggleComplete, onEdit, onDelete }) {
  const { setNodeRef, isOver } = useDroppable({
    id: quadrant.id,
  });

  return (
    <div 
      ref={setNodeRef}
      className={`quadrant quadrant-${quadrant.id} ${isOver ? 'drag-over' : ''}`} 
      style={{ '--quadrant-color': quadrant.color }}
    >
      <div className="quadrant-header">
        <span className="quadrant-icon">{quadrant.icon}</span>
        <div className="quadrant-titles">
          <h3>{quadrant.title}</h3>
          <span className="quadrant-subtitle">{quadrant.subtitle}</span>
        </div>
        <span className="quadrant-count">{tasks.length}</span>
      </div>
      <div className="quadrant-tasks">
        {tasks.length === 0 ? (
          <div className="quadrant-empty">
            <span>Drop tasks here</span>
          </div>
        ) : (
          tasks.map(task => (
            <DraggableTask
              key={task.id}
              task={task}
              onToggleComplete={onToggleComplete}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}

function Eisenhower() {
  const [tasks, setTasks] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, taskId: null });
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTask, setActiveTask] = useState(null);

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

  const loadTasks = async () => {
    try {
      const response = await tasksAPI.getTasks();
      if (response.success) {
        setTasks(response.tasks);
      }
    } catch (err) {
      console.error('Failed to load tasks:', err);
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

  // Get tasks for each quadrant
  const getQuadrantTasks = (quadrant) => {
    return tasks.filter(task => 
      task.is_urgent === quadrant.isUrgent && 
      task.is_important === quadrant.isImportant
    );
  };

  const handleDragStart = (event) => {
    const taskId = parseInt(event.active.id.replace('task-', ''));
    const task = tasks.find(t => t.id === taskId);
    setActiveTask(task);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    // Extract task ID from the draggable ID
    const taskId = parseInt(active.id.replace('task-', ''));
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Determine target quadrant
    let targetQuadrant = null;
    const overId = over.id;

    // Check if dropped on a quadrant directly
    if (QUADRANTS[overId]) {
      targetQuadrant = QUADRANTS[overId];
    } else if (overId.startsWith('task-')) {
      // Dropped on another task - find which quadrant that task is in
      const overTaskId = parseInt(overId.replace('task-', ''));
      const overTask = tasks.find(t => t.id === overTaskId);
      if (overTask) {
        for (const q of Object.values(QUADRANTS)) {
          if (overTask.is_urgent === q.isUrgent && overTask.is_important === q.isImportant) {
            targetQuadrant = q;
            break;
          }
        }
      }
    }

    if (!targetQuadrant) return;

    // Check if task is already in this quadrant
    if (task.is_urgent === targetQuadrant.isUrgent && task.is_important === targetQuadrant.isImportant) {
      return;
    }

    // Update task quadrant
    try {
      const response = await tasksAPI.updateEisenhower(
        taskId, 
        targetQuadrant.isUrgent, 
        targetQuadrant.isImportant
      );
      if (response.success) {
        setTasks(tasks.map(t => t.id === taskId ? response.task : t));
        showSuccess(`Task moved to "${targetQuadrant.title}"`);
      }
    } catch (err) {
      console.error('Failed to update task quadrant:', err);
    }
  };

  const handleToggleComplete = async (task) => {
    try {
      const response = await tasksAPI.updateTask(task.id, {
        completed: !task.completed
      });
      if (response.success) {
        showSuccess(task.completed ? 'Task reopened' : 'Task completed!');
        loadTasks();
      }
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleCreateTask = () => {
    // Default to "Do First" quadrant
    setEditingTask({
      is_urgent: true,
      is_important: true
    });
    setIsModalOpen(true);
  };

  const handleSaveTask = async (taskData) => {
    try {
      if (editingTask && editingTask.id) {
        const response = await tasksAPI.updateTask(editingTask.id, taskData);
        if (response.success) {
          showSuccess('Task updated!');
          loadTasks();
        }
      } else {
        const createData = {
          ...taskData,
          isUrgent: editingTask?.is_urgent ?? true,
          isImportant: editingTask?.is_important ?? true
        };
        const response = await tasksAPI.createTask(createData);
        if (response.success) {
          showSuccess('Task created!');
          loadTasks();
        }
      }
      setIsModalOpen(false);
      setEditingTask(null);
    } catch (err) {
      alert('Failed to save task');
    }
  };

  const handleDeleteTask = (taskId) => {
    setDeleteConfirm({ isOpen: true, taskId });
  };

  const confirmDelete = async () => {
    try {
      const response = await tasksAPI.deleteTask(deleteConfirm.taskId);
      if (response.success) {
        showSuccess('Task deleted');
        loadTasks();
      }
    } catch (err) {
      alert('Failed to delete task');
    } finally {
      setDeleteConfirm({ isOpen: false, taskId: null });
    }
  };

  if (loading) {
    return (
      <div className="eisenhower-page">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="eisenhower-page">
      {successMessage && (
        <div className="success-message">{successMessage}</div>
      )}

      <div className="eisenhower-header">
        <div className="header-left">
          <h1>
            <Grid3X3 className="header-icon" />
            Eisenhower Matrix
          </h1>
          <p className="header-subtitle">Prioritize tasks by urgency and importance</p>
        </div>
        <div className="header-actions">
          <button className="btn-primary" onClick={handleCreateTask}>
            <Plus size={18} />
            Add Task
          </button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="matrix-container">
          <div className="matrix-labels-top">
            <div className="label-spacer"></div>
            <div className="label urgent-label">
              <AlertTriangle size={16} />
              URGENT
            </div>
            <div className="label not-urgent-label">
              <Clock size={16} />
              NOT URGENT
            </div>
          </div>

          <div className="matrix-body">
            <div className="matrix-labels-left">
              <div className="label important-label">
                <Star size={16} />
                IMPORTANT
              </div>
              <div className="label not-important-label">
                <ArrowRight size={16} />
                NOT IMPORTANT
              </div>
            </div>

            <div className="matrix-grid">
              <DroppableQuadrant
                quadrant={QUADRANTS.doFirst}
                tasks={getQuadrantTasks(QUADRANTS.doFirst)}
                onToggleComplete={handleToggleComplete}
                onEdit={handleEditTask}
                onDelete={handleDeleteTask}
              />
              <DroppableQuadrant
                quadrant={QUADRANTS.schedule}
                tasks={getQuadrantTasks(QUADRANTS.schedule)}
                onToggleComplete={handleToggleComplete}
                onEdit={handleEditTask}
                onDelete={handleDeleteTask}
              />
              <DroppableQuadrant
                quadrant={QUADRANTS.delegate}
                tasks={getQuadrantTasks(QUADRANTS.delegate)}
                onToggleComplete={handleToggleComplete}
                onEdit={handleEditTask}
                onDelete={handleDeleteTask}
              />
              <DroppableQuadrant
                quadrant={QUADRANTS.eliminate}
                tasks={getQuadrantTasks(QUADRANTS.eliminate)}
                onToggleComplete={handleToggleComplete}
                onEdit={handleEditTask}
                onDelete={handleDeleteTask}
              />
            </div>
          </div>
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="eisenhower-task dragging-overlay">
              <div className="task-main">
                <span className="task-name">{activeTask.title}</span>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

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
        message="Are you sure you want to delete this task?"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, taskId: null })}
      />
    </div>
  );
}

export default Eisenhower;
