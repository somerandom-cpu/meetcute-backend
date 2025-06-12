const { Pool } = require('pg');
const env = require('./env');

// Parse database URL if provided, otherwise use individual env vars
const getDbConfig = () => {
  if (process.env.DATABASE_URL) {
    try {
      const url = new URL(process.env.DATABASE_URL);
      return {
        user: url.username,
        password: url.password,
        host: url.hostname,
        port: url.port || 5432,
        database: url.pathname.replace(/^\//, ''),
        ssl: process.env.NODE_ENV === 'production' 
          ? { rejectUnauthorized: false } 
          : false
      };
    } catch (err) {
      console.error('❌ Error parsing DATABASE_URL:', err);
      process.exit(1);
    }
  }

  // Fall back to individual environment variables
  return {
    user: env.DB_USER,
    host: env.DB_HOST,
    database: env.DB_NAME,
    password: env.DB_PASSWORD,
    port: env.DB_PORT || 5432,
    ssl: process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false
  };
};

// Create a new pool with the configuration
const pool = new Pool(getDbConfig());

// Test connection
const initializeDatabase = async () => {
  try {
    await pool.query('SELECT NOW()');
    console.log('✅ Database connected successfully');
  } catch (err) {
    if (err.code === '3D000') {
      // Database doesn't exist, create it (only works with individual env vars)
      if (process.env.DATABASE_URL) {
        console.error('❌ Database does not exist. Please create it first when using DATABASE_URL');
        process.exit(1);
      }
      
      const pgPool = new Pool({
        user: env.DB_USER,
        host: env.DB_HOST,
        database: 'postgres',
        password: env.DB_PASSWORD,
        port: env.DB_PORT,
      });

      try {
        await pgPool.query(`CREATE DATABASE ${env.DB_NAME}`);
        console.log(`✅ Database ${env.DB_NAME} created`);
      } catch (createErr) {
        console.error('❌ Error creating database:', createErr);
        process.exit(1);
      } finally {
        await pgPool.end();
      }
    } else {
      console.error('❌ Database connection error:', err);
      process.exit(1);
    }
  }
};

// Initialize database connection
initializeDatabase();

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = pool;
