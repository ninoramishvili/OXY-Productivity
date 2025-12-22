const { query } = require('../config/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('Running recurring tasks migration...');
    
    const sqlPath = path.join(__dirname, '008_add_recurring_fields.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Split by semicolons and run each statement
    const statements = sql.split(';').filter(s => s.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await query(statement);
          console.log('✓ Executed:', statement.trim().substring(0, 60) + '...');
        } catch (err) {
          // Ignore "already exists" errors
          if (!err.message.includes('already exists') && !err.message.includes('duplicate')) {
            console.error('Error:', err.message);
          }
        }
      }
    }
    
    console.log('✅ Recurring tasks migration complete!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();

