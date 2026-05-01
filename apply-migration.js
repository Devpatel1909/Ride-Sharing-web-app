const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_D5Rd6XpATZUI@ep-old-wildflower-akve1vsg-pooler.c-3.us-west-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require',
  ssl: {
    rejectUnauthorized: false
  }
});

async function applyMigration() {
  try {
    console.log('🔄 Connecting to database...');
    await pool.query('SELECT 1');
    console.log('✅ Database connected');
    
    console.log('📝 Running migration: ALTER TABLE rides ALTER COLUMN passenger_id DROP NOT NULL');
    
    await pool.query(`
      ALTER TABLE rides
      ALTER COLUMN passenger_id DROP NOT NULL;
    `);
    
    console.log('✅ Migration completed successfully!');
    console.log('✅ passenger_id column is now nullable');
    
    const result = await pool.query(`
      SELECT column_name, is_nullable, data_type
      FROM information_schema.columns
      WHERE table_name = 'rides' AND column_name = 'passenger_id'
    `);
    
    if (result.rows.length > 0) {
      const col = result.rows[0];
      console.log(`\n📊 Verification:
  Column: ${col.column_name}
  Data Type: ${col.data_type}
  Nullable: ${col.is_nullable}`);
    }
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

applyMigration();
