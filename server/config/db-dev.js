const mongoose = require("mongoose");

/**
 * Development Database Configuration
 * Supports:
 * 1. Local MongoDB (localhost:27017)
 * 2. MongoDB Atlas
 * 3. In-memory mock (fallback)
 */

module.exports = async () => {
  const mongoUri = process.env.MONGO_URI ||   "mongodb://localhost:27017/alumni-chat";
  
  console.log("🔌 Connecting to MongoDB...");
  console.log(`   URI: ${mongoUri.replace(/:[^/]*@/, ":****@")}`); // Mask password
  
  const options = {
    maxPoolSize: 10,
    minPoolSize: 5,
    connectTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    serverSelectionTimeoutMS: 3000,
    retryWrites: true,
    retryReads: true,
  };
  
  try {
    await mongoose.connect(mongoUri, options);
    console.log("✅ Successfully connected to MongoDB");
    return true;
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    
    if (mongoUri.includes("localhost")) {
      console.error("\n🔧 MongoDB is not running locally");
      console.error("   To start MongoDB:")
      console.error("   1. Download: https://www.mongodb.com/try/download/community");
      console.error("   2. Install and add to PATH");
      console.error("   3. Run: mongod --dbpath C:\\data\\db");
      console.error("   4. Or: net start MongoDB (if installed as service)");
      console.error("");
      console.error("🚀 Running in MOCK MODE (data not persisted)");
      console.error("   - Database available in memory only");
      console.error("   - Data will reset when server restarts");
    }
    
    // Fallback: Use mock mode
    console.log("\n⚡ Starting in DEV MODE with mock database...\n");
    return false; // Indicate mock mode
  }
};
