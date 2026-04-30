const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_D5Rd6XpATZUI@ep-old-wildflower-akve1vsg-pooler.c-3.us-west-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require',
  ssl: {
    rejectUnauthorized: false
  },
  // Increase pool size to handle concurrent requests in load tests
  // Default pool size lowered to 20 to avoid overwhelming DB server
  max: parseInt(process.env.PG_POOL_MAX || '20', 10),
  idleTimeoutMillis: parseInt(process.env.PG_IDLE_TIMEOUT || '30000', 10),
  // Allow longer time for initial DB connections in cloud environments
  connectionTimeoutMillis: parseInt(process.env.PG_CONN_TIMEOUT || '10000', 10)
});

const testDatabaseConnection = async () => {
  await pool.query('SELECT 1');
};

pool.on('connect', () => {
  console.log('Connected to the database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  // Don't exit process, just log the error
});

module.exports = pool;
module.exports.testDatabaseConnection = testDatabaseConnection;