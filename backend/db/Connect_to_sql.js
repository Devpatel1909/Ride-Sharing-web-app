const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_D5Rd6XpATZUI@ep-old-wildflower-akve1vsg-pooler.c-3.us-west-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require',
  ssl: {
    rejectUnauthorized: false
  }
});

pool.on('connect', () => {
  console.log('Connected to the database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  // Don't exit process, just log the error
});

module.exports = pool;