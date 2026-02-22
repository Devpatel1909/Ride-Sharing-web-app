const pool = require('./Connect_to_sql');

async function viewData() {
  try {
    console.log('📊 CURRENT DATA IN NEON DATABASE\n');
    console.log('='.repeat(60));
    
    // Show all riders
    console.log('\n👥 RIDERS:');
    const riders = await pool.query(`
      SELECT 
        id, 
        first_name, 
        last_name, 
        email, 
        is_online, 
        total_rides, 
        total_earnings, 
        rating 
      FROM riders 
      ORDER BY id
    `);
    
    console.table(riders.rows);
    
    // Show all users (passengers)
    console.log('\n🚶 PASSENGERS (Users):');
    const users = await pool.query(`
      SELECT id, name, email, created_at 
      FROM users 
      ORDER BY id
    `);
    
    console.table(users.rows);
    
    // Show all rides
    console.log('\n🚗 RIDES:');
    const rides = await pool.query(`
      SELECT 
        id, 
        pickup_location, 
        destination, 
        status, 
        fare, 
        ride_type,
        requested_at 
      FROM rides 
      ORDER BY requested_at DESC 
      LIMIT 10
    `);
    
    if (rides.rows.length > 0) {
      console.table(rides.rows);
    } else {
      console.log('  No rides booked yet.');
    }
    
    // Show notifications
    console.log('\n🔔 NOTIFICATIONS:');
    const notifications = await pool.query(`
      SELECT 
        id, 
        type, 
        title, 
        message, 
        is_read, 
        created_at 
      FROM notifications 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    
    if (notifications.rows.length > 0) {
      console.table(notifications.rows);
    } else {
      console.log('  No notifications yet.');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Data retrieved from Neon Cloud Database');
    console.log(`📍 Location: US West 2 (AWS)`);
    console.log(`🔗 Host: ep-old-wildflower-akve1vsg-pooler.c-3.us-west-2.aws.neon.tech`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

viewData();
