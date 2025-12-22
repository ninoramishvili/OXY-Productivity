import { useState, useEffect } from 'react';
import { X, Tag as TagIcon, Plus, Repeat, ChevronDown, Calendar, Clock, Timer } from 'lucide-react';
import { tagsAPI } from '../utils/api';
import ConfirmModal from './ConfirmModal';
import './TaskModal.css';

// Recurrence pattern options
const RECURRENCE_PATTERNS = [
  { id: 'daily', label: 'Daily', icon: '📅' },
  { id: 'weekdays', label: 'Weekdays', icon: '💼' },
  { id: 'weekly', label: 'Weekly', icon: '📆' },
  { id: 'biweekly', label: 'Bi-weekly', icon: '🔄' },
  { id: 'monthly', label: 'Monthly', icon: '🗓️' },
  { id: 'custom', label: 'Custom', icon: '⚙️' },
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

// Eisenhower Quadrant definitions - compact version
const QUADRANTS = [
  { id: 'doFirst', label: '🔥 Do First', isUrgent: true, isImportant: true, color: '#ef4444' },
  { id: 'schedule', label: '📅 Schedule', isUrgent: false, isImportant: true, color: '#3b82f6' },
  { id: 'delegate', label: '👥 Delegate', isUrgent: true, isImportant: false, color: '#f59e0b' },
  { id: 'eliminate', label: '🗑️ Eliminate', isUrgent: false, isImportant: false, color: '#6b7280' },
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

  // Helper to get quadrant from urgent/important flags
  const getQuadrantFromFlags = (isUrgent, isImportant) => {
    if (isUrgent && isImportant) return 'doFirst';
    if (!isUrgent && isImportant) return 'schedule';
    if (isUrgent && !isImportant) return 'delegate';
    return 'eliminate';
  };

  // Check if more options should be auto-expanded
  const hasAdvancedSettings = () => {
    return formData.quadrant !== 'doFirst' || 
           formData.tagIds.length > 0 || 
           (tags && tags.length > 0);
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
      // Auto-expand more options if task has priority or tags
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
        <div className="modal-content compact" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="modal-header compact">
            <h2>{task ? 'Edit Task' : 'New Task'}</h2>
            <button className="modal-close" onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="modal-form compact">
            {/* Title - Always visible, prominent */}
            <div className="form-group title-group">
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

            {/* Schedule Row - Date, Time, Estimate inline */}
            <div className="schedule-row">
              <div className="schedule-item" title="Schedule date">
                <Calendar size={16} />
                <input
                  type="date"
                  name="scheduledDate"
                  value={formData.scheduledDate}
                  onChange={handleChange}
                  className="inline-date"
                />
                {formData.scheduledDate && (
                  <button
                    type="button"
                    className="clear-btn"
                    onClick={() => setFormData(prev => ({ ...prev, scheduledDate: '', scheduledTime: '' }))}
                  >×</button>
                )}
              </div>

              <div className={`schedule-item ${!formData.scheduledDate ? 'disabled' : ''}`} title="Schedule time">
                <Clock size={16} />
                <input
                  type="time"
                  name="scheduledTime"
                  value={formData.scheduledTime}
                  onChange={handleChange}
                  className="inline-time"
                  disabled={!formData.scheduledDate}
                />
              </div>

              <div className="schedule-item estimate-item" title="Time estimate">
                <Timer size={16} />
                <div className="estimate-buttons">
                  {QUICK_TIMES.map(t => (
                    <button
                      key={t.value}
                      type="button"
                      className={`est-btn ${formData.estimatedMinutes === t.value ? 'active' : ''}`}
                      onClick={() => setFormData(prev => ({ 
                        ...prev, 
                        estimatedMinutes: prev.estimatedMinutes === t.value ? '' : t.value 
                      }))}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Task Indicator */}
            {isQuickTask && (
              <div className="quick-task-badge">
                ⚡ Quick Task — Do it now!
              </div>
            )}

            {/* Recurring Toggle Row */}
            <div className="option-row">
              <button
                type="button"
                className={`option-toggle ${formData.isRecurring ? 'active' : ''}`}
                onClick={() => setFormData(prev => ({ 
                  ...prev, 
                  isRecurring: !prev.isRecurring,
                  recurrencePattern: !prev.isRecurring ? 'daily' : ''
                }))}
              >
                <Repeat size={14} />
                <span>Repeat</span>
              </button>

              {formData.isRecurring && (
                <div className="recurrence-inline">
                  {RECURRENCE_PATTERNS.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      className={`rec-btn ${formData.recurrencePattern === p.id ? 'active' : ''}`}
                      onClick={() => setFormData(prev => ({ ...prev, recurrencePattern: p.id }))}
                      title={p.label}
                    >
                      {p.icon}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Custom Days - only when custom is selected */}
            {formData.isRecurring && formData.recurrencePattern === 'custom' && (
              <div className="custom-days-row">
                {WEEKDAYS.map(day => (
                  <button
                    key={day.id}
                    type="button"
                    className={`day-btn ${(formData.recurrenceDays || []).includes(day.id) ? 'active' : ''}`}
                    onClick={() => toggleRecurrenceDay(day.id)}
                    title={day.name}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            )}

            {/* Recurrence End Date - inline when recurring */}
            {formData.isRecurring && (
              <div className="recurrence-end-row">
                <span className="end-label">Until:</span>
                <input
                  type="date"
                  name="recurrenceEndDate"
                  value={formData.recurrenceEndDate}
                  onChange={handleChange}
                  className="end-date-input"
                  min={formData.scheduledDate || new Date().toISOString().split('T')[0]}
                />
                {formData.recurrenceEndDate && (
                  <button
                    type="button"
                    className="clear-btn"
                    onClick={() => setFormData(prev => ({ ...prev, recurrenceEndDate: '' }))}
                  >×</button>
                )}
                {!formData.recurrenceEndDate && <span className="forever-hint">Forever</span>}
              </div>
            )}

            {/* More Options Toggle */}
            <button
              type="button"
              className={`more-options-toggle ${showMoreOptions ? 'open' : ''}`}
              onClick={() => setShowMoreOptions(!showMoreOptions)}
            >
              <ChevronDown size={16} className={`chevron ${showMoreOptions ? 'open' : ''}`} />
              <span>Priority & Tags</span>
              {formData.tagIds.length > 0 && <span className="options-badge">{formData.tagIds.length}</span>}
            </button>

            {/* Collapsible: Priority & Tags */}
            {showMoreOptions && (
              <div className="more-options-panel">
                {/* Priority - Compact 2x2 */}
                {!isQuickTask && (
                  <div className="priority-section">
                    <div className="priority-grid">
                      {QUADRANTS.map(q => (
                        <button
                          key={q.id}
                          type="button"
                          className={`priority-btn ${formData.quadrant === q.id ? 'selected' : ''}`}
                          onClick={() => setFormData(prev => ({ ...prev, quadrant: q.id }))}
                          style={{ '--q-color': q.color }}
                        >
                          {q.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tags - Compact */}
                <div className="tags-section">
                  {tags && tags.length > 0 && (
                    <div className="tags-list">
                      {tags.map(tag => {
                        const isSelected = formData.tagIds.map(id => Number(id)).includes(Number(tag.id));
                        return (
                          <div key={tag.id} className="tag-item">
                            <button
                              type="button"
                              className={`tag-btn ${isSelected ? 'selected' : ''}`}
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
                      placeholder="+ Add tag"
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

            {/* Actions */}
            <div className="modal-actions compact">
              <button type="button" className="btn-cancel" onClick={onClose} disabled={isSaving}>
                Cancel
              </button>
              <button type="submit" className="btn-save" disabled={isSaving}>
                {isSaving ? 'Saving...' : (task ? 'Save' : 'Create')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default TaskModal;
