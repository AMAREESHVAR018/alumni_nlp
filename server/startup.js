#!/usr/bin/env node

/**
 * ============================================
 * ALUMNI CHAT SYSTEM - AUTOMATED SETUP & STARTUP
 * ============================================
 * 
 * This script handles:
 * 1. MongoDB installation/detection
 * 2. Database startup
 * 3. Server startup
 * 4. Service health checks
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');
const { promisify } = require('util');

const pipeline = promisify(require('stream').pipeline);

const MONGO_PORT = 27017;
const MONGO_DATA_PATH = path.join(process.env.APPDATA || process.env.HOME, '.mongodb-data');
const MONGO_DOWNLOAD_URL = 'https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-7.0.5-signed.msi';
const MONGODB_VERSION = '7.0.5';

console.log(`\n${'='.repeat(60)}`);
console.log('📚 ALUMNI CHAT SYSTEM - AUTOMATED STARTUP');
console.log(`${'='.repeat(60)}\n`);

// Check if MongoDB is installed
function checkMongoInstalled() {
  try {
    execSync('mongod --version', { stdio: 'pipe' });
    return true;
  } catch (e) {
    return false;
  }
}

// Check if MongoDB is running
async function checkMongoRunning() {
  try {
    const { MongoClient } = require('mongodb');
    const client = new MongoClient('mongodb://localhost:27017', {
      serverSelectionTimeoutMS: 2000,
      socketTimeoutMS: 2000,
    });
    await client.connect();
    await client.close();
    return true;
  } catch (e) {
    return false;
  }
}

// Start MongoDB service if installed
async function startMongoDB() {
  if (checkMongoInstalled()) {
    console.log('✅ MongoDB found on system');
    
    // Try to start as Windows service
    try {
      console.log('🚀 Starting MongoDB service...');
      execSync('net start MongoDB', { stdio: 'pipe' });
      console.log('✅ MongoDB service started');
      return true;
    } catch (e) {
      // Service might already be running or not installed as service
      // Try running mongod directly
      console.log('⏳ MongoDB not running as service, attempting to start as process...');
      
      // Ensure data directory exists
      if (!fs.existsSync(MONGO_DATA_PATH)) {
        fs.mkdirSync(MONGO_DATA_PATH, { recursive: true });
      }
      
      // Start mongod in background
      const mongod = spawn('mongod', [
        `--dbpath=${MONGO_DATA_PATH}`,
        `--port=${MONGO_PORT}`,
      ], {
        detached: true,
        stdio: 'ignore',
      });
      
      mongod.unref();
      
      // Wait for MongoDB to start
      console.log('⏳ Waiting for MongoDB to initialize...');
      for (let i = 0; i < 30; i++) {
        if (await checkMongoRunning()) {
          console.log('✅ MongoDB started successfully');
          return true;
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      console.log('❌ MongoDB failed to start');
      return false;
    }
  }
  
  return false;
}

// Download MongoDB installer
async function downloadMongoDB() {
  console.log('📥 Downloading MongoDB Community Server...');
  console.log(`   Version: ${MONGODB_VERSION}`);
  console.log(`   Size: ~80MB (this may take a few minutes)`);
  
  const installerPath = path.join(process.env.TEMP || '/tmp', 'mongodb-installer.msi');
  
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(installerPath);
    
    https.get(MONGO_DOWNLOAD_URL, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }
      
      let downloadedBytes = 0;
      response.on('data', (chunk) => {
        downloadedBytes += chunk.length;
        process.stdout.write(`\r   Downloaded: ${(downloadedBytes / 1024 / 1024).toFixed(1)}MB`);
      });
      
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log('\n✅ MongoDB installer downloaded');
        resolve(installerPath);
      });
    }).on('error', reject);
  });
}

// Main startup logic
async function main() {
  try {
    // Check if MongoDB is installed
    if (!checkMongoInstalled()) {
      console.log('❌ MongoDB not found on system');
      console.log('\n📥 Would download and install MongoDB, but this requires admin privileges');
      console.log('\n🔧 Please install MongoDB manually:');
      console.log('   1. Download: https://www.mongodb.com/try/download/community');
      console.log('   2. Run the installer (choose "Install as Service")');
      console.log('   3. Run this script again\n');
      process.exit(1);
    }
    
    // Check if MongoDB is running
    if (!(await checkMongoRunning())) {
      console.log('⏳ Starting MongoDB...');
      
      if (!(await startMongoDB())) {
        console.log('\n❌ Could not start MongoDB');
        console.log('\n💡 Try these steps:');
        console.log('   1. Download MongoDB: https://www.mongodb.com/try/download/community');
        console.log('   2. Install it (with "Install as Service" option)');
        console.log('   3. Restart your system OR manually start: net start MongoDB\n');
        process.exit(1);
      }
    } else {
      console.log('✅ MongoDB is already running');
    }
    
    // Wait a moment for MongoDB to be fully ready
    console.log('⏳ Waiting for MongoDB to be fully ready...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Start the Node.js server
    console.log('\n✅ All systems ready!');
    console.log('🚀 Starting Alumni Chat Server...\n');
    
    const server = spawn('npm', ['start'], {
      cwd: __dirname,
      stdio: 'inherit',
    });
    
    server.on('exit', (code) => {
      console.log(`\n⛔ Server stopped with code ${code}`);
      process.exit(code);
    });
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { startMongoDB, checkMongoInstalled, checkMongoRunning };
