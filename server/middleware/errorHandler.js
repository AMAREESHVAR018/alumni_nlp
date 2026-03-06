const logger = require('../utils/logger');

/**
 * Custom API Error class
 */
class APIError extends Error {
  constructor(message, status = 500, code = "INTERNAL_ERROR") {
    super(message);
    this.status = status;
    this.code = code;
    this.name = "APIError";
  }
}

/**
 * Error handling middleware
 * Catches all errors and formats response
 */
const errorHandler = (err, req, res, next) => {
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.path,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id || req.user?._id
  });

  let status = err.status || 500;
  let message = err.message || "Internal Server Error";
  let code = err.code || "INTERNAL_ERROR";

  // Handle specific error types
  if (err.name === "ValidationError") {
    status = 400;
    code = "VALIDATION_ERROR";
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
  }

  if (err.name === "CastError") {
    status = 400;
    code = "INVALID_ID";
    message = "Invalid ID format";
  }

  if (err.name === "MongoServerError" && err.code === 11000) {
    status = 409;
    code = "DUPLICATE_ENTRY";
    const field = Object.keys(err.keyPattern)[0];
    message = `${field} already exists`;
  }

  if (err.name === "JsonWebTokenError") {
    status = 401;
    code = "INVALID_TOKEN";
    message = "Invalid token";
  }

  if (err.name === "TokenExpiredError") {
    status = 401;
    code = "TOKEN_EXPIRED";
    message = "Token has expired";
  }

  res.status(status).json({
    success: false,
    error: {
      code,
      message,
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    },
  });
};

/**
 * 404 handler
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  APIError,
  errorHandler,
  notFoundHandler,
  asyncHandler,
};
