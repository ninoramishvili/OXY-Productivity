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
    console.log('Adding is_prioritized field to tasks table...');
    
    // Add is_prioritized column (false = in To Do inbox, true = in Eisenhower)
    await client.query(`
      ALTER TABLE tasks 
      ADD COLUMN IF NOT EXISTS is_prioritized BOOLEAN DEFAULT FALSE
    `);
    console.log('✅ Added is_prioritized column');
    
    // For existing tasks that already have is_urgent/is_important set (not both false),
    // mark them as prioritized
    await client.query(`
      UPDATE tasks 
      SET is_prioritized = TRUE 
      WHERE is_urgent = TRUE OR is_important = TRUE
    `);
    console.log('✅ Migrated existing prioritized tasks');
    
    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(console.error);

