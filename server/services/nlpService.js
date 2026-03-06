const axios = require("axios");
const logger = require("../utils/logger");
const { NLP_CONFIG, ERROR_CODES } = require("../constants");
const { calculateTfIdfSimilarity } = require("./tfidfService");

const NLP_SERVICE_URL = process.env.NLP_SERVICE_URL || "http://localhost:5001";
const NLP_TIMEOUT = 10000; // 10 seconds
const MAX_RETRIES = 2;

/**
 * Custom Error class for NLP service errors
 */
class AppError extends Error {
  constructor(message, status = 500, code = ERROR_CODES.NLP_ERROR) {
    super(message);
    this.status = status;
    this.code = code;
    this.name = "AppError";
  }
}

/**
 * Helper function to make HTTP requests with retry logic
 * @param {Function} requestFn - Function that makes the request
 * @param {string} operationName - Name of operation for logging
 * @param {number} maxRetries - Number of retry attempts
 * @returns {Promise<any>} Response data
 * @throws {AppError} If all retries fail
 */
const executeWithRetry = async (requestFn, operationName, maxRetries = MAX_RETRIES) => {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.info(`[NLP] ${operationName} - Attempt ${attempt}/${maxRetries}`);
      const response = await requestFn();
      logger.info(`[NLP] ${operationName} - Success on attempt ${attempt}`);
      return response;
    } catch (error) {
      lastError = error;
      logger.warn(
        `[NLP] ${operationName} - Attempt ${attempt} failed: ${error.message}`
      );

      // Don't retry on validation errors or bad requests
      if (error.response?.status === 400 || error.response?.status === 422) {
        throw new AppError(
          `Invalid request to NLP service: ${error.response?.data?.error || error.message}`,
          400,
          ERROR_CODES.VALIDATION_ERROR
        );
      }

      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Wait before retrying (exponential backoff: 500ms, 1000ms)
      const backoffMs = 500 * Math.pow(2, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }
  }

  // All retries exhausted
  const errorMessage = lastError?.response?.data?.error || lastError?.message || "Unknown error";
  const isTimeout = lastError?.code === "ECONNABORTED" || lastError?.message?.includes("timeout");

  throw new AppError(
    `NLP service ${isTimeout ? "timeout" : "unavailable"}: ${errorMessage}. Failed after ${maxRetries} attempts.`,
    503,
    ERROR_CODES.NLP_ERROR
  );
};

/**
 * Generate embedding for question text using Flask API
 * Calls POST /embed endpoint with retry logic
 * @param {string} text - Question text to embed
 * @returns {Promise<Array<number>>} Embedding vector (384-dimensional)
 * @throws {AppError} If service unavailable after retries
 */
const generateEmbedding = async (text) => {
  // Input validation
  if (!text || typeof text !== "string" || text.trim().length === 0) {
    throw new AppError("Text cannot be empty", 400, ERROR_CODES.VALIDATION_ERROR);
  }

  const trimmedText = text.trim();
  if (trimmedText.length > 5000) {
    throw new AppError("Text exceeds maximum length of 5000 characters", 400, ERROR_CODES.VALIDATION_ERROR);
  }

  try {
    const response = await executeWithRetry(
      () =>
        axios.post(
          `${NLP_SERVICE_URL}/embed`,
          { text: trimmedText },
          { timeout: NLP_TIMEOUT }
        ),
      "generateEmbedding"
    );

    // Validate embedding response
    if (!response.data.embedding || !Array.isArray(response.data.embedding)) {
      throw new AppError(
        "Invalid embedding response from NLP service",
        502,
        ERROR_CODES.NLP_ERROR
      );
    }

    if (response.data.embedding.length !== NLP_CONFIG.EMBEDDING_DIMENSION) {
      throw new AppError(
        `Expected ${NLP_CONFIG.EMBEDDING_DIMENSION}-dimensional embedding, got ${response.data.embedding.length}`,
        502,
        ERROR_CODES.NLP_ERROR
      );
    }

    return response.data.embedding;
  } catch (error) {
    // Re-throw AppError as-is
    if (error instanceof AppError) {
      throw error;
    }

    // Convert axios errors to AppError
    const status = error.response?.status || 503;
    const message = error.response?.data?.error || error.message || "Failed to generate embedding";
    throw new AppError(message, status, ERROR_CODES.NLP_ERROR);
  }
};

