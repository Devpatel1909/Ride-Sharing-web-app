const pool = require('../db/Connect_to_sql');
const fs = require('fs');
const path = require('path');

async function runPaymentMigration() {
  try {
    console.log('🔄 Connecting to database...');

    const migrationPath = path.join(__dirname, 'add_ride_payment_columns.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📝 Running payment migration...');
    await pool.query(migrationSQL);

    console.log('✅ Payment migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Payment migration failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

runPaymentMigration();
