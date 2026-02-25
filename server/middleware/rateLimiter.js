/**
 * Rate Limiting Middleware
 * Prevents brute-force attacks and API abuse
 * 
 * Implementation using in-memory store (suitable for single server)
 * For distributed systems, use Redis store:
 * const RedisStore = require('rate-limit-redis');
 * const redis = require('redis');
 * const client = redis.createClient();
 */

const RATE_LIMITS = {
  // General API rate limit: 100 requests per 15 minutes
  general: { windowMs: 15 * 60 * 1000, max: 100 },

  // Auth endpoints: 5 attempts per 15 minutes (prevent brute force)
  login: { windowMs: 15 * 60 * 1000, max: 5 },
  register: { windowMs: 60 * 60 * 1000, max: 3 }, // 3 per hour

  // Question endpoints: 20 per 10 minutes (prevent spam)
  questions: { windowMs: 10 * 60 * 1000, max: 20 },

  // Job endpoints: 10 per 10 minutes
  jobs: { windowMs: 10 * 60 * 1000, max: 10 },

  // NLP service: 50 per 5 minutes (prevent overload)
  nlp: { windowMs: 5 * 60 * 1000, max: 50 },
};

/**
 * Simple in-memory rate limiter
 * Tracks requests by IP address and endpoint
 * 
 * For production at scale, replace with Redis:
 * const store = new RedisStore({
 *   client: redisClient,
 *   prefix: 'rate-limit:',
 * });
 */
class InMemoryStore {
  constructor() {
    this.requests = new Map();
    // Cleanup old entries every 15 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 15 * 60 * 1000);
  }

  cleanup() {
    const now = Date.now();
    for (const [key, data] of this.requests.entries()) {
      if (now - data.resetTime > 15 * 60 * 1000) {
        this.requests.delete(key);
      }
    }
  }

  increment(key, windowMs) {
    const now = Date.now();
    let record = this.requests.get(key);

    if (!record || now > record.resetTime) {
      record = { count: 0, resetTime: now + windowMs };
      this.requests.set(key, record);
    }

    record.count++;
    return record;
  }

  reset() {
    this.requests.clear();
    clearInterval(this.cleanupInterval);
  }
}

const store = new InMemoryStore();

/**
 * Generic rate limiter middleware factory
 * 
 * @param {string} keyPrefix - Prefix for rate limit key (endpoint name)
 * @param {number} windowMs - Time window in milliseconds
 * @param {number} max - Maximum requests in time window
 * @param {string} message - Custom error message
 * @returns {Function} Express middleware
 */
const createRateLimiter = (keyPrefix, windowMs, max, message) => {
  return (req, res, next) => {
    // Use IP address as key (can be customized for user ID)
    const key = `${keyPrefix}:${req.ip || req.connection.remoteAddress}`;
    const record = store.increment(key, windowMs);

    // Set rate limit headers
    res.set("X-RateLimit-Limit", max);
    res.set("X-RateLimit-Remaining", Math.max(0, max - record.count));
    res.set("X-RateLimit-Reset", new Date(record.resetTime).toISOString());

    if (record.count > max) {
      console.warn(`[RATE-LIMIT] ${keyPrefix} limit exceeded for IP: ${req.ip}`);
      return res.status(429).json({
        success: false,
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: message || `Too many requests. Please try again after ${Math.ceil((record.resetTime - Date.now()) / 1000)} seconds.`,
        },
      });
    }

    next();
  };
};

/**
 * Specific rate limiters for different endpoints
 */
const rateLimiters = {
  // Auth endpoints - strict limit
  login: createRateLimiter(
    "auth:login",
    RATE_LIMITS.login.windowMs,
    RATE_LIMITS.login.max,
    "Too many login attempts. Please try again later."
  ),

  register: createRateLimiter(
    "auth:register",
    RATE_LIMITS.register.windowMs,
    RATE_LIMITS.register.max,
    "Too many registration attempts. Please try again later."
  ),

  // Question endpoints
  questions: createRateLimiter(
    "questions",
    RATE_LIMITS.questions.windowMs,
    RATE_LIMITS.questions.max,
    "Too many question requests. Please slow down."
  ),

  // Job endpoints
  jobs: createRateLimiter(
    "jobs",
    RATE_LIMITS.jobs.windowMs,
    RATE_LIMITS.jobs.max,
    "Too many job requests. Please slow down."
  ),

  // General API
  general: createRateLimiter(
    "api:general",
    RATE_LIMITS.general.windowMs,
    RATE_LIMITS.general.max
  ),
};

/**
 * Reset store (useful for testing)
 */
const resetStore = () => {
  store.reset();
};

module.exports = {
  rateLimiters,
  resetStore,
  RATE_LIMITS,
};
