/**
 * Question Service Layer
 * Contains all business logic for question management
 * Handles NLP integration, similarity matching, and database operations
 * 
 * Service Layer Architecture:
 * Controller (request/response) → Service (business logic) → Model (persistence)
 */

const Question = require("../models/Question");
const User = require("../models/User");
const logger = require("../utils/logger");
const { generateEmbedding, AppError } = require("./nlpService");
const { cosineSimilarity, batchSimilarity } = require("../utils/similarity");
const { computeTFIDF } = require("../utils/nlpFallback");
const { calculateTfIdfSimilarity } = require("./tfidfService");
const { storeQuestionEmbedding, searchSimilarQuestions } = require("./vectorSearchService");
const {
  QUESTION_STATUS,
  NLP_CONFIG,
  PAGINATION,
  ERROR_CODES,
} = require("../constants");

/**
 * Ask a new question with NLP similarity matching
 * 
 * Flow:
 * 1. Validate input
 * 2. Generate embedding using NLP service
 * 3. Fetch all answered questions (optimized query)
 * 4. Compute cosine similarity against answered questions
 * 5. If similarity > threshold: Return matched answer immediately
 * 6. Else: Save question as pending and assign to relevant alumni
 * 
 * @param {string} studentId - Student's user ID
 * @param {string} questionText - Question text (10-5000 chars)
 * @param {string} category - Question category
 * @param {string} domain - Question domain (e.g., tech, management)
 * @returns {Promise<Object>} Created question with matching status
 * @throws {AppError} If validation or NLP fails
 * 
 * Performance notes:
 * - Only queries answered questions (has answer_text)
 * - Selects minimal fields to reduce memory usage
 * - Embeddings stored in MongoDB for efficient retrieval
 * - Future: Could use vector database (Pinecone, Weaviate) for 1M+ scale
 * - Future: Caching with Redis to skip similarity checks for common questions
 */
