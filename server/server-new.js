#!/usr/bin/env node

/**
 * ============================================
 * ALUMNI CHAT SYSTEM - BACKEND SERVER  
 * ============================================
 * 
 * Main entry point for Express API server
 * Handles database initialization and graceful shutdown
 */

require("dotenv").config();
const app = require("./app");
const { connectToDatabase, isInMockMode, getConnectionStatus } = require("./config/database");

console.log("\n" + "=".repeat(60));
console.log("🚀 ALUMNI CHAT SYSTEM - BACKEND SERVER");
console.log("=".repeat(60) + "\n");

/**
 * ============================================
 * ENVIRONMENT VALIDATION
 * ============================================
 */

const requiredEnvVars = ["PORT", "JWT_SECRET", "NLP_SERVICE_URL", "NODE_ENV"];

const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error("❌ FATAL: Missing required environment variables:");
  missingEnvVars.forEach((envVar) => console.error(`   - ${envVar}`));
  console.error("\nCreate a .env file with all required variables");
  process.exit(1);
}

if (process.env.JWT_SECRET.length < 32 && process.env.NODE_ENV === "production") {
  console.warn("⚠️  WARNING: JWT_SECRET is too short for production");
}

console.log("✅ All required environment variables present");
console.log(`📋 Running in: ${process.env.NODE_ENV} environment`);

/**
 * ============================================
 * DATABASE CONNECTION & SERVER STARTUP
 * ============================================
 */

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Initialize database with fallback strategies
    console.log("\n📚 Initializing database connection...");
    await connectToDatabase();

    const status = getConnectionStatus();
    const modeStr = isInMockMode() ? "MOCK MODE" : "REAL DB";
    console.log(`✅ Database ready (${modeStr})\n`);

    // Start Express server
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🔗 API Base: http://localhost:${PORT}/api`);
      console.log(`💚 Health Check: http://localhost:${PORT}/health`);
      console.log(`📊 Readiness Check: http://localhost:${PORT}/ready`);
      console.log("");
      console.log("Press Ctrl+C to stop the server\n");
    });

  } catch (error) {
    console.error("\n❌ Failed to start server");
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

/**
 * ============================================
 * GRACEFUL SHUTDOWN
 * ============================================
 */

process.on("SIGTERM", () => {
  console.log("\n📍 SIGTERM received, shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("\n📍 Shutting down...");
  process.exit(0);
});

/**
 * ============================================
 * START SERVER
 * ============================================
 */

startServer().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
