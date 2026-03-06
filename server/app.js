const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

// Rate limiting middleware (custom in-memory implementation)
const { rateLimiters } = require("./middleware/rateLimiter");

// NoSQL injection sanitization
const { sanitizeInput } = require("./middleware/sanitize");

// Application routes
const authRoutes = require("./routes/authRoutes");
const alumniRoutes = require("./routes/alumniRoutes");
const questionRoutes = require("./routes/questionRoutes");
const jobRoutes = require("./routes/jobRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const chatRoutes = require("./routes/chatRoutes");
const featureRoutes = require("./routes/featureRoutes");
const mentorRoutes = require("./routes/mentorRoutes");
const resumeRoutes = require("./routes/resumeRoutes");

// Error handling middleware
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");

// Initialize Express app
const app = express();

/**
 * ============================================
 * SECURITY & LOGGING MIDDLEWARE
 * ============================================
 */

// Helmet - Sets HTTP security headers (prevents clickjacking, XSS, etc.)
// Recommended by OWASP for all Express apps
app.use(helmet());

// CORS - Allows cross-origin requests from frontend
// Environment-aware: Can be restricted in production
const corsOptions = {
  // In development, allow any origin (e.g. localhost:3001 if 3000 is occupied). Otherwise, rely on env.
  origin: process.env.NODE_ENV === "development" 
    ? true 
    : (process.env.CORS_ORIGIN || "http://localhost:3000"),
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Morgan - HTTP request logging
// Development: Logs all requests in 'dev' format (compact, colored)
// Production: Logs in 'combined' format (comprehensive)
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev")); // Compact format for easier reading in dev
} else {
  // Production: Logs to file or external service in real implementations
  // Future: Add winston logger or DataDog integration
  // Example: app.use(morgan(morganFormatFunction, { stream: fs.createWriteStream('access.log') }));
  app.use(morgan("combined")); // Comprehensive format for production
}

// JSON & URL encoded body parsers
// Limits request size to prevent large payload attacks via DoS
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// NoSQL injection sanitization — strip any '$'-prefixed keys from body/query
app.use(sanitizeInput);

/**
 * ============================================
 * HEALTH CHECK & STATUS ENDPOINTS
 * ============================================
 */

// Root health check endpoint - used by load balancers
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Alumni NLP Backend Running",
    timestamp: new Date().toISOString(),
    version: "2.0.0",
    environment: process.env.NODE_ENV || "development",
  });
});

// Health status endpoint - used by monitoring services
// Returns: Liveness probe (is the server running?)
app.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "healthy",
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  });
});

// Readiness check endpoint - used by orchestration platforms (Kubernetes, etc.)
// Returns: Readiness probe (is the server ready to handle requests?)
// Checks: Database connectivity, external services availability
// Future: Could check Redis, message queue, NLP service connectivity
app.get("/ready", async (req, res, next) => {
  try {
    // Check MongoDB connection
    if (require("mongoose").connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        status: "not_ready",
        reason: "Database not connected",
        timestamp: new Date().toISOString(),
      });
    }

    // All checks passed
    res.json({
      success: true,
      status: "ready",
      checks: {
        database: "connected",
        // Future: Add checks for Redis, NLP service, message queue
        // nlp_service: "connected",
        // redis: "connected",
        // message_queue: "connected",
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: "error",
      reason: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * ============================================
 * API ROUTES WITH RATE LIMITING
 * ============================================
 */

// Rate limit auth endpoints (strict)
app.use("/api/auth/login", rateLimiters.login);
app.use("/api/auth/register", rateLimiters.register);
app.use("/api/auth/refresh", rateLimiters.refresh);

// Rate limit question endpoints
app.use("/api/questions", rateLimiters.questions);

// Rate limit job endpoints
app.use("/api/jobs", rateLimiters.jobs);

// General API rate limiting (fallback)
app.use("/api", rateLimiters.general);

// Mount routes
app.use("/api/auth", authRoutes);
app.use("/api/alumni", alumniRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/features", featureRoutes);
app.use("/api/mentors", mentorRoutes);
app.use("/api/resume", resumeRoutes);

/**
 * ============================================
 * ERROR HANDLING MIDDLEWARE (ORDER MATTERS!)
 * ============================================
 * 
 * 1. notFoundHandler - catches 404s (must be after all routes)
 * 2. errorHandler - centralized error handler (must be last)
 * 
 * Architecture:
 * Request → Routes → notFoundHandler → errorHandler → Response
 */

// 404 Not Found handler - catches requests to non-existent routes
app.use(notFoundHandler);

// Centralized error handler - catches all errors thrown in middleware/routes
// Must be the LAST middleware
app.use(errorHandler);

/**
 * ============================================
 * EXPORT APP
 * ============================================
 */

module.exports = app;
