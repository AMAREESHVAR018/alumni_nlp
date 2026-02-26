const mongoose = require("mongoose");

// Try to use localhost MongoDB first
module.exports = async () => {
  const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/alumni-chat";
  
  if (!mongoUri) {
    throw new Error("MONGO_URI environment variable is not set");
  }

  console.log("🔌 Attempting to connect to MongoDB...");
  
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
    console.log("✅ Connected to MongoDB Successfully");
    console.log(`   Connection: ${mongoUri}`);
    return true;
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    
    // If it's a local MongoDB connection error, provide helpful guidance
    if (mongoUri.includes("localhost")) {
      console.error("\n⚠️  Cannot connect to local MongoDB");
      console.error("   Make sure MongoDB is running on localhost:27017");
      console.error("\n   To start MongoDB, run:");
      console.error("   1. Install MongoDB Community: https://www.mongodb.com/try/download/community");
      console.error("   2. Start service: net start MongoDB");
      console.error("   3. Or run: mongod --dbpath C:\\data\\db");
    }
    
    throw error;
  }
};