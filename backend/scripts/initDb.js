#!/usr/bin/env node
const { execSync } = require('child_process');
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.cyan}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}[WARN]${colors.reset} ${msg}`),
  error: (msg) => console.error(`${colors.red}[ERROR]${colors.reset} ${msg}`)
};

const runCommand = (command, options = {}) => {
  try {
    log.info(`Running: ${command}`);
    const output = execSync(command, { stdio: 'inherit', ...options });
    return { success: true, output };
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      stderr: error.stderr?.toString().trim() || ''
    };
  }
};

const askQuestion = (question) => {
  return new Promise((resolve) => {
    readline.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
};

const checkDatabaseConnection = async () => {
  log.info('🔍 Testing database connection...');
  const { Client } = require('pg');
  const config = require('../config/database.js').development;
  
  const client = new Client({
    user: config.username,
    host: config.host,
    database: 'postgres', // Connect to default database first
    password: config.password,
    port: config.port,
  });

  try {
    await client.connect();
    log.success('✅ Successfully connected to PostgreSQL server');
    return { client, connected: true };
  } catch (error) {
    log.error('❌ Failed to connect to PostgreSQL server');
    log.error(`Error: ${error.message}`);
    return { client: null, connected: false, error };
  }
};

const createDatabase = async (client) => {
  const config = require('../config/database.js').development;
  const dbName = config.database;
  
  try {
    log.info(`🔄 Checking if database '${dbName}' exists...`);
    const dbExists = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1", 
      [dbName]
    );

    if (dbExists.rows.length === 0) {
      log.info(`🆕 Creating database '${dbName}'...`);
      await client.query(`CREATE DATABASE ${dbName}`);
      log.success(`✅ Database '${dbName}' created successfully`);
    } else {
      log.success(`✅ Database '${dbName}' already exists`);
    }
    
    return true;
  } catch (error) {
    log.error(`❌ Failed to create database '${dbName}'`);
    log.error(`Error: ${error.message}`);
    return false;
  }
};

const runMigrations = async () => {
  log.info('🔄 Running database migrations...');
  const result = runCommand('npx sequelize-cli db:migrate');
  
  if (!result.success) {
    log.error('❌ Failed to run migrations');
    log.error(result.stderr || result.error);
    return false;
  }
  
  log.success('✅ Database migrations completed successfully');
  return true;
};

const seedDatabase = async () => {
  log.info('🌱 Seeding database with initial data...');
  const result = runCommand('npm run seed');
  
  if (!result.success) {
    log.error('❌ Failed to seed database');
    log.error(result.stderr || result.error);
    return false;
  }
  
  log.success('✅ Database seeded successfully');
  return true;
};

const main = async () => {
  console.log('\n🚀 MeetCute Database Initialization');
  console.log('='.repeat(60) + '\n');

  // Check database connection
  const { client, connected } = await checkDatabaseConnection();
  if (!connected) {
    log.error('Please check your database configuration in config/database.js');
    process.exit(1);
  }

  try {
    // Create database if it doesn't exist
    const dbCreated = await createDatabase(client);
    if (!dbCreated) {
      throw new Error('Failed to create database');
    }

    // Run migrations
    const migrationsRun = await runMigrations();
    if (!migrationsRun) {
      throw new Error('Failed to run migrations');
    }

    // Seed database
    const shouldSeed = await askQuestion('\nWould you like to seed the database with initial data? (y/N): ');
    if (shouldSeed.toLowerCase() === 'y') {
      const seeded = await seedDatabase();
      if (!seeded) {
        throw new Error('Failed to seed database');
      }
    }

    log.success('\n✅ Database setup completed successfully!');
    log.info('\nYou can now start the application with:');
    console.log('  npm run dev\n');
  } catch (error) {
    log.error('\n❌ Database initialization failed');
    log.error(`Error: ${error.message}`);
    process.exit(1);
  } finally {
    if (client) await client.end();
    readline.close();
  }
};

// Run the initialization
main().catch(error => {
  log.error('Unhandled error during initialization:');
  console.error(error);
  process.exit(1);
});
