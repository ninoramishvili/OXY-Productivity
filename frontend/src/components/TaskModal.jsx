import { useState, useEffect } from 'react';
import { X, Tag as TagIcon, Plus, Repeat, ChevronDown, Calendar, Clock, Timer } from 'lucide-react';
import { tagsAPI } from '../utils/api';
import ConfirmModal from './ConfirmModal';
import './TaskModal.css';

// Recurrence pattern options - with clear text labels
const RECURRENCE_PATTERNS = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekdays', label: 'Weekdays' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'biweekly', label: 'Bi-weekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'custom', label: 'Custom' },
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
  { id: 'schedule', label: '📅 Schedule', subtitle: 'Important, Not Urgent', isUrgent: false, isImportant: true, color: '#3b82f6' },
  { id: 'delegate', label: '👥 Delegate', subtitle: 'Urgent, Not Important', isUrgent: true, isImportant: false, color: '#f59e0b' },
  { id: 'eliminate', label: '🗑️ Eliminate', subtitle: 'Neither', isUrgent: false, isImportant: false, color: '#6b7280' },
];

// Quick time estimates
const QUICK_TIMES = [
  { value: 2, label: '2m' },
  { value: 5, label: '5m' },
  { value: 15, label: '15m' },
  { value: 30, label: '30m' },
  { value: 60, label: '1h' },
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
  const [showMoreOptions, setShowMoreOptions] = useState(false);

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
      let scheduledDate = '';
      if (task.scheduled_date) {
        scheduledDate = task.scheduled_date.split('T')[0];
      }
      let scheduledTime = '';
      if (task.scheduled_time) {
        scheduledTime = task.scheduled_time.substring(0, 5);
      }
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
      // Auto-expand more options if task has non-default priority or tags
      if (quadrant !== 'doFirst' || initialTagIds.length > 0) {
        setShowMoreOptions(true);
      }
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
      setShowMoreOptions(false);
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
    const numericTagId = Number(tagId);
    setFormData(prev => {
      const currentIds = prev.tagIds.map(id => Number(id));
      const isSelected = currentIds.includes(numericTagId);
      return {
        ...prev,
        tagIds: isSelected ? [] : [numericTagId]
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
    if (isSaving) return;
    
    if (validate()) {
      setIsSaving(true);
      try {
        const quadrantData = QUADRANTS.find(q => q.id === formData.quadrant);
        const submitData = {
          ...formData,
          isUrgent: quadrantData?.isUrgent ?? true,
          isImportant: quadrantData?.isImportant ?? true,
          priority: formData.quadrant === 'doFirst' ? 'high' : 
                   formData.quadrant === 'schedule' ? 'medium' : 
                   formData.quadrant === 'delegate' ? 'medium' : 'low',
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
      const colors = ['#FF7F50', '#00CED1', '#FFB84D', '#4ECB71', '#9b59b6', '#e74c3c', '#3498db'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      
      const response = await tagsAPI.createTag({
        name: newTagName.trim(),
        color: randomColor
      });
      
      if (response.success) {
        const newTag = response.tag;
        setNewTagName('');
        setFormData(prev => ({
          ...prev,
          tagIds: [newTag.id]
        }));
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
    e.stopPropagation();
    e.preventDefault();
    setDeleteTagConfirm({ isOpen: true, tag });
  };

  const confirmDeleteTag = async () => {
    const tagId = deleteTagConfirm.tag?.id;
    if (!tagId) {
      setDeleteTagConfirm({ isOpen: false, tag: null });
      return;
    }
    
    try {
      const response = await tagsAPI.deleteTag(tagId);
      if (response.success) {
        setFormData(prev => ({
          ...prev,
          tagIds: prev.tagIds.filter(id => id !== tagId)
        }));
        if (onTagsUpdate) await onTagsUpdate();
        if (onTasksUpdate) await onTasksUpdate();
      }
    } catch (err) {
      alert('Failed to delete tag: ' + (err.response?.data?.message || err.message));
    } finally {
      setDeleteTagConfirm({ isOpen: false, tag: null });
    }
  };

  const isQuickTask = formData.estimatedMinutes && formData.estimatedMinutes <= 2;

  if (!isOpen) return null;

  return (
    <>
      <ConfirmModal
        isOpen={deleteTagConfirm.isOpen}
        onClose={() => setDeleteTagConfirm({ isOpen: false, tag: null })}
        onConfirm={confirmDeleteTag}
        title="Delete Tag"
        message={`Are you sure you want to delete "${deleteTagConfirm.tag?.name}"? This tag will be removed from all tasks using it.`}
      />

      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="modal-header">
            <h2>{task ? 'Edit Task' : 'New Task'}</h2>
            <button className="modal-close" onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="modal-form">
            {/* Title */}
            <div className="form-group">
              <label htmlFor="title">Task Title *</label>
              <input
                id="title"
                name="title"
                type="text"
                value={formData.title}
                onChange={handleChange}
                placeholder="What needs to be done?"
                className={`title-input ${errors.title ? 'error' : ''}`}
                autoFocus
              />
              {errors.title && <span className="error-text">{errors.title}</span>}
            </div>

            {/* Schedule Section */}
            <div className="form-group">
              <label>
                <Calendar size={14} />
                Schedule Date & Time
              </label>
              <div className="schedule-row">
                <div className="schedule-field">
                  <input
                    type="date"
                    name="scheduledDate"
                    value={formData.scheduledDate}
                    onChange={handleChange}
                    className="date-input"
                  />
                  {formData.scheduledDate && (
                    <button
                      type="button"
                      className="clear-btn"
                      onClick={() => setFormData(prev => ({ ...prev, scheduledDate: '', scheduledTime: '' }))}
                    >×</button>
                  )}
                </div>
                <div className={`schedule-field ${!formData.scheduledDate ? 'disabled' : ''}`}>
                  <input
                    type="time"
                    name="scheduledTime"
                    value={formData.scheduledTime}
                    onChange={handleChange}
                    className="time-input"
                    disabled={!formData.scheduledDate}
                  />
                </div>
              </div>
              <span className="field-hint">
                ⏰ Set a time to create a time block (Parkinson's Law — deadlines boost focus!)
              </span>
            </div>

            {/* Time Estimate Section */}
            <div className="form-group">
              <label>
                <Timer size={14} />
                Time Estimate
              </label>
              <div className="estimate-row">
                {QUICK_TIMES.map(t => (
                  <button
                    key={t.value}
                    type="button"
                    className={`estimate-btn ${formData.estimatedMinutes === t.value ? 'active' : ''}`}
                    onClick={() => setFormData(prev => ({ 
                      ...prev, 
                      estimatedMinutes: prev.estimatedMinutes === t.value ? '' : t.value 
                    }))}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              {isQuickTask ? (
                <span className="field-hint quick-hint">
                  ⚡ Quick Task (2-Minute Rule) — Do it now, don't schedule!
                </span>
              ) : (
                <span className="field-hint">
                  💡 Planning Fallacy — We underestimate time. Add buffer!
                </span>
              )}
            </div>

            {/* Recurring Section */}
            <div className="form-group">
              <label>
                <Repeat size={14} />
                Repeat
              </label>
              <div className="recurring-section">
                <button
                  type="button"
                  className={`recurring-toggle ${formData.isRecurring ? 'active' : ''}`}
                  onClick={() => setFormData(prev => ({ 
                    ...prev, 
                    isRecurring: !prev.isRecurring,
                    recurrencePattern: !prev.isRecurring ? 'daily' : ''
                  }))}
                >
                  {formData.isRecurring ? 'Recurring: ON' : 'Not recurring'}
                </button>

                {formData.isRecurring && (
                  <div className="recurrence-options">
                    <div className="recurrence-patterns">
                      {RECURRENCE_PATTERNS.map(p => (
                        <button
                          key={p.id}
                          type="button"
                          className={`pattern-btn ${formData.recurrencePattern === p.id ? 'active' : ''}`}
                          onClick={() => setFormData(prev => ({ ...prev, recurrencePattern: p.id }))}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                    
                    {formData.recurrencePattern === 'custom' && (
                      <div className="custom-days">
                        <span className="custom-label">Select days:</span>
                        <div className="weekday-buttons">
                          {WEEKDAYS.map(day => (
                            <button
                              key={day.id}
                              type="button"
                              className={`weekday-btn ${(formData.recurrenceDays || []).includes(day.id) ? 'active' : ''}`}
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
                      <span className="end-label">Until:</span>
                      <input
                        type="date"
                        name="recurrenceEndDate"
                        value={formData.recurrenceEndDate}
                        onChange={handleChange}
                        className="end-date-input"
                      />
                      {formData.recurrenceEndDate ? (
                        <button
                          type="button"
                          className="clear-btn"
                          onClick={() => setFormData(prev => ({ ...prev, recurrenceEndDate: '' }))}
                        >×</button>
                      ) : (
                        <span className="forever-text">Forever</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Priority & Tags - Collapsible */}
            <div className="form-group">
              <button
                type="button"
                className={`section-toggle ${showMoreOptions ? 'open' : ''}`}
                onClick={() => setShowMoreOptions(!showMoreOptions)}
              >
                <ChevronDown size={16} className={`toggle-icon ${showMoreOptions ? 'open' : ''}`} />
                <span>Priority & Tags (Eisenhower Matrix)</span>
                {formData.tagIds.length > 0 && <span className="tag-count">{formData.tagIds.length}</span>}
              </button>

              {showMoreOptions && (
                <div className="collapsible-content">
                  {/* Priority Grid */}
                  {!isQuickTask && (
                    <div className="priority-section">
                      <div className="priority-grid">
                        {QUADRANTS.map(q => (
                          <button
                            key={q.id}
                            type="button"
                            className={`priority-option ${formData.quadrant === q.id ? 'selected' : ''}`}
                            onClick={() => setFormData(prev => ({ ...prev, quadrant: q.id }))}
                            style={{ '--q-color': q.color }}
                          >
                            <span className="priority-label">{q.label}</span>
                            <span className="priority-subtitle">{q.subtitle}</span>
                          </button>
                        ))}
                      </div>
                      <span className="field-hint">
                        📊 Eisenhower Matrix — Prioritize what truly matters
                      </span>
                    </div>
                  )}

                  {isQuickTask && (
                    <div className="quick-task-notice">
                      ⚡ Quick tasks skip prioritization — just do them now!
                    </div>
                  )}

                  {/* Tags */}
                  <div className="tags-section">
                    <span className="tags-label">
                      <TagIcon size={14} />
                      Tags
                    </span>
                    {tags && tags.length > 0 && (
                      <div className="tags-list">
                        {tags.map(tag => {
                          const isSelected = formData.tagIds.map(id => Number(id)).includes(Number(tag.id));
                          return (
                            <div key={tag.id} className="tag-item">
                              <button
                                type="button"
                                className={`tag-chip ${isSelected ? 'selected' : ''}`}
                                style={{ '--tag-color': tag.color }}
                                onClick={() => toggleTag(tag.id)}
                              >
                                {tag.name}
                              </button>
                              <button
                                type="button"
                                className="tag-delete"
                                onClick={(e) => handleDeleteTagClick(e, tag)}
                              >×</button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <div className="new-tag-row">
                      <input
                        type="text"
                        className="new-tag-input"
                        placeholder="+ New tag..."
                        value={newTagName}
                        onChange={(e) => setNewTagName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleCreateTag();
                          }
                        }}
                      />
                      {newTagName && (
                        <button
                          type="button"
                          className="add-tag-btn"
                          onClick={handleCreateTag}
                          disabled={isCreatingTag}
                        >
                          <Plus size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="modal-actions">
              <button type="button" className="btn-cancel" onClick={onClose} disabled={isSaving}>
                Cancel
              </button>
              <button type="submit" className="btn-save" disabled={isSaving}>
                {isSaving ? 'Saving...' : (task ? 'Save Changes' : 'Create Task')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default TaskModal;
