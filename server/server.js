require("dotenv").config();
const app = require("./app");
const { connectToDatabase, isInMockMode, getConnectionStatus } = require("./config/database");

/**
 * ============================================
 * ENVIRONMENT VALIDATION
 * ============================================
 * 
 * Validates required environment variables at server startup
 * Fails fast if critical configuration is missing
 */

const requiredEnvVars = [
  "PORT",
  "JWT_SECRET",
  "NLP_SERVICE_URL",
  "NODE_ENV",
];

const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error("❌ FATAL: Missing required environment variables:");
  missingEnvVars.forEach((envVar) => console.error(`   - ${envVar}`));
  console.error("\nCreate a .env file with all required variables (see .env.example)");
  process.exit(1);
}

// Validate critical values
if (process.env.JWT_SECRET.length < 32 && process.env.NODE_ENV === "production") {
  console.warn("⚠️  WARNING: JWT_SECRET is too short for production (should be 32+ chars)");
}

if (!["development", "staging", "production"].includes(process.env.NODE_ENV)) {
  console.warn(`⚠️  WARNING: NODE_ENV="${process.env.NODE_ENV}" is not standard`);
}

console.log("✅ All required environment variables present");
console.log(`📋 Running in: ${process.env.NODE_ENV} environment`);

/**
 * ============================================
 * DATABASE CONNECTION & SERVER STARTUP
 * ============================================
 */

const PORT = process.env.PORT || 5000;

// Smart connection with fallback
const startServer = async () => {
  try {
    // Try multiple connection strategies
    await connectToDatabase();
    
    const status = getConnectionStatus();
    const modeStr = isInMockMode() ? '(MOCK MODE)' : '(REAL DB)';
    
    console.log(`📊 Connection Status ${modeStr}:`, {
      connected: status.isConnected,
      mockMode: status.isMock,
    });
    
    // Success - start Express server
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🔗 API Base: http://localhost:${PORT}/api`);
      console.log(`💚 Health Check: http://localhost:${PORT}/health`);
      console.log(`📊 Readiness Check: http://localhost:${PORT}/ready`);
      console.log("");
      console.log("Press Ctrl+C to stop the server");
    });
    
    return;
  } catch (error) {
    console.error("\n❌ Failed to start server");
    console.error(`   Error: ${error.message}`);
    console.error("🔍 Troubleshooting Steps:");
    console.error("   1. Verify MongoDB is installed and running");
    console.error("   2. Check IP is whitelisted (0.0.0.0/0)");
    console.error("   3. Verify credentials");
    console.error("   4. Try: https://www.mongodb.com/try/download/community");
    console.error("   5. Force DNS flush: ipconfig /flushdns");
    console.error("");
    process.exit(1);
  }
};

/**
 * ============================================
 * GRACEFUL SHUTDOWN
 * ============================================
 * 
 * Handles shutdown signals (SIGTERM, SIGINT)
 * Close database connections and clean up resources
 */

process.on("SIGTERM", () => {
  console.log("\n📍 SIGTERM received, shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("\n📍 SIGINT received, shutting down gracefully...");
  process.exit(0);
});

/**
 * ============================================
 * START SERVER
 * ============================================
 */

console.log("\n🚀 Starting Alumni Chat System Server...\n");
startServer().catch((error) => {
  console.error("Fatal Error:", error);
  process.exit(1);
});