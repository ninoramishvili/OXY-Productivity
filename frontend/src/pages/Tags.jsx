import { useState, useEffect } from 'react';
import { tagsAPI } from '../utils/api';
import ConfirmModal from '../components/ConfirmModal';
import { Tag as TagIcon, Plus, Trash2, Check } from 'lucide-react';
import './Tags.css';

function Tags() {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#FF7F50');
  const [isCreating, setIsCreating] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, tag: null });

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      const response = await tagsAPI.getTags();
      if (response.success) {
        setTags(response.tags);
      }
    } catch (err) {
      console.error('Failed to load tags:', err);
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    setIsCreating(true);
    try {
      const response = await tagsAPI.createTag({
        name: newTagName.trim(),
        color: newTagColor
      });

      if (response.success) {
        showSuccess('Tag created successfully!');
        setNewTagName('');
        setNewTagColor('#FF7F50');
        loadTags();
      }
    } catch (err) {
      alert('Failed to create tag: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteClick = (tag) => {
    setDeleteConfirm({ isOpen: true, tag });
  };

  const confirmDelete = async () => {
    try {
      const response = await tagsAPI.deleteTag(deleteConfirm.tag.id);
      if (response.success) {
        const message = response.removedFromTasks > 0
          ? `Tag deleted and removed from ${response.removedFromTasks} task${response.removedFromTasks > 1 ? 's' : ''}!`
          : 'Tag deleted successfully!';
        showSuccess(message);
        loadTags();
      }
    } catch (err) {
      alert('Failed to delete tag');
    } finally {
      setDeleteConfirm({ isOpen: false, tag: null });
    }
  };

  const predefinedColors = [
    '#FF7F50', // Coral
    '#00CED1', // Teal
    '#FFB84D', // Orange
    '#4ECB71', // Green
    '#9b59b6', // Purple
    '#e74c3c', // Red
    '#3498db', // Blue
    '#f39c12', // Yellow
  ];

  return (
    <div className="tags-page">
      {/* Success Message */}
      {successMessage && (
        <div className="success-toast">
          <Check size={18} />
          {successMessage}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, tag: null })}
        onConfirm={confirmDelete}
        title="Delete Tag"
        message={`Are you sure you want to delete "${deleteConfirm.tag?.name}"? This tag will be removed from all tasks using it.`}
      />

      <div className="tags-content">
        <div className="tags-header">
          <div className="header-title">
            <TagIcon size={32} className="header-icon" />
            <div>
              <h1>Manage Tags</h1>
              <p className="header-subtitle">
                {tags.length} {tags.length === 1 ? 'tag' : 'tags'}
              </p>
            </div>
          </div>
        </div>

        {/* Create Tag Section */}
        <div className="create-tag-section">
          <h3>Create New Tag</h3>
          <div className="create-tag-form">
            <input
              type="text"
              className="tag-name-input"
              placeholder="Tag name..."
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreateTag()}
            />
            <div className="color-picker">
              {predefinedColors.map(color => (
                <button
                  key={color}
                  className={`color-option ${newTagColor === color ? 'selected' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setNewTagColor(color)}
                  title={color}
                />
              ))}
            </div>
            <button
              className="btn-create-tag"
              onClick={handleCreateTag}
              disabled={!newTagName.trim() || isCreating}
            >
              <Plus size={16} />
              Create Tag
            </button>
          </div>
        </div>

        {/* Tags List */}
        <div className="tags-list-section">
          <h3>Your Tags</h3>
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading tags...</p>
            </div>
          ) : tags.length === 0 ? (
            <div className="empty-state-card">
              <TagIcon size={48} className="empty-icon" />
              <p>No tags yet. Create your first tag above!</p>
            </div>
          ) : (
            <div className="tags-grid">
              {tags.map(tag => (
                <div key={tag.id} className="tag-card">
                  <div className="tag-card-content">
                    <div 
                      className="tag-color-indicator"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className="tag-name">{tag.name}</span>
                  </div>
                  <button
                    className="btn-delete-tag"
                    onClick={() => handleDeleteClick(tag)}
                    title="Delete tag"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Tags;

