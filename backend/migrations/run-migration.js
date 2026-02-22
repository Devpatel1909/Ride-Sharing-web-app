const pool = require('../db/Connect_to_sql');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('🔄 Connecting to database...');
    
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'add_google_oauth.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📝 Running migration...');
    await pool.query(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    console.log('✅ Google OAuth columns added to users table');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

runMigration();
