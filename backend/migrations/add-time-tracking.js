const { query } = require('../config/database');

async function addTimeTracking() {
  try {
    // Add time tracking columns to tasks
    await query(`
      ALTER TABLE tasks 
      ADD COLUMN IF NOT EXISTS time_spent INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS pomodoro_count INTEGER DEFAULT 0
    `);
    console.log('✅ Time tracking columns added');
    
    // Create pomodoro_sessions table
    await query(`
      CREATE TABLE IF NOT EXISTS pomodoro_sessions (
        id SERIAL PRIMARY KEY,
        task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        duration INTEGER NOT NULL,
        completed BOOLEAN DEFAULT FALSE,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ pomodoro_sessions table created');
    
    // Create indexes
    await query(`
      CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_task 
      ON pomodoro_sessions(task_id);
      
      CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_user 
      ON pomodoro_sessions(user_id);
    `);
    console.log('✅ Indexes created');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addTimeTracking();

