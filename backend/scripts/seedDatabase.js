#!/usr/bin/env node
const { execSync } = require('child_process');
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

const runCommand = (command) => {
  try {
    console.log(`Running: ${command}`);
    const output = execSync(command, { stdio: 'inherit' });
    return { success: true };
  } catch (error) {
    console.error(`Error executing command: ${command}`, error);
    return { success: false, error };
  }
};

const seedDatabase = async () => {
  console.log('🌱 Starting database seeding...');
  
  try {
    // Run gift seeding
    console.log('\n🎁 Seeding gift data...');
    const giftResult = runCommand('npm run seed:gifts');
    if (!giftResult.success) {
      throw new Error('Failed to seed gift data');
    }

    // Create admin user
    console.log('\n👤 Creating admin user...');
    const adminResult = runCommand('npm run create:admin');
    if (!adminResult.success) {
      throw new Error('Failed to create admin user');
    }

    console.log('\n✅ Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  } finally {
    readline.close();
  }
};

// Run the seed function
seedDatabase();
