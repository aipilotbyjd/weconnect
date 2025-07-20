#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting WeConnect Development Environment...\n');

// Check if .env exists, if not copy from .env.local
const envPath = path.join(__dirname, '..', '.env');
const envLocalPath = path.join(__dirname, '..', '.env.local');

if (!fs.existsSync(envPath) && fs.existsSync(envLocalPath)) {
  console.log('📋 Creating .env from .env.local template...');
  fs.copyFileSync(envLocalPath, envPath);
  console.log('✅ .env file created. Please update it with your configuration.\n');
}

// Start services first
console.log('🐳 Starting external services (MongoDB, Redis)...');
const servicesProcess = spawn('docker-compose', ['up', '-d'], {
  stdio: 'inherit',
  shell: true
});

servicesProcess.on('close', (code) => {
  if (code === 0) {
    console.log('\n✅ Services started successfully!');
    console.log('\n📋 Available services:');
    console.log('  • MongoDB: localhost:27017');
    console.log('  • Redis: localhost:6379');
    console.log('  • MongoDB GUI: http://localhost:8080 (admin/admin)');
    console.log('  • Redis GUI: http://localhost:8081');
    console.log('\n🚀 Starting NestJS application...\n');
    
    // Start the NestJS app
    const appProcess = spawn('npm', ['run', 'start:dev'], {
      stdio: 'inherit',
      shell: true
    });
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down...');
      appProcess.kill('SIGINT');
      
      // Stop services
      const stopServices = spawn('docker-compose', ['down'], {
        stdio: 'inherit',
        shell: true
      });
      
      stopServices.on('close', () => {
        console.log('✅ Services stopped.');
        process.exit(0);
      });
    });
    
  } else {
    console.error('❌ Failed to start services');
    process.exit(1);
  }
});