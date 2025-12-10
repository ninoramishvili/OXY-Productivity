-- Migration: Add Eat That Frog field to tasks table

ALTER TABLE tasks
ADD COLUMN is_frog BOOLEAN DEFAULT FALSE;

-- Create index for faster frog queries
CREATE INDEX idx_tasks_frog ON tasks(user_id, is_frog);

