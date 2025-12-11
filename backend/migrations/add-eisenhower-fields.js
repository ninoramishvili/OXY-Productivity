const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function migrate() {
  const client = await pool.connect();
  
  try {
    console.log('Adding Eisenhower Matrix fields to tasks table...');
    
    // Add is_urgent column
    await client.query(`
      ALTER TABLE tasks 
      ADD COLUMN IF NOT EXISTS is_urgent BOOLEAN DEFAULT FALSE
    `);
    console.log('✅ Added is_urgent column');
    
    // Add is_important column
    await client.query(`
      ALTER TABLE tasks 
      ADD COLUMN IF NOT EXISTS is_important BOOLEAN DEFAULT FALSE
    `);
    console.log('✅ Added is_important column');
    
    // Add index for efficient querying
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_tasks_eisenhower 
      ON tasks (user_id, is_urgent, is_important)
    `);
    console.log('✅ Added Eisenhower index');
    
    console.log('🎉 Eisenhower Matrix migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(console.error);