/**
 * Check health of NLP service
 * @returns {Promise<boolean>} True if service is healthy, false otherwise
 */
const checkNLPHealth = async () => {
  try {
    const response = await axios.get(`${NLP_SERVICE_URL}/health`, {
      timeout: NLP_TIMEOUT,
    });
    const isHealthy = response.status === 200 && response.data?.status === "healthy";
    logger.info(
      `[NLP] Health check: ${isHealthy ? "✓ Healthy" : "✗ Unhealthy"}`
    );
    return isHealthy;
  } catch (error) {
    logger.error(`[NLP] Health check failed: ${error.message}`);
    return false;
  }
};

/**
 * Get similarity between query and documents using batch endpoint
 * Calls POST /similarity endpoint with retry logic
 * @param {string} query - Query text
 * @param {Array<string>} documents - Document texts to compare against
 * @param {number} threshold - Similarity threshold (0-1)
 * @returns {Promise<Object>} Similarity results with best match
 * @returns {Object.best_match} Best matching document with index, score, text
 * @returns {Object.matches} Array of all matches above threshold
 * @returns {Object.total_matches} Number of matches above threshold
 */
const findSimilarQuestions = async (
  query,
  documents,
  threshold = NLP_CONFIG.SIMILARITY_THRESHOLD
) => {
  // Input validation
  if (!query || typeof query !== "string" || query.trim().length === 0) {
    logger.warn("[NLP] Empty query for similarity check");
    return { matches: [], best_match: null, total_matches: 0 };
  }

  if (!documents || !Array.isArray(documents) || documents.length === 0) {
    logger.warn("[NLP] No documents provided for similarity check");
    return { matches: [], best_match: null, total_matches: 0 };
  }

  if (threshold < 0 || threshold > 1) {
    throw new AppError(
      "Threshold must be between 0 and 1",
      400,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  try {
    const response = await executeWithRetry(
      () =>
        axios.post(
          `${NLP_SERVICE_URL}/similarity`,
          {
            query: query.trim(),
            documents: documents.map((doc) =>
              typeof doc === "string" ? doc : String(doc)
            ),
            threshold,
          },
          { timeout: NLP_TIMEOUT }
        ),
      "findSimilarQuestions"
    );

    // Validate response structure
    const { best_match, matches, total_matches } = response.data;

    return {
      best_match: best_match || null,
      matches: Array.isArray(matches) ? matches : [],
      total_matches: typeof total_matches === "number" ? total_matches : 0,
    };
  } catch (error) {
    if (error instanceof AppError) {
      logger.error(`[NLP] Similarity check failed via Python NLP: ${error.message}`);
    } else {
      logger.error(`[NLP] Unexpected error in findSimilarQuestions: ${error.message}`);
    }

    logger.info("[NLP] Attempting fallback to local TF-IDF similarity engine...");
    try {
      // Use lower threshold for TF-IDF since scores are calculated differently
      const tfidfThreshold = Math.max(0.1, threshold / 4);
      const tfidfResult = calculateTfIdfSimilarity(query, documents, tfidfThreshold);
      logger.info(`[NLP] TF-IDF fallback successful, found ${tfidfResult.total_matches} matches`);
      return tfidfResult;
    } catch (fallbackError) {
      logger.error(`[NLP] TF-IDF fallback also failed: ${fallbackError.message}`);
      // Return empty results for graceful degradation if BOTH fail
      return { matches: [], best_match: null, total_matches: 0, isFallback: true };
    }
  }
};

module.exports = {
  generateEmbedding,
  checkNLPHealth,
  findSimilarQuestions,
  AppError, // Export custom error class for use in other modules
};
