-- Migration: Add recurring task fields
-- Description: Support for recurring/repeating tasks

-- Add recurring fields to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_pattern VARCHAR(20) DEFAULT NULL;
-- recurrence_pattern options: 'daily', 'weekdays', 'weekly', 'biweekly', 'monthly', 'custom'

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_days INTEGER[] DEFAULT NULL;
-- For 'weekly' or 'custom': array of days 0=Sunday, 1=Monday, ..., 6=Saturday
-- Example: {1,3,5} = Monday, Wednesday, Friday

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_end_date DATE DEFAULT NULL;
-- Optional end date for recurrence (NULL = no end)

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS parent_task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL DEFAULT NULL;
-- Links recurring instances to the original recurring task template

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_index INTEGER DEFAULT NULL;
-- Which occurrence of the recurring series this is (1st, 2nd, etc.)

-- Create index for recurring tasks
CREATE INDEX IF NOT EXISTS idx_tasks_recurring ON tasks(is_recurring) WHERE is_recurring = TRUE;
CREATE INDEX IF NOT EXISTS idx_tasks_parent_id ON tasks(parent_task_id) WHERE parent_task_id IS NOT NULL;

COMMENT ON COLUMN tasks.is_recurring IS 'Whether this is a recurring task template';
COMMENT ON COLUMN tasks.recurrence_pattern IS 'Pattern: daily, weekdays, weekly, biweekly, monthly, custom';
COMMENT ON COLUMN tasks.recurrence_days IS 'Array of day numbers (0-6) for weekly/custom patterns';
COMMENT ON COLUMN tasks.recurrence_end_date IS 'Optional end date for recurrence series';
COMMENT ON COLUMN tasks.parent_task_id IS 'Reference to parent recurring task template';

