const fs = require('fs');
const path = require('path');
const pool = require('../db/Connect_to_sql');

const runSharedRidePerformanceIndexes = async () => {
  try {
    const migrationPath = path.join(__dirname, 'add_shared_ride_performance_indexes.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    const statements = migrationSql
      .split(/;\s*(?:\r?\n|$)/)
      .map(statement => statement.trim())
      .filter(Boolean);

    console.log('🚀 Running shared ride performance index migration...');
    for (const statement of statements) {
      await pool.query(statement);
    }

    console.log('✅ Shared ride performance indexes created successfully!');
  } catch (error) {
    console.error('❌ Error running shared ride performance index migration:', error.message);
    throw error;
  }
};

module.exports = { runSharedRidePerformanceIndexes };

if (require.main === module) {
  runSharedRidePerformanceIndexes()
    .then(() => {
      console.log('\n✨ Performance index migration finished');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Performance index migration failed:', error);
      process.exit(1);
    });
}