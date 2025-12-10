-- Migration: Create tasks table
-- Description: Store user tasks and todos

CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT FALSE,
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  scheduled_date DATE,
  scheduled_time TIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);
CREATE INDEX IF NOT EXISTS idx_tasks_scheduled_date ON tasks(scheduled_date);

-- Insert default demo task (same as hardcoded data)
INSERT INTO tasks (user_id, title, description, completed, priority, created_at) VALUES
  (1, 'Welcome to your productivity app!', 'This is a sample task. You can edit or delete it.', FALSE, 'high', '2025-12-10 10:00:00')
ON CONFLICT DO NOTHING;

-- Add comment
COMMENT ON TABLE tasks IS 'User tasks and todos for OXY Productivity';

