#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
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

const log = {
  info: (msg) => console.log(`${colors.cyan}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}[WARN]${colors.reset} ${msg}`),
  error: (msg) => console.error(`${colors.red}[ERROR]${colors.reset} ${msg}`)
};

const ENV_FILE = path.join(__dirname, '../../.env');
const ENV_EXAMPLE_FILE = path.join(__dirname, '../../.env.example');

const askQuestion = (question, defaultValue = '') => {
  return new Promise((resolve) => {
    const prompt = defaultValue 
      ? `${question} [${defaultValue}]: `
      : `${question}: `;
    
    readline.question(prompt, (answer) => {
      resolve(answer.trim() || defaultValue);
    });
  });
};

const parseEnvFile = (content) => {
  const env = {};
  const lines = content.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    
    const [key, ...valueParts] = trimmed.split('=');
    const value = valueParts.join('=').trim();
    
    if (key) {
      env[key] = value;
    }
  }
  
  return env;
};

const stringifyEnv = (env) => {
  return Object.entries(env)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n') + '\n';
};

const loadEnv = () => {
  if (!fs.existsSync(ENV_FILE)) {
    log.warn('.env file does not exist. Creating a new one...');
    return {};
  }
  
  try {
    const content = fs.readFileSync(ENV_FILE, 'utf8');
    return parseEnvFile(content);
  } catch (error) {
    log.error(`Failed to read ${ENV_FILE}: ${error.message}`);
    return {};
  }
};

const saveEnv = (env) => {
  try {
    const content = stringifyEnv(env);
    fs.writeFileSync(ENV_FILE, content);
    log.success(`Environment variables saved to ${ENV_FILE}`);
    return true;
  } catch (error) {
    log.error(`Failed to save ${ENV_FILE}: ${error.message}`);
    return false;
  }
};

const showMenu = async (env) => {
  console.log('\n' + '='.repeat(60));
  console.log(' Environment Variables Manager'.padEnd(60));
  console.log('='.repeat(60));
  
  const options = [
    { key: '1', name: 'List all variables', action: listVariables },
    { key: '2', name: 'Add/Update variable', action: updateVariable },
    { key: '3', name: 'Remove variable', action: removeVariable },
    { key: '4', name: 'Import from .env.example', action: importFromExample },
    { key: '5', name: 'Validate configuration', action: validateConfig },
    { key: '6', name: 'Show sensitive values', action: showSensitiveValues },
    { key: 's', name: 'Save and exit', action: null },
    { key: 'q', name: 'Exit without saving', action: null }
  ];
  
  for (const option of options) {
    console.log(`  ${option.key}. ${option.name}`);
  }
  
  const choice = await askQuestion('\nEnter your choice');
  
  if (choice === 's') {
    return { save: true, exit: true };
  }
  
  if (choice === 'q') {
    return { save: false, exit: true };
  }
  
  const selected = options.find(opt => opt.key === choice);
  if (selected && selected.action) {
    await selected.action(env);
  } else {
    log.warn('Invalid choice. Please try again.');
  }
  
  return { save: false, exit: false };
};

const listVariables = (env) => {
  console.log('\nCurrent environment variables:');
  console.log('-' + '-'.repeat(58));
  
  if (Object.keys(env).length === 0) {
    console.log('  No environment variables set.');
    return;
  }
  
  const sensitive = ['PASSWORD', 'SECRET', 'KEY', 'TOKEN'];
  
  for (const [key, value] of Object.entries(env)) {
    const isSensitive = sensitive.some(s => key.toUpperCase().includes(s));
    const displayValue = isSensitive ? '********' : value;
    console.log(`  ${key}=${displayValue}`);
  }
};

const updateVariable = async (env) => {
  const key = await askQuestion('Enter variable name');
  if (!key) {
    log.warn('Variable name cannot be empty');
    return;
  }
  
  const currentValue = env[key] || '';
  const value = await askQuestion(`Enter value for ${key}`, currentValue);
  
  if (value === '') {
    log.warn('Value cannot be empty');
    return;
  }
  
  env[key] = value;
  log.success(`Updated ${key}`);
};

const removeVariable = async (env) => {
  const key = await askQuestion('Enter variable name to remove');
  if (!key) {
    log.warn('Variable name cannot be empty');
    return;
  }
  
  if (env.hasOwnProperty(key)) {
    delete env[key];
    log.success(`Removed ${key}`);
  } else {
    log.warn(`Variable ${key} not found`);
  }
};

const importFromExample = async (env) => {
  if (!fs.existsSync(ENV_EXAMPLE_FILE)) {
    log.error(`${ENV_EXAMPLE_FILE} not found`);
    return;
  }
  
  try {
    const content = fs.readFileSync(ENV_EXAMPLE_FILE, 'utf8');
    const exampleVars = parseEnvFile(content);
    
    let imported = 0;
    for (const [key, value] of Object.entries(exampleVars)) {
      if (!env.hasOwnProperty(key)) {
        env[key] = value;
        imported++;
      }
    }
    
    if (imported > 0) {
      log.success(`Imported ${imported} variables from ${ENV_EXAMPLE_FILE}`);
    } else {
      log.info('No new variables to import');
    }
  } catch (error) {
    log.error(`Failed to import from ${ENV_EXAMPLE_FILE}: ${error.message}`);
  }
};

const validateConfig = (env) => {
  log.info('Validating configuration...');
  const required = [
    'NODE_ENV',
    'PORT',
    'JWT_SECRET',
    'FRONTEND_URL',
    'DB_HOST',
    'DB_PORT',
    'DB_NAME',
    'DB_USER',
    'DB_PASSWORD'
  ];
  
  let isValid = true;
  const missing = [];
  
  for (const key of required) {
    if (!env[key]) {
      missing.push(key);
      isValid = false;
    }
  }
  
  if (isValid) {
    log.success('Configuration is valid!');
  } else {
    log.error('Missing required configuration:');
    missing.forEach(key => console.log(`  - ${key}`));
    log.warn('\nPlease set these variables before starting the application');
  }
  
  return isValid;
};

const showSensitiveValues = (env) => {
  console.log('\nCurrent environment variables (including sensitive values):');
  console.log('-' + '-'.repeat(78));
  
  if (Object.keys(env).length === 0) {
    console.log('  No environment variables set.');
    return;
  }
  
  for (const [key, value] of Object.entries(env)) {
    console.log(`  ${key}=${value}`);
  }
};

const main = async () => {
  console.clear();
  log.info('MeetCute Environment Variables Manager');
  
  let env = loadEnv();
  let shouldExit = false;
  
  while (!shouldExit) {
    const result = await showMenu(env);
    if (result.exit) {
      if (result.save) {
        saveEnv(env);
      }
      shouldExit = true;
    }
  }
  
  readline.close();
  log.info('Goodbye!');
};

// Run the environment manager
main().catch(error => {
  log.error('An error occurred:');
  console.error(error);
  process.exit(1);
});
