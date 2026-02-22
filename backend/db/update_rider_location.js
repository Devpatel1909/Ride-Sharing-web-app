const pool = require('./Connect_to_sql');

async function updateRiderLocation() {
  try {
    // Update a test rider with a location in Anand, Gujarat
    const query = `
      UPDATE riders 
      SET 
        current_location = 'Anand, Gujarat (22.5645, 72.9289)',
        is_online = true
      WHERE id = 4
      RETURNING id, first_name, last_name, current_location, is_online;
    `;
    
    const result = await pool.query(query);
    
    if (result.rows.length > 0) {
      console.log('✅ Rider location updated:');
      console.log(result.rows[0]);
    } else {
      console.log('❌ No rider with ID 4 found');
      
      // Show all riders
      const allRiders = await pool.query('SELECT id, first_name, last_name, is_online, current_location FROM riders');
      console.log('\n📋 All riders:');
      console.table(allRiders.rows);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

updateRiderLocation();
