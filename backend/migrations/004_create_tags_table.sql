-- Migration: Create tags/categories table
-- Description: Store task tags/categories for organization

CREATE TABLE IF NOT EXISTS tags (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  color VARCHAR(20) DEFAULT '#00CED1',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create task_tags junction table (many-to-many)
CREATE TABLE IF NOT EXISTS task_tags (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(task_id, tag_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);
CREATE INDEX IF NOT EXISTS idx_task_tags_task_id ON task_tags(task_id);
CREATE INDEX IF NOT EXISTS idx_task_tags_tag_id ON task_tags(tag_id);

-- Insert some default tags for demo user
INSERT INTO tags (user_id, name, color) VALUES
  (1, 'Work', '#FF7F50'),
  (1, 'Personal', '#00CED1'),
  (1, 'Health', '#6ee7b7')
ON CONFLICT DO NOTHING;

-- Add comment
COMMENT ON TABLE tags IS 'User-defined tags/categories for tasks';
COMMENT ON TABLE task_tags IS 'Junction table linking tasks to tags';

