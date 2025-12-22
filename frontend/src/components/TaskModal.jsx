import { useState, useEffect } from 'react';
import { X, Tag as TagIcon, Plus, Repeat } from 'lucide-react';
import { tagsAPI } from '../utils/api';
import ConfirmModal from './ConfirmModal';
import './TaskModal.css';

// Recurrence pattern options
const RECURRENCE_PATTERNS = [
  { id: 'daily', label: 'Daily', description: 'Every day' },
  { id: 'weekdays', label: 'Weekdays', description: 'Mon - Fri' },
  { id: 'weekly', label: 'Weekly', description: 'Same day each week' },
  { id: 'biweekly', label: 'Bi-weekly', description: 'Every 2 weeks' },
  { id: 'monthly', label: 'Monthly', description: 'Same date each month' },
  { id: 'custom', label: 'Custom', description: 'Choose days' },
];

const WEEKDAYS = [
  { id: 0, label: 'S', name: 'Sunday' },
  { id: 1, label: 'M', name: 'Monday' },
  { id: 2, label: 'T', name: 'Tuesday' },
  { id: 3, label: 'W', name: 'Wednesday' },
  { id: 4, label: 'T', name: 'Thursday' },
  { id: 5, label: 'F', name: 'Friday' },
  { id: 6, label: 'S', name: 'Saturday' },
];

// Eisenhower Quadrant definitions
const QUADRANTS = [
  { id: 'doFirst', label: '🔥 Do First', subtitle: 'Urgent & Important', isUrgent: true, isImportant: true, color: '#ef4444' },
  { id: 'schedule', label: '📅 Schedule', subtitle: 'Not Urgent & Important', isUrgent: false, isImportant: true, color: '#3b82f6' },
  { id: 'delegate', label: '👥 Delegate', subtitle: 'Urgent & Not Important', isUrgent: true, isImportant: false, color: '#f59e0b' },
  { id: 'eliminate', label: '🗑️ Eliminate', subtitle: 'Not Urgent & Not Important', isUrgent: false, isImportant: false, color: '#6b7280' },
];

