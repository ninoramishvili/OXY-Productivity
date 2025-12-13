// Migration: Add estimated_minutes field to tasks table
const { query } = require('../config/database');

async function migrate() {
  console.log('Adding estimated_minutes column to tasks table...');
  
  try {
    // Add estimated_minutes column (in minutes)
    await query(`
      ALTER TABLE tasks 
      ADD COLUMN IF NOT EXISTS estimated_minutes INTEGER DEFAULT NULL
    `);
    
    console.log('✅ estimated_minutes column added successfully!');
    
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
}

migrate()
  .then(() => {
    console.log('Migration completed!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });

