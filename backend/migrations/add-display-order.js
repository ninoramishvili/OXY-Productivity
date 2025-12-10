const { query } = require('../config/database');

async function addDisplayOrder() {
  try {
    // Add display_order column
    await query(`
      ALTER TABLE tasks 
      ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0
    `);
    console.log('✅ display_order column added');
    
    // Set initial display order based on created_at
    await query(`
      UPDATE tasks 
      SET display_order = subquery.row_num
      FROM (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as row_num
        FROM tasks
      ) AS subquery
      WHERE tasks.id = subquery.id
    `);
    console.log('✅ Initial display order set');
    
    // Create index
    await query(`
      CREATE INDEX IF NOT EXISTS idx_tasks_display_order 
      ON tasks(user_id, display_order)
    `);
    console.log('✅ Index created');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addDisplayOrder();

