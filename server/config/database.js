/**
 * Smart MongoDB Connection Manager
 * Tries multiple connection strategies and falls back to mock database if needed
 * 
 * Priority:
 * 1. Local MongoDB (localhost:27017)
 * 2. MongoDB Atlas (cloud)
 * 3. Mock Database (in-memory, for development)
 */

const mongoose = require('mongoose');
const { createMockMongoose } = require('../services/mongoMockService');
const logger = require('../utils/logger');

// Connection states
let mongooseInstance = mongoose;
let isMockMode = false;

/**
 * Try a single MongoDB connection with Exponential Backoff
 */
async function attemptConnection(uri, options, retries = 5) {
  for (let i = 0; i < retries; i++) {
    try {
      await mongoose.connect(uri, options);
      logger.info('MongoDB connected successfully');
      return true;
    } catch (error) {
      logger.error(`MongoDB connection attempt ${i + 1} failed: ${error.message}`);
      if (i === retries - 1) {
        throw error;
      }
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, 2000 * Math.pow(2, i)));
    }
  }
  return false;
}

/**
 * Try to connect to local MongoDB
 */
async function tryLocalMongoDB() {
  console.log('🔍 Attempting local MongoDB connection...');
  const localUri = 'mongodb://localhost:27017/alumni-chat';
  
  const options = {
    serverSelectionTimeoutMS: 3000,
    socketTimeoutMS: 5000,
    connectTimeoutMS: 5000,
  };
  
  try {
    await attemptConnection(localUri, options, 2);
    console.log('✅ Connected to Local MongoDB');
    console.log(`   URI: ${localUri}`);
    return true;
  } catch (error) {
    console.log('❌ Local MongoDB not available');
    console.log(`   Error: ${error.message.split('\n')[0]}`);
    return false;
  }
}

/**
 * Try to connect to MongoDB Atlas
 */
async function tryMongoDBAtlas() {
  // Support both MONGO_URI and MONGO_ATLAS_URI for flexibility
  const atlasUri = process.env.MONGO_URI || process.env.MONGO_ATLAS_URI;
  
  if (!atlasUri) {
    console.log('⏭️  MongoDB Atlas URI not configured');
    return false;
  }
  
  console.log('🔍 Attempting MongoDB Atlas connection...');
  
  const options = {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 10000,
    connectTimeoutMS: 10000,
    retryWrites: true,
    retryReads: true,
  };
  
  try {
    await attemptConnection(atlasUri, options, 2);
    console.log('✅ Connected to MongoDB Atlas');
    console.log(`   Cluster: cluster0`);
    return true;
  } catch (error) {
    console.log('❌ MongoDB Atlas not available');
    console.log(`   Error: ${error.message.split('\n')[0]}`);
    return false;
  }
}

/**
 * Enable mock database mode
 */
function enableMockMode() {
  console.log('\n' + '='.repeat(60));
  console.log('📚 DEVELOPMENT MODE: Using In-Memory Mock Database');
  console.log('='.repeat(60));
  console.log('\n⚠️  DATA IS NOT PERSISTED - Only for development!\n');
  console.log('To use persistent MongoDB:');
  console.log('  1. Install MongoDB Community: https://www.mongodb.com/try/download/community');
  console.log('  2. Start the service: net start MongoDB');
  console.log('  3. Restart the server\n');
  
  mongooseInstance = createMockMongoose();
  isMockMode = true;
}

/**
 * Main connection function
 * Attempts multiple strategies and falls back to mock
 */
async function connectToDatabase() {
  console.log('\n' + '='.repeat(60));
  console.log('🔌 DATABASE CONNECTION MANAGER');
  console.log('='.repeat(60) + '\n');
  
  // Attempt connec tion strategies in order
  const strategies = [
    { name: 'Local MongoDB', fn: tryLocalMongoDB },
    { name: 'MongoDB Atlas', fn: tryMongoDBAtlas },
  ];
  
  for (const strategy of strategies) {
    try {
      if (await strategy.fn()) {
        console.log('\n✅ DATABASE CONNECTION SUCCESSFUL\n');
        return mongooseInstance;
      }
    } catch (error) {
      console.error(`   Error: ${error.message}`);
    }
  }
  
  // All strategies failed, use mock
  console.log('\n⚠️  All real MongoDB connections failed');
  console.log('   Falling back to in-memory mock database...\n');
  
  enableMockMode();
  console.log('✅ DATABASE CONNECTION SUCCESSFUL (MOCK MODE)\n');
  
  return mongooseInstance;
}

/**
 * Get current mongoose instance
 */
function getMongoose() {
  return mongooseInstance;
}

/**
 * Check if running in mock mode
 */
function isInMockMode() {
  return isMockMode;
}

/**
 * Get connection status
 */
function getConnectionStatus() {
  return {
    isMock: isMockMode,
    isConnected: !isMockMode && (mongoose.connection.readyState === 1),
    readyState: mongoose.connection.readyState,
    uri: mongoose.connection.client?.options?.autoEncrypterOptions?.keyVaultNamespace || 'N/A',
  };
}

module.exports = {
  connectToDatabase,
  getMongoose,
  isInMockMode,
  getConnectionStatus,
  mongoose: mongoose, // Export original mongoose too
};
