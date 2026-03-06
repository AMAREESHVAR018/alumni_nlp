/**
 * NoSQL Injection Sanitization Middleware
 *
 * Recursively removes keys starting with '$' from request body and query
 * parameters to prevent MongoDB operator injection attacks.
 *
 * Example attack prevented:
 *   POST /api/auth/login
 *   Body: { "email": { "$gt": "" }, "password": { "$gt": "" } }
 *   → attacker bypasses credential check via MongoDB query operator injection
 */

const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return;
  for (const key of Object.keys(obj)) {
    if (key.startsWith("$")) {
      delete obj[key];
    } else if (obj[key] !== null && typeof obj[key] === "object") {
      sanitizeObject(obj[key]);
    }
  }
};

const sanitizeInput = (req, res, next) => {
  if (req.body)  sanitizeObject(req.body);
  if (req.query) sanitizeObject(req.query);
  next();
};

module.exports = { sanitizeInput };
