require("dotenv").config();
const app = require("./app");
const mongoose = require("mongoose");

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
  "MONGO_URI",
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

mongoose
  .connect(process.env.MONGO_URI, {
    // Connection options for stability
    maxPoolSize: 10,
    minPoolSize: 2,
    socketTimeoutMS: 45000,
    serverSelectionTimeoutMS: 5000,
  })
  .then(() => {
    console.log("✅ MongoDB Connected Successfully");
    
    // Create necessary indexes
    // In production, indexes should be created during deployment
    // Future: Use MongoDB Atlas auto-indexing or explicit index creation script
    
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🔗 API Base: http://localhost:${PORT}/api`);
      console.log(`💚 Health Check: http://localhost:${PORT}/health`);
      console.log(`📊 Readiness Check: http://localhost:${PORT}/ready`);
      console.log("");
      console.log("Press Ctrl+C to stop the server");
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB Connection Failed");
    console.error(err.message);
    console.error("\nMake sure MongoDB is running and MONGO_URI is correct");
    process.exit(1);
  });

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
  mongoose.connection.close(() => {
    console.log("✅ MongoDB connection closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("\n📍 SIGINT received, shutting down gracefully...");
  mongoose.connection.close(() => {
    console.log("✅ MongoDB connection closed");
    process.exit(0);
  });
});

/**
 * Future: Add monitoring and error tracking
 * - Winston logger for structured logging
 * - DataDog/Sentry for error tracking
 * - Prometheus metrics for system monitoring
 */
