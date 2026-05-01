const pool = require('../db/Connect_to_sql');

const cleanupExpiredPendingRides = async () => {
  try {
    const deleteQuery = `
      DELETE FROM rides
      WHERE status = 'pending'
        AND requested_at < CURRENT_TIMESTAMP - INTERVAL '30 minutes'
      RETURNING id
    `;

    const result = await pool.query(deleteQuery);
    const deletedCount = result.rowCount || 0;

    if (deletedCount > 0) {
      console.log(`🧹 Cleaned up ${deletedCount} expired pending ride request(s)`);
    }

    return deletedCount;
  } catch (error) {
    console.error('Error cleaning up expired pending rides:', error);
    throw error;
  }
};

module.exports = {
  cleanupExpiredPendingRides,
};