const askQuestion = async (studentId, questionText, category, domain) => {
  // 1. Validate input (controller already validates, but defensive programming)
  if (!studentId || !questionText?.trim()) {
    throw new AppError(
      "Student ID and question text are required",
      400,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  const trimmedQuestion = questionText.trim();

  // 2. Generate embedding using NLP service
  let embedding = null;
  let embeddingError = null;
  let embeddingTimeMs = 0;

  try {
    const embeddingStartTime = Date.now();
    embedding = await generateEmbedding(trimmedQuestion);
    embeddingTimeMs = Date.now() - embeddingStartTime;
    
    logger.info(
      `[QUESTION] Generated embedding for question (${embedding.length}-dim) in ${embeddingTimeMs}ms`
    );
    
    // Future: Send to monitoring system (e.g., CloudWatch, DataDog)
    // metrics.recordEmbeddingTime(embeddingTimeMs);
  } catch (error) {
    // Log but don't fail - continue without embedding
    embeddingError = error.message;
    logger.warn(
      `[QUESTION] Embedding generation failed (continuing): ${error.message}`
    );
    // Future: metrics.recordEmbeddingError(error.code);
  }

  /**
   * ============================================
   * OPTIMIZATION POINT 1: REDIS CACHING
   * ============================================
   * 
   * Future enhancement (Phase 2):
   * Cache answered questions in Redis instead of querying MongoDB every time
   * 
   * Benefits: Reduces DB load 80-90%, sub-millisecond cache hits
   * Implementation: Cache with 1-hour TTL, invalidate on new answers
   * 
   * When to implement: After 10K+ questions, if query latency > 500ms
   */

  // 3. Find similar answered questions using Vector DB Semantic Search
  let matchedQuestion = null;
  let similarityScore = 0;

  if (embedding) {
    try {
      const searchStartTime = Date.now();
      logger.info(`[QUESTION] Querying Vector DB for semantic similarity...`);
      
      const similarities = await searchSimilarQuestions(embedding, 5);
      const similarityTimeMs = Date.now() - searchStartTime;

      if (similarities && similarities.length > 0) {
        // Results are pre-sorted by score (descending)
        const bestMatch = similarities[0];

        if (bestMatch.score >= NLP_CONFIG.SIMILARITY_THRESHOLD) {
          matchedQuestion = bestMatch.questionId;
          similarityScore = bestMatch.score;
          
          logger.info(
            `[QUESTION] VECTOR DB MATCH FOUND:\n` +
            `  Score: ${similarityScore.toFixed(4)} (threshold: ${NLP_CONFIG.SIMILARITY_THRESHOLD})\n` +
            `  Matched Question ID: ${matchedQuestion}\n` +
            `  Search Time: ${similarityTimeMs}ms`
          );
        } else {
          logger.info(
            `[QUESTION] VECTOR DB SEARCH COMPLETE:\n` +
            `  Best Score: ${bestMatch.score.toFixed(4)} (below threshold)\n` +
            `  Search Time: ${similarityTimeMs}ms\n` +
            `  Resolution: Saving as PENDING`
          );
        }
      } else {
        logger.info(`[QUESTION] Vector DB returned no matches.`);
      }
    } catch (error) {
      logger.error("[QUESTION] Vector similarity matching failed:", error.message);
    }
  } else {
    try {
      logger.info('[QUESTION] Fallback to TF-IDF similarity matching');
      const answeredQuestions = await Question.find({
        isAnswered: true,
        answer_text: { $exists: true, $ne: null }
      })
      .select("question_text answer_text _id helpful_count views_count")
      .lean()
      .limit(1000);

      if (answeredQuestions.length > 0) {
        try {
          // Primary fallback: tfidfService (uses natural library — more robust)
          const questionTexts = answeredQuestions.map(q => q.question_text);
          const tfidfThreshold = Math.max(0.05, NLP_CONFIG.SIMILARITY_THRESHOLD / 4);
          const result = calculateTfIdfSimilarity(trimmedQuestion, questionTexts, tfidfThreshold);

          if (result.best_match && result.best_match.score > 0) {
            matchedQuestion = answeredQuestions[result.best_match.index]._id;
            similarityScore = result.best_match.score;
            logger.info(`[QUESTION] tfidfService match: score=${similarityScore.toFixed(4)}`);
          }
        } catch (tfidfError) {
          // Secondary fallback: pure-JS computeTFIDF (no external deps)
          logger.warn('[QUESTION] tfidfService fallback failed, trying nlpFallback:', tfidfError.message);
          const { bestMatch, score } = computeTFIDF(trimmedQuestion, answeredQuestions);
          if (bestMatch && score >= NLP_CONFIG.SIMILARITY_THRESHOLD) {
            matchedQuestion = bestMatch._id;
            similarityScore = score;
          }
        }
      }
    } catch (error) {
      // Non-crashing: question will be saved as pending without a match
      logger.error("[QUESTION] TF-IDF fallback matching failed:", error.message);
    }
  }

  // 6. Create and save the question
  const totalStartTime = Date.now(); // For overall timing
  const newQuestion = await Question.create({
    student_id: studentId,
    question_text: trimmedQuestion,
    category: category || "General",
    domain: domain || "General",
    embedding_vector: embedding, // May be null if NLP failed
    embedding_error: embeddingError, // Track if NLP failed
    status: matchedQuestion ? QUESTION_STATUS.ANSWERED : QUESTION_STATUS.PENDING,
    isAnswered: !!matchedQuestion,
    similarity_score: similarityScore,
    matched_question_id: matchedQuestion,
    helpful_count: 0,
    views_count: 0,
    // Future: Add field for background job processing status for alumni assignment
  });

  // Populate user details
  await newQuestion.populate("student_id", "name email university domain");

  const totalTimeMs = Date.now() - totalStartTime;
  
  // Log performance summary
  logger.info(
    `[QUESTION] QUESTION PROCESSING COMPLETE:\n` +
    `  Status: ${newQuestion.status}\n` +
    `  Embedding Generation: ${embeddingTimeMs}ms\n` +
    `  Total Processing Time: ${totalTimeMs}ms\n` +
    `  Question ID: ${newQuestion._id}`
  );

  /**
   * ============================================
   * OPTIMIZATION POINT 2: BACKGROUND JOB QUEUE
   * ============================================
   * 
   * Future enhancement: Asynchronous alumni assignment
   * Currently: Synchronous (blocking response)
   * Future: Async with job queue (RabbitMQ, Bull, AWS SQS)
   * 
   * Implementation:
   * 1. Enqueue alumni assignment job
   * 2. Return response immediately
   * 3. Process in background worker pool
   * 4. Notify alumni via email/in-app notification
   * 
   * Benefits:
   * - Faster response time (eliminate blocking I/O)
   * - Better resource utilization
   * - Retry logic for failed assignments
   * - Scale horizontally with worker processes
   * 
   * When to implement: After deployment to production
   * Example: bull.add('assignQuestion', { questionId: newQuestion._id })
   */

  /**
   * ============================================
   * OPTIMIZATION POINT 3: VECTOR DATABASE MIGRATION
   * ============================================
   * 
   * Current phase (Phase 1): MongoDB linear scan
   * Latency: 500-800ms for 1000 questions
   * Scale limit: ~10K questions
   * 
   * Future phase (Phase 2): Vector database (Weaviate/Pinecone/Milvus)
   * Latency: 20-50ms with HNSW indexing
   * Scale: 1M+ questions efficiently
   * 
   * Migration checklist:
   * 1. Set up Pinecone/Weaviate account
   * 2. Create vector index with HNSW algorithm
   * 3. Add SDK: npm install @pinecone-database/pinecone
   * 4. Implement hybrid search (try Vector DB first, fallback to MongoDB)
   * 5. Dual-write new embeddings to both systems
   * 6. Feature flag to control search method
   * 7. Async migration script to backfill old embeddings
   * 8. Monitor latency and accuracy before full cutover
   * 9. Keep MongoDB as backup data store
   * 
   * Code example:
   * const vectorIndex = await pinecone.Index('alumni-questions')
   * const results = await vectorIndex.query(embedding, { topK: 10 })
   */

  return {
    question: newQuestion,
    matched: !!matchedQuestion,
    similarityScore,
    processingTimeMs: totalTimeMs,
    message: matchedQuestion
      ? `Found similar answer with ${(similarityScore * 100).toFixed(1)}% match`
      : "Question saved and will be assigned to relevant alumni",
  };
};

/**
 * Get question by ID with view tracking
 * 
 * @param {string} questionId - Question's MongoDB ID
 * @returns {Promise<Object>} Question with incremented view count
 * @throws {AppError} If question not found
 */
const getQuestion = async (questionId) => {
  if (!questionId) {
    throw new AppError("Question ID is required", 400, ERROR_CODES.VALIDATION_ERROR);
  }

  // Increment view count and return updated document
  const question = await Question.findByIdAndUpdate(
    questionId,
    { $inc: { views_count: 1 } },
    { new: true }
  )
    .populate("student_id", "name email")
    .populate("answered_by", "name email jobTitle company");

  if (!question) {
    throw new AppError("Question not found", 404, ERROR_CODES.NOT_FOUND);
  }

  return question;
};

/**
 * Answer a question by an alumni
 * 
 * @param {string} questionId - Question's ID
 * @param {string} answerText - Answer text (10-10000 chars)
 * @param {string} alumniId - Alumni's user ID
 * @returns {Promise<Object>} Updated question with answer
 * @throws {AppError} On validation or authorization errors
 */
const answerQuestion = async (questionId, answerText, alumniId) => {
  if (!questionId || !answerText?.trim()) {
    throw new AppError(
      "Question ID and answer text are required",
      400,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  const question = await Question.findById(questionId);
  if (!question) {
    throw new AppError("Question not found", 404, ERROR_CODES.NOT_FOUND);
  }

  // Authorization: if the question is assigned, only the assigned alumni can answer.
  // Unassigned questions may be answered by any alumni (role already enforced at the route).
  if (question.assigned_to && question.assigned_to.toString() !== alumniId) {
    throw new AppError(
      "This question is assigned to another alumni",
      403,
      ERROR_CODES.FORBIDDEN
    );
  }

  // Update question with answer
  question.answer_text = answerText.trim();
  question.answered_by = alumniId;
  question.answer_date = new Date();
  question.status = QUESTION_STATUS.ANSWERED;
  question.isAnswered = true;

  await question.save();
  await question.populate("student_id", "name email");
  await question.populate("answered_by", "name email jobTitle");

  // Push answered question to Vector DB to allow future semantic matches
  await storeQuestionEmbedding(question);

  return question;
};

/**
 * Search questions with filters and pagination
 * 
 * @param {Object} filters - Search filters {category, domain, status, answered}
 * @param {number} page - Page number (1-based)
 * @param {number} limit - Items per page (capped at MAX_LIMIT)
 * @returns {Promise<Object>} Paginated questions with metadata
 */
const searchQuestions = async (filters = {}, page = 1, limit = PAGINATION.DEFAULT_LIMIT) => {
  // Cap limit at MAX_LIMIT
  const validLimit = Math.min(parseInt(limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
  const pageNum = Math.max(1, parseInt(page) || 1);

  // Build query
  const query = {};

  if (filters.studentId) {
    query.student_id = filters.studentId;
  }

  if (filters.category && filters.category !== "All") {
    query.category = filters.category;
  }

  if (filters.domain && filters.domain !== "All") {
    query.domain = filters.domain;
  }

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.answered !== undefined) {
    query.isAnswered = filters.answered;
  }

  // Future: Add full-text search index on question_text for advanced search
  // db.questions.createIndex({ question_text: "text" })

  // Execute query
  const total = await Question.countDocuments(query);
  const questions = await Question.find(query)
    .select("-embedding_vector") // Exclude embedding for API response (reduces payload)
    .populate("student_id", "name email")
    .populate("answered_by", "name email jobTitle")
    .sort({ createdAt: -1 })
    .skip((pageNum - 1) * validLimit)
    .lean();

  return {
    questions,
    pagination: {
      total,
      page: pageNum,
      limit: validLimit,
      pages: Math.ceil(total / validLimit),
      hasNextPage: pageNum < Math.ceil(total / validLimit),
    },
  };
};

/**
 * Mark question as helpful
 * 
 * @param {string} questionId - Question's ID
 * @returns {Promise<Object>} Updated question with new helpful count
 */
const markHelpful = async (questionId) => {
  if (!questionId) {
    throw new AppError("Question ID is required", 400, ERROR_CODES.VALIDATION_ERROR);
  }

  const question = await Question.findByIdAndUpdate(
    questionId,
    { $inc: { helpful_count: 1 } },
    { new: true }
  );

  if (!question) {
    throw new AppError("Question not found", 404, ERROR_CODES.NOT_FOUND);
  }

  return question;
};

/**
 * Get questions for current user
 * 
 * @param {string} userId - User's ID
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Promise<Object>} User's questions with pagination
 */
const getMyQuestions = async (userId, page = 1, limit = PAGINATION.DEFAULT_LIMIT) => {
  return searchQuestions({ studentId: userId }, page, limit);
};

/**
 * Assign question to alumni (admin only)
 * 
 * Future: Could trigger background job for notifications
 * Example: job.queue.push({ type: 'notify_alumni', questionId, alumniId })
 * 
 * @param {string} questionId - Question's ID
 * @param {string} alumniId - Alumni's ID to assign to
 * @returns {Promise<Object>} Updated question
 */
const assignQuestion = async (questionId, alumniId) => {
  if (!questionId || !alumniId) {
    throw new AppError(
      "Question ID and alumni ID are required",
      400,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  // Verify alumni exists
  const alumni = await User.findById(alumniId);
  if (!alumni || alumni.role !== "alumni") {
    throw new AppError("Invalid alumni ID", 400, ERROR_CODES.VALIDATION_ERROR);
  }

  const question = await Question.findByIdAndUpdate(
    questionId,
    {
      assigned_to: alumniId,
      status: QUESTION_STATUS.ASSIGNED,
    },
    { new: true }
  );

  if (!question) {
    throw new AppError("Question not found", 404, ERROR_CODES.NOT_FOUND);
  }

  // Future: Emit event or queue background job for alumni notification
  // eventBus.emit('question:assigned', { questionId, alumniId });
  // OR
  // backgroundJobQueue.push({ type: 'send_notification', userId: alumniId, message: 'New question assigned' });

  return question;
};

module.exports = {
  askQuestion,
  getQuestion,
  answerQuestion,
  searchQuestions,
  markHelpful,
  getMyQuestions,
  assignQuestion,
};
