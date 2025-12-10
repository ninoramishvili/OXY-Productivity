-- Migration: Add Daily Highlight fields to tasks table

ALTER TABLE tasks
ADD COLUMN is_daily_highlight BOOLEAN DEFAULT FALSE,
ADD COLUMN highlight_date DATE;

-- Create index for faster highlight queries
CREATE INDEX idx_tasks_highlight ON tasks(user_id, is_daily_highlight, highlight_date);

-- Ensure only one highlight per user per day
CREATE UNIQUE INDEX idx_one_highlight_per_day 
ON tasks(user_id, highlight_date) 
WHERE is_daily_highlight = TRUE;

