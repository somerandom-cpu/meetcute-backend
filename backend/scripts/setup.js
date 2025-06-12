#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

// Helper function to log messages
const log = {
  info: (msg) => console.log(`${colors.cyan}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}[WARN]${colors.reset} ${msg}`),
  error: (msg) => console.error(`${colors.red}[ERROR]${colors.reset} ${msg}`)
};

// Check if a command exists
const commandExists = (command) => {
  try {
    execSync(`command -v ${command}`, { stdio: 'ignore' });
    return true;
  } catch (e) {
    return false;
  }
};

// Run a command and return the output
const runCommand = (command, options = {}) => {
  try {
    const output = execSync(command, { stdio: 'pipe', ...options });
    return { success: true, output: output.toString().trim() };
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      stderr: error.stderr?.toString().trim() || ''
    };
  }
};

// Ask a question and return the answer
const askQuestion = (question) => {
  return new Promise((resolve) => {
    readline.question(question, (answer) => {
      resolve(answer);
    });
  });
};

// Main function
const main = async () => {
  log.info('🚀 Setting up MeetCute Backend');
  console.log('='.repeat(60));

  // Check for required tools
  log.info('🔍 Checking for required tools...');
  const requiredTools = ['node', 'npm', 'psql'];
  const missingTools = [];

  requiredTools.forEach(tool => {
    if (commandExists(tool)) {
      const version = runCommand(`${tool} --version`);
      log.success(`${tool}: ${version.output.split('\n')[0]}`);
    } else {
      missingTools.push(tool);
      log.warn(`${tool}: Not found`);
    }
  });

  if (missingTools.length > 0) {
    log.error(`Missing required tools: ${missingTools.join(', ')}`);
    process.exit(1);
  }

  // Check for .env file
  log.info('\n🔍 Checking for environment configuration...');
  const envPath = path.join(__dirname, '..', '.env');
  
  if (fs.existsSync(envPath)) {
    log.success('.env file exists');
    const overwrite = await askQuestion('  ⚠️  .env already exists. Overwrite? (y/N): ');
    
    if (overwrite.toLowerCase() !== 'y') {
      log.warn('Skipping .env configuration');
    } else {
      await configureEnv(envPath);
    }
  } else {
    await configureEnv(envPath);
  }

  // Install dependencies
  log.info('\n📦 Installing dependencies...');
  const installResult = runCommand('npm install');
  
  if (!installResult.success) {
    log.error('Failed to install dependencies');
    log.error(installResult.stderr || installResult.error);
    process.exit(1);
  }
  log.success('Dependencies installed successfully');

  // Run database migrations
  log.info('\n🔄 Running database migrations...');
  const migrateResult = runCommand('npx sequelize-cli db:migrate');
  
  if (!migrateResult.success) {
    log.error('Failed to run migrations');
    log.error(migrateResult.stderr || migrateResult.error);
    process.exit(1);
  }
  log.success('Database migrations completed');

  // Create default admin user
  log.info('\n👤 Creating default admin user...');
  const createAdminResult = runCommand('node scripts/createAdmin.js');
  
  if (!createAdminResult.success) {
    log.warn('Failed to create default admin user');
    log.warn(createAdminResult.stderr || createAdminResult.error);
  } else {
    log.success('Default admin user created');
  }

  console.log('\n' + '='.repeat(60));
  log.success('✅ Setup completed successfully!');
  log.info('\nTo start the development server, run:');
  console.log('  npm run dev\n');
  
  readline.close();
};

// Configure environment variables
const configureEnv = async (envPath) => {
  log.info('\n🛠️  Configuring environment variables...');
  
  const envVars = [
    { name: 'NODE_ENV', default: 'development', required: true },
    { name: 'PORT', default: '5000', required: true },
    { name: 'JWT_SECRET', default: require('crypto').randomBytes(32).toString('hex'), required: true },
    { name: 'FRONTEND_URL', default: 'http://localhost:5173', required: true },
    { name: 'DB_HOST', default: 'localhost', required: true },
    { name: 'DB_PORT', default: '5432', required: true },
    { name: 'DB_NAME', default: 'meetcute', required: true },
    { name: 'DB_USER', default: 'postgres', required: true },
    { name: 'DB_PASSWORD', default: 'postgres', required: true },
    { name: 'EMAIL_HOST', default: '', required: false },
    { name: 'EMAIL_PORT', default: '587', required: false },
    { name: 'EMAIL_USER', default: '', required: false },
    { name: 'EMAIL_PASSWORD', default: '', required: false },
    { name: 'EMAIL_FROM', default: 'noreply@meetcute.app', required: false },
  ];

  let envContent = `# Environment Configuration\n# Generated on ${new Date().toISOString()}\n\n`;

  for (const { name, default: defaultValue, required } of envVars) {
    const currentValue = process.env[name] || '';
    const value = await askQuestion(
      `  ${name}${required ? ' *' : ''} [${defaultValue}]: `
    ) || currentValue || defaultValue;
    
    envContent += `${name}=${value}\n`;
  }

  fs.writeFileSync(envPath, envContent);
  log.success(`Environment configuration saved to ${envPath}`);
};

// Run the setup
main().catch(error => {
  log.error('Setup failed:');
  console.error(error);
  process.exit(1);
});
