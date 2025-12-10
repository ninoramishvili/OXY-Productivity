import { useState, useEffect } from 'react';
import { X, Tag as TagIcon, Plus } from 'lucide-react';
import { tagsAPI } from '../utils/api';
import ConfirmModal from './ConfirmModal';
import './TaskModal.css';

function TaskModal({ isOpen, onClose, onSave, task, tags, onTagsUpdate, onTasksUpdate }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    tagIds: []
  });
  const [errors, setErrors] = useState({});
  const [newTagName, setNewTagName] = useState('');
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTagConfirm, setDeleteTagConfirm] = useState({ isOpen: false, tag: null });

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        priority: task.priority || 'medium',
        tagIds: task.tags?.map(t => t.id) || []
      });
    } else {
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        tagIds: []
      });
    }
    setErrors({});
  }, [task, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const toggleTag = (tagId) => {
    setFormData(prev => ({
      ...prev,
      tagIds: prev.tagIds.includes(tagId)
        ? prev.tagIds.filter(id => id !== tagId)
        : [...prev.tagIds, tagId]
    }));
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
        await onSave(formData);
      } finally {
        setIsSaving(false);
      }
    }
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

  const handleDeleteTagClick = (tag) => {
    setDeleteTagConfirm({ isOpen: true, tag });
  };

  const confirmDeleteTag = async () => {
    const tagId = deleteTagConfirm.tag.id;
    
    try {
      const response = await tagsAPI.deleteTag(tagId);
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
      alert('Failed to delete tag: ' + (err.response?.data?.message || err.message));
    } finally {
      setDeleteTagConfirm({ isOpen: false, tag: null });
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Delete Tag Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteTagConfirm.isOpen}
        onClose={() => setDeleteTagConfirm({ isOpen: false, tag: null })}
        onConfirm={confirmDeleteTag}
        title="Delete Tag"
        message={`Are you sure you want to delete "${deleteTagConfirm.tag?.name}"? This tag will be removed from all tasks using it.`}
      />

      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>{task ? 'Edit Task' : 'Create New Task'}</h2>
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

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Add details (optional)..."
              rows="3"
            />
          </div>

          <div className="form-group form-group-compact">
            <label htmlFor="priority">Priority</label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="priority-select"
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="form-group form-group-compact">
            <label>
              <TagIcon size={14} />
              Tags
            </label>
            {tags && tags.length > 0 && (
              <div className="tags-selector">
                {tags.map(tag => (
                  <div key={tag.id} className="tag-chip-wrapper">
                    <button
                      type="button"
                      className={`tag-chip ${formData.tagIds.includes(tag.id) ? 'selected' : ''}`}
                      style={{ 
                        '--tag-color': tag.color,
                        borderColor: formData.tagIds.includes(tag.id) ? tag.color : 'transparent'
                      }}
                      onClick={() => toggleTag(tag.id)}
                    >
                      {tag.name}
                    </button>
                    <button
                      type="button"
                      className="tag-delete-btn"
                      onClick={() => handleDeleteTagClick(tag)}
                      title="Delete tag"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="tag-input-row">
              <input
                type="text"
                className="tag-input"
                placeholder="New tag..."
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleCreateTag())}
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

