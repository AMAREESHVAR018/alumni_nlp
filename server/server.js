require("dotenv").config();
const app = require("./app");
const http = require("http");
const { initSocket } = require("./socket");
const seedDatabase = require("./scripts/seedFaker");
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
    
    // Run seed if not mock
    if (!status.isMock) {
      await seedDatabase();
    }
    
    // Success - start Express server
    _server = http.createServer(app);
    initSocket(_server);

    _server.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🔗 API Base: http://localhost:${PORT}/api`);
      console.log(`💚 Health Check: http://localhost:${PORT}/health`);
      console.log(`📊 Readiness Check: http://localhost:${PORT}/ready`);
      console.log("");
      console.log("Press Ctrl+C to stop the server");
    });
    
    return _server;
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
 * Closes HTTP server, then MongoDB connection before exiting
 */

let _server; // Holds the HTTP server reference after startup

const gracefulShutdown = (signal) => {
  console.log(`\n📍 ${signal} received, shutting down gracefully...`);

  // Force exit if shutdown takes too long
  const forceExit = setTimeout(() => {
    console.error("⚠️  Forced exit after timeout");
    process.exit(1);
  }, 30000);
  forceExit.unref();

  const finish = () => {
    require("mongoose").connection.close(false)
      .then(() => {
        console.log("✅ MongoDB connection closed");
        process.exit(0);
      })
      .catch((err) => {
        console.error("⚠️  Error closing MongoDB:", err.message);
        process.exit(1);
      });
  };

  if (_server) {
    _server.close(() => {
      console.log("✅ HTTP server closed");
      finish();
    });
  } else {
    finish();
  }
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

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