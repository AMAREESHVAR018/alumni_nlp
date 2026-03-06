/**
 * Authentication & Authorization Middleware
 * 
 * Provides:
 * - authenticate: Verify JWT token and extract user
 * - authorize: Check if user has required role(s)
 */

const jwt = require("jsonwebtoken");
const logger = require("../utils/logger");
const { APIError } = require("./errorHandler");
const { ERROR_CODES } = require("../constants");

/**
 * Authentication Middleware
 * Verifies JWT token from Authorization header
 * Extracts user data and attaches to req.user
 * 
 * @throws {APIError} If token is missing or invalid
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      error: {
        code: ERROR_CODES.UNAUTHORIZED,
        message: "No authentication token provided",
      },
    });
  }

  const token = authHeader.slice(7); // Strip "Bearer " prefix

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // User object now available in all downstream middleware
    next();
  } catch (error) {
    const errorCode = error.name === "TokenExpiredError" 
      ? ERROR_CODES.TOKEN_EXPIRED 
      : ERROR_CODES.INVALID_TOKEN;
    
    const message = error.name === "TokenExpiredError"
      ? "Token has expired"
      : "Invalid or malformed token";
    
    return res.status(401).json({
      success: false,
      error: {
        code: errorCode,
        message,
      },
    });
  }
};

/**
 * Authorization Middleware
 * Checks if authenticated user has one of the required roles
 * Must be used AFTER authenticate middleware
 * 
 * @param {Array<string>} allowedRoles - Array of allowed user roles
 * @returns {Function} Express middleware
 * 
 * @example
 * router.get('/admin', authenticate, authorize(['admin']), handler);
 * router.get('/protected', authenticate, authorize(['student', 'alumni']), handler);
 */
const authorize = (allowedRoles = []) => {
  return (req, res, next) => {
    // Check if user exists (authenticate should have set this)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: "User not authenticated",
        },
      });
    }

    // Check if user's role is in allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      logger.warn(
        `[AUTH] Unauthorized access attempt: User ${req.user.email} (${req.user.role}) tried to access admin resource`
      );
      
      return res.status(403).json({
        success: false,
        error: {
          code: ERROR_CODES.FORBIDDEN,
          message: "Insufficient permissions for this resource",
        },
      });
    }

    // User is authenticated and authorized
    next();
  };
};

module.exports = {
  authenticate,
  authorize,
};
