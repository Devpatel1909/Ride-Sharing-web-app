const pool = require('./Connect_to_sql');

async function fixRidersOnline() {
  try {
    // Set ALL riders online with a location so they appear in search
    const result = await pool.query(
      `UPDATE riders SET is_online = true, current_location = 'Location (22.600113, 72.819827)' WHERE current_location IS NULL`
    );
    console.log(`✅ Updated ${result.rowCount} riders to online with default location`);

    const check = await pool.query('SELECT id, first_name, last_name, email, is_online, vehicle_type, current_location FROM riders ORDER BY id');
    console.log('\n=== ALL RIDERS AFTER FIX ===');
    console.table(check.rows);

    await pool.end();
  } catch (e) {
    console.error('Error:', e.message);
    await pool.end();
  }
}

fixRidersOnline();
