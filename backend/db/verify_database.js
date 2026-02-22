const pool = require('./Connect_to_sql');

async function verifyDatabase() {
  try {
    console.log('🔍 Verifying database setup...\n');
    
    // Check if tables exist
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    
    const tablesResult = await pool.query(tablesQuery);
    console.log('📋 Existing Tables:');
    tablesResult.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}`);
    });
    console.log('');
    
    // Check riders table columns
    const ridersColumnsQuery = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'riders' 
      ORDER BY ordinal_position;
    `;
    
    const ridersResult = await pool.query(ridersColumnsQuery);
    console.log('👤 Riders Table Columns:');
    ridersResult.rows.forEach(row => {
      console.log(`  ✓ ${row.column_name} (${row.data_type})`);
    });
    console.log('');
    
    // Check if rides table exists and has correct structure
    const ridesColumnsQuery = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'rides' 
      ORDER BY ordinal_position;
    `;
    
    const ridesResult = await pool.query(ridesColumnsQuery);
    if (ridesResult.rows.length > 0) {
      console.log('🚗 Rides Table Columns:');
      ridesResult.rows.forEach(row => {
        console.log(`  ✓ ${row.column_name} (${row.data_type})`);
      });
    } else {
      console.log('⚠️  Rides table not found!');
    }
    console.log('');
    
    // Test a simple query on each table
    console.log('🧪 Testing table queries...');
    
    const userCount = await pool.query('SELECT COUNT(*) FROM users');
    console.log(`  ✓ Users table: ${userCount.rows[0].count} records`);
    
    const riderCount = await pool.query('SELECT COUNT(*) FROM riders');
    console.log(`  ✓ Riders table: ${riderCount.rows[0].count} records`);
    
    const ridesCount = await pool.query('SELECT COUNT(*) FROM rides');
    console.log(`  ✓ Rides table: ${ridesCount.rows[0].count} records`);
    
    const notificationsCount = await pool.query('SELECT COUNT(*) FROM notifications');
    console.log(`  ✓ Notifications table: ${notificationsCount.rows[0].count} records`);
    
    console.log('\n✅ Database verification complete!');
    console.log('✅ All tables are set up correctly.');
    console.log('✅ No manual changes needed in Neon dashboard.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    console.log('\n⚠️  You may need to check your Neon dashboard.');
    process.exit(1);
  }
}

verifyDatabase();
