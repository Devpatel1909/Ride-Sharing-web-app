const fs = require('fs');
const path = require('path');
const pool = require('../db/Connect_to_sql');

const runSharedRideMigration = async () => {
  try {
    const migrationPath = path.join(__dirname, 'add_shared_ride_tables.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');

    console.log('🚀 Running shared ride migration...');
    
    // Execute the entire SQL script at once to handle dollar-quoted strings properly
    await pool.query(migrationSql);

    console.log('✅ Shared ride migration completed successfully!');
    console.log('\n📊 Migration Summary:');
    console.log('  ✓ Created ride_passengers table');
    console.log('  ✓ Created passenger_status enum type');
    console.log('  ✓ Added max_passengers and current_passengers columns to rides table');
    console.log('  ✓ Created indexes for performance');
    console.log('  ✓ Created triggers for data validation and timestamps');

  } catch (error) {
    console.error('❌ Error running migration:', error.message);
    throw error;
  }
};

// Export for use in other modules
module.exports = { runSharedRideMigration };

// If run directly as a script
if (require.main === module) {
  runSharedRideMigration()
    .then(() => {
      console.log('\n✨ Migration script finished');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Migration failed:', error);
      process.exit(1);
    });
}
