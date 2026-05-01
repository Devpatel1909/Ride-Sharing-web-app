const pool = require('../db/Connect_to_sql');

async function runMigration() {
  try {
    console.log('🔄 Connecting to database...');
    
    // Test connection
    await pool.query('SELECT 1');
    console.log('✅ Database connected');
    
    // Check current constraint status
    console.log('📋 Checking current constraint...');
    const constraintCheck = await pool.query(`
      SELECT constraint_name, constraint_type
      FROM information_schema.table_constraints
      WHERE table_name = 'rides' AND constraint_type = 'PRIMARY KEY'
    `);
    console.log('Current constraints:', constraintCheck.rows);
    
    // Run migration
    console.log('📝 Running migration to allow NULL passenger_id...');
    
    // For PostgreSQL
    const alterQuery = `
      ALTER TABLE rides
      ALTER COLUMN passenger_id DROP NOT NULL;
    `;
    
    await pool.query(alterQuery);
    console.log('✅ Migration completed successfully!');
    console.log('✅ passenger_id column is now nullable');
    
    // Verify the change
    const verification = await pool.query(`
      SELECT column_name, is_nullable, data_type
      FROM information_schema.columns
      WHERE table_name = 'rides' AND column_name = 'passenger_id'
    `);
    
    if (verification.rows.length > 0) {
      const col = verification.rows[0];
      console.log(`\n📊 Verification:
        Column: ${col.column_name}
        Data Type: ${col.data_type}
        Nullable: ${col.is_nullable}
      `);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

runMigration();