function TaskModal({ isOpen, onClose, onSave, task, tags, onTagsUpdate, onTasksUpdate, defaultDate }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    quadrant: 'doFirst',
    tagIds: [],
    scheduledDate: '',
    scheduledTime: '',
    estimatedMinutes: '',
    isRecurring: false,
    recurrencePattern: '',
    recurrenceDays: [],
    recurrenceEndDate: ''
  });
  const [errors, setErrors] = useState({});
  const [newTagName, setNewTagName] = useState('');
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTagConfirm, setDeleteTagConfirm] = useState({ isOpen: false, tag: null });

  // Helper to get quadrant from urgent/important flags
  const getQuadrantFromFlags = (isUrgent, isImportant) => {
    if (isUrgent && isImportant) return 'doFirst';
    if (!isUrgent && isImportant) return 'schedule';
    if (isUrgent && !isImportant) return 'delegate';
    return 'eliminate';
  };

  useEffect(() => {
    if (task) {
      const initialTagIds = task.tags?.map(t => Number(t.id)) || [];
      const quadrant = getQuadrantFromFlags(task.is_urgent, task.is_important);
      // Get scheduled_date in YYYY-MM-DD format for the input
      let scheduledDate = '';
      if (task.scheduled_date) {
        scheduledDate = task.scheduled_date.split('T')[0];
      }
      // Get scheduled_time in HH:MM format
      let scheduledTime = '';
      if (task.scheduled_time) {
        scheduledTime = task.scheduled_time.substring(0, 5); // "HH:MM:SS" -> "HH:MM"
      }
      // Get recurrence end date
      let recurrenceEndDate = '';
      if (task.recurrence_end_date) {
        recurrenceEndDate = task.recurrence_end_date.split('T')[0];
      }
      setFormData({
        title: task.title || '',
        description: task.description || '',
        quadrant: quadrant,
        tagIds: initialTagIds,
        scheduledDate: scheduledDate,
        scheduledTime: scheduledTime,
        estimatedMinutes: task.estimated_minutes || '',
        isRecurring: task.is_recurring || false,
        recurrencePattern: task.recurrence_pattern || '',
        recurrenceDays: task.recurrence_days || [],
        recurrenceEndDate: recurrenceEndDate
      });
    } else {
      setFormData({
        title: '',
        description: '',
        quadrant: 'doFirst',
        tagIds: [],
        scheduledDate: defaultDate || '',
        scheduledTime: '',
        estimatedMinutes: '',
        isRecurring: false,
        recurrencePattern: '',
        recurrenceDays: [],
        recurrenceEndDate: ''
      });
    }
    setErrors({});
  }, [task, isOpen, defaultDate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const toggleTag = (tagId) => {
    // Ensure we're comparing numbers
    const numericTagId = Number(tagId);
    console.log('Toggle tag:', numericTagId, 'Current tagIds:', formData.tagIds, 'Type:', typeof formData.tagIds[0]);
    
    setFormData(prev => {
      const currentIds = prev.tagIds.map(id => Number(id));
      const isSelected = currentIds.includes(numericTagId);
      
      // Single selection mode:
      // If already selected, do nothing (or could deselect if you want toggling off)
      // If not selected, replace current selection with new one
      const newTagIds = [numericTagId];
      
      console.log('Is selected:', isSelected, 'New tagIds (Single Mode):', newTagIds);
      return {
        ...prev,
        tagIds: newTagIds
      };
    });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSaving) return; // Prevent double submission
    
    if (validate()) {
      setIsSaving(true);
      try {
        // Convert quadrant to isUrgent/isImportant flags
        const quadrantData = QUADRANTS.find(q => q.id === formData.quadrant);
        const submitData = {
          ...formData,
          isUrgent: quadrantData?.isUrgent ?? true,
          isImportant: quadrantData?.isImportant ?? true,
          // Map quadrant to old priority for backward compatibility
          priority: formData.quadrant === 'doFirst' ? 'high' : 
                   formData.quadrant === 'schedule' ? 'medium' : 
                   formData.quadrant === 'delegate' ? 'medium' : 'low',
          // Recurring fields
          isRecurring: formData.isRecurring,
          recurrencePattern: formData.isRecurring ? formData.recurrencePattern : null,
          recurrenceDays: formData.isRecurring && formData.recurrencePattern === 'custom' ? formData.recurrenceDays : null,
          recurrenceEndDate: formData.isRecurring && formData.recurrenceEndDate ? formData.recurrenceEndDate : null
        };
        await onSave(submitData);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const toggleRecurrenceDay = (dayId) => {
    setFormData(prev => {
      const currentDays = prev.recurrenceDays || [];
      const isSelected = currentDays.includes(dayId);
      return {
        ...prev,
        recurrenceDays: isSelected 
          ? currentDays.filter(d => d !== dayId)
          : [...currentDays, dayId].sort((a, b) => a - b)
      };
    });
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    
    setIsCreatingTag(true);
    try {
      // Generate a random color for the new tag
      const colors = ['#FF7F50', '#00CED1', '#FFB84D', '#4ECB71', '#9b59b6', '#e74c3c', '#3498db'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      
      const response = await tagsAPI.createTag({
        name: newTagName.trim(),
        color: randomColor
      });
      
      if (response.success) {
        const newTag = response.tag;
        setNewTagName('');
        
        // Automatically select the newly created tag
        setFormData(prev => ({
          ...prev,
          tagIds: [...prev.tagIds, newTag.id]
        }));
        
        // Notify parent to refresh tags
        if (onTagsUpdate) {
          await onTagsUpdate();
        }
      }
    } catch (err) {
      alert('Failed to create tag: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsCreatingTag(false);
    }
  };

  const handleDeleteTagClick = (e, tag) => {
    e.stopPropagation(); // Prevent tag toggle
    e.preventDefault(); // Prevent any default behavior
    console.log('Delete tag clicked:', tag);
    console.log('Setting deleteTagConfirm state to:', { isOpen: true, tag });
    setDeleteTagConfirm({ isOpen: true, tag });
    console.log('After setState - should show modal');
  };

  const confirmDeleteTag = async () => {
    const tagId = deleteTagConfirm.tag?.id;
    console.log('Confirming delete for tag ID:', tagId);
    
    if (!tagId) {
      console.error('No tag ID found');
      setDeleteTagConfirm({ isOpen: false, tag: null });
      return;
    }
    
    try {
      console.log('Calling deleteTag API...');
      const response = await tagsAPI.deleteTag(tagId);
      console.log('Delete response:', response);
      
      if (response.success) {
        // Remove tag from current task if selected
        setFormData(prev => ({
          ...prev,
          tagIds: prev.tagIds.filter(id => id !== tagId)
        }));
        
        // Notify parent to refresh tags
        if (onTagsUpdate) {
          await onTagsUpdate();
        }
        
        // Notify parent to refresh tasks (to update UI immediately)
        if (onTasksUpdate) {
          await onTasksUpdate();
        }
      }
    } catch (err) {
      console.error('Delete tag error:', err);
      alert('Failed to delete tag: ' + (err.response?.data?.message || err.message));
    } finally {
      setDeleteTagConfirm({ isOpen: false, tag: null });
    }
  };

  if (!isOpen) return null;

  console.log('TaskModal render - deleteTagConfirm:', deleteTagConfirm);

  return (
    <>
      {/* Delete Tag Confirmation Modal */}
      {console.log('Rendering ConfirmModal with isOpen:', deleteTagConfirm.isOpen)}
      <ConfirmModal
        isOpen={deleteTagConfirm.isOpen}
        onClose={() => {
          console.log('ConfirmModal close clicked');
          setDeleteTagConfirm({ isOpen: false, tag: null });
        }}
        onConfirm={confirmDeleteTag}
        title="Delete Tag"
        message={`Are you sure you want to delete "${deleteTagConfirm.tag?.name}"? This tag will be removed from all tasks using it.`}
      />

      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div className="modal-title-group">
              <h2>{task ? 'Edit Task' : 'Create New Task'}</h2>
              <span className="hotkey-hint">💡 Tip: Press Ctrl+Alt+N to add tasks quickly</span>
            </div>
            <button className="modal-close" onClick={onClose}>
              <X size={24} />
            </button>
          </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="title">Title *</label>
            <input
              id="title"
              name="title"
              type="text"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter task title..."
              className={errors.title ? 'error' : ''}
              autoFocus
            />
            {errors.title && <span className="error-text">{errors.title}</span>}
          </div>

          <div className="form-group form-group-compact">
            <label htmlFor="scheduledDate">
              📅 Schedule Date & Time (optional)
            </label>
            <div className="date-time-input-row">
              <input
                type="date"
                id="scheduledDate"
                name="scheduledDate"
                value={formData.scheduledDate}
                onChange={handleChange}
                className="date-input"
              />
              <input
                type="time"
                id="scheduledTime"
                name="scheduledTime"
                value={formData.scheduledTime}
                onChange={handleChange}
                className="time-input"
                disabled={!formData.scheduledDate}
                title={formData.scheduledDate ? "Set time block (Parkinson's Law)" : "Set date first"}
              />
              {formData.scheduledDate && (
                <button
                  type="button"
                  className="btn-clear-date"
                  onClick={() => setFormData(prev => ({ ...prev, scheduledDate: '', scheduledTime: '' }))}
                  title="Clear date (moves task to To Do)"
                >
                  ✕
                </button>
              )}
            </div>
            <span className="field-hint">
              ⏰ Set a specific time to create a time block (Parkinson's Law - deadlines boost focus!)
            </span>
          </div>

          <div className="form-group form-group-compact">
            <label htmlFor="estimatedMinutes">
              ⏱️ Time Estimate (minutes)
            </label>
            <div className="estimate-input-row">
              <input
                type="number"
                id="estimatedMinutes"
                name="estimatedMinutes"
                value={formData.estimatedMinutes}
                onChange={handleChange}
                placeholder="e.g. 15, 30, 60..."
                className="estimate-input"
                min="1"
                max="480"
              />
              <div className="quick-estimates">
                <button type="button" className={`quick-btn ${formData.estimatedMinutes === 2 ? 'active' : ''}`} onClick={() => setFormData(prev => ({ ...prev, estimatedMinutes: 2 }))}>2m</button>
                <button type="button" className={`quick-btn ${formData.estimatedMinutes === 5 ? 'active' : ''}`} onClick={() => setFormData(prev => ({ ...prev, estimatedMinutes: 5 }))}>5m</button>
                <button type="button" className={`quick-btn ${formData.estimatedMinutes === 15 ? 'active' : ''}`} onClick={() => setFormData(prev => ({ ...prev, estimatedMinutes: 15 }))}>15m</button>
                <button type="button" className={`quick-btn ${formData.estimatedMinutes === 30 ? 'active' : ''}`} onClick={() => setFormData(prev => ({ ...prev, estimatedMinutes: 30 }))}>30m</button>
                <button type="button" className={`quick-btn ${formData.estimatedMinutes === 60 ? 'active' : ''}`} onClick={() => setFormData(prev => ({ ...prev, estimatedMinutes: 60 }))}>1h</button>
              </div>
            </div>
            <span className="field-hint">
              💡 Tasks ≤2 min = Quick Task (do it now!)
            </span>
          </div>

          {/* Recurring Task Options */}
          <div className="form-group form-group-compact">
            <label className="recurring-toggle-label">
              <button
                type="button"
                className={`recurring-toggle ${formData.isRecurring ? 'active' : ''}`}
                onClick={() => setFormData(prev => ({ 
                  ...prev, 
                  isRecurring: !prev.isRecurring,
                  recurrencePattern: !prev.isRecurring ? 'daily' : ''
                }))}
              >
                <Repeat size={16} />
                <span>Recurring Task</span>
              </button>
            </label>
            
            {formData.isRecurring && (
              <div className="recurring-options">
                <div className="recurrence-patterns">
                  {RECURRENCE_PATTERNS.map(pattern => (
                    <button
                      key={pattern.id}
                      type="button"
                      className={`pattern-btn ${formData.recurrencePattern === pattern.id ? 'selected' : ''}`}
                      onClick={() => setFormData(prev => ({ ...prev, recurrencePattern: pattern.id }))}
                    >
                      <span className="pattern-label">{pattern.label}</span>
                      <span className="pattern-desc">{pattern.description}</span>
                    </button>
                  ))}
                </div>
                
                {formData.recurrencePattern === 'custom' && (
                  <div className="custom-days">
                    <span className="custom-days-label">Select days:</span>
                    <div className="weekday-buttons">
                      {WEEKDAYS.map(day => (
                        <button
                          key={day.id}
                          type="button"
                          className={`weekday-btn ${(formData.recurrenceDays || []).includes(day.id) ? 'selected' : ''}`}
                          onClick={() => toggleRecurrenceDay(day.id)}
                          title={day.name}
                        >
                          {day.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="recurrence-end">
                  <label htmlFor="recurrenceEndDate">End date (optional):</label>
                  <input
                    type="date"
                    id="recurrenceEndDate"
                    name="recurrenceEndDate"
                    value={formData.recurrenceEndDate}
                    onChange={handleChange}
                    className="end-date-input"
                    min={formData.scheduledDate || new Date().toISOString().split('T')[0]}
                  />
                  {formData.recurrenceEndDate && (
                    <button
                      type="button"
                      className="btn-clear-end-date"
                      onClick={() => setFormData(prev => ({ ...prev, recurrenceEndDate: '' }))}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className={`form-group form-group-compact ${formData.estimatedMinutes && formData.estimatedMinutes <= 2 ? 'disabled-section' : ''}`}>
            <label>
              Priority (Eisenhower)
              {formData.estimatedMinutes && formData.estimatedMinutes <= 2 && (
                <span className="priority-disabled-hint"> — Skipped for quick tasks (≤2 min)</span>
              )}
            </label>
            <div className={`quadrant-selector ${formData.estimatedMinutes && formData.estimatedMinutes <= 2 ? 'disabled' : ''}`}>
              {QUADRANTS.map(q => (
                <button
                  key={q.id}
                  type="button"
                  className={`quadrant-option ${formData.quadrant === q.id ? 'selected' : ''}`}
                  onClick={() => {
                    if (!(formData.estimatedMinutes && formData.estimatedMinutes <= 2)) {
                      setFormData(prev => ({ ...prev, quadrant: q.id }));
                    }
                  }}
                  disabled={formData.estimatedMinutes && formData.estimatedMinutes <= 2}
                  style={{ '--q-color': q.color }}
                >
                  <span className="q-label">{q.label}</span>
                  <span className="q-subtitle">{q.subtitle}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="form-group form-group-compact">
            <label>
              <TagIcon size={14} />
              Tags
            </label>
            {tags && tags.length > 0 && (
              <div className="tags-selector">
                {tags.map(tag => {
                  const isSelected = formData.tagIds.map(id => Number(id)).includes(Number(tag.id));
                  console.log('Rendering tag:', tag.name, 'ID:', tag.id, 'Selected:', isSelected, 'FormData tagIds:', formData.tagIds);
                  return (
                    <div key={tag.id} className="tag-chip-wrapper">
                      <button
                        type="button"
                        className={`tag-chip ${isSelected ? 'selected' : ''}`}
                        style={{ 
                          '--tag-color': tag.color,
                          borderColor: isSelected ? tag.color : 'transparent'
                        }}
                        onClick={() => toggleTag(tag.id)}
                      >
                        {tag.name}
                      </button>
                      <button
                        type="button"
                        className="tag-delete-btn"
                        onClick={(e) => handleDeleteTagClick(e, tag)}
                        title="Delete tag"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="tag-input-row">
              <input
                type="text"
                className="tag-input"
                placeholder="New tag..."
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCreateTag();
                  }
                }}
              />
              <button
                type="button"
                className="btn-add-tag"
                onClick={handleCreateTag}
                disabled={!newTagName.trim() || isCreatingTag}
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={isSaving}>
              Cancel
            </button>
            <button type="submit" className="btn-save" disabled={isSaving}>
              {isSaving ? 'Saving...' : (task ? 'Update Task' : 'Create Task')}
            </button>
          </div>
        </form>
        </div>
      </div>
    </>
  );
}

export default TaskModal;

