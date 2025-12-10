const { query } = require('../config/database');

async function addFrogColumn() {
  try {
    await query(`
      ALTER TABLE tasks 
      ADD COLUMN IF NOT EXISTS is_frog BOOLEAN DEFAULT FALSE
    `);
    console.log('✅ is_frog column added');
    
    await query(`
      CREATE INDEX IF NOT EXISTS idx_tasks_frog 
      ON tasks(user_id, is_frog)
    `);
    console.log('✅ Index created');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addFrogColumn();

