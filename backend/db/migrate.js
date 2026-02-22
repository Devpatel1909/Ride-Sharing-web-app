const pool = require('./Connect_to_sql');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('📚 Running database migration...');
    
    // Read the PostgreSQL schema file
    const schemaSQL = fs.readFileSync(
      path.join(__dirname, 'schema_postgres.sql'),
      'utf8'
    );
    
    // Execute the schema
    await pool.query(schemaSQL);
    
    console.log('✅ Database tables created successfully!');
    console.log('✅ Migration completed!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
