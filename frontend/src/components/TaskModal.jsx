import { useState, useEffect } from 'react';
import { X, Tag as TagIcon, Plus } from 'lucide-react';
import { tagsAPI } from '../utils/api';
import './TaskModal.css';

function TaskModal({ isOpen, onClose, onSave, task, tags, onTagsUpdate }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    tagIds: []
  });
  const [errors, setErrors] = useState({});
  const [newTagName, setNewTagName] = useState('');
  const [isCreatingTag, setIsCreatingTag] = useState(false);

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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSave(formData);
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
        setNewTagName('');
        // Notify parent to refresh tags
        if (onTagsUpdate) {
          onTagsUpdate();
        }
      }
    } catch (err) {
      alert('Failed to create tag: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsCreatingTag(false);
    }
  };

  if (!isOpen) return null;

  return (
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

          <div className="form-group">
            <label htmlFor="priority">Priority</label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="priority-select"
            >
              <option value="highest" className="priority-option-highest">🔴 Highest</option>
              <option value="high" className="priority-option-high">🟠 High</option>
              <option value="medium" className="priority-option-medium">🟡 Medium</option>
              <option value="low" className="priority-option-low">🟢 Low</option>
            </select>
          </div>

          <div className="form-group">
            <label>
              <TagIcon size={16} />
              Tags
            </label>
            {tags && tags.length > 0 && (
              <div className="tags-selector">
                {tags.map(tag => (
                  <button
                    key={tag.id}
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
                ))}
              </div>
            )}
            <div className="tag-input-row">
              <input
                type="text"
                className="tag-input"
                placeholder="Create new tag..."
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
                <Plus size={16} />
                Add
              </button>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-save">
              {task ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TaskModal;

