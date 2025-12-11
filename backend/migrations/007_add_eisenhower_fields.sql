-- Add Eisenhower Matrix fields to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_urgent BOOLEAN DEFAULT FALSE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_important BOOLEAN DEFAULT FALSE;

-- Create index for faster quadrant queries
CREATE INDEX IF NOT EXISTS idx_tasks_eisenhower ON tasks(user_id, is_urgent, is_important);

