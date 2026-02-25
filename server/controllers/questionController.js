/**
 * Question Controller
 * 
 * Thin controller layer that:
 * - Handles HTTP request/response
 * - Validates incoming data
 * - Delegates business logic to service layer
 * - Formats responses using utility functions
 * 
 * Architecture Pattern: Controller → Service → Model
 * Business logic NEVER lives in the controller
 */

const {
  sendSuccess,
  sendPaginated,
  sendValidationError,
} = require("../utilities/responseHandler");
const {
  validateQuestionText,
  validateAnswerText,
} = require("../utilities/validators");
const { PAGINATION } = require("../constants");
const { asyncHandler } = require("../middleware/errorHandler");
const {
  askQuestion,
  getQuestion,
  answerQuestion,
  searchQuestions,
  markHelpful,
  getMyQuestions,
  assignQuestion,
} = require("../services/questionService");

/**
 * POST /api/questions
 * Ask a new question with NLP similarity matching
 * 
 * Request: { question_text, category, domain }
 * Response: { question, matched, similarityScore, message }
 * 
 * Similarity matching:
 * - Generates embedding for question text
 * - Compares against all answered questions
 * - If similarity > 0.80: Returns matched answer immediately
 * - Else: Saves as pending for alumni assignment
 */
exports.ask = asyncHandler(async (req, res) => {
  const { question_text, category, domain } = req.body;

  // Validate input
  const validation = validateQuestionText(question_text);
  if (!validation.valid) {
    return sendValidationError(res, validation.error);
  }

  // Delegate business logic to service
  const result = await askQuestion(req.user.id, question_text, category, domain);

  // Format response
  const responseData = {
    question: result.question,
    matched: result.matched,
    similarityScore: result.similarityScore,
  };

  sendSuccess(res, responseData, result.message, 201);
});

/**
 * POST /api/questions/:id/answer
 * Answer a question (alumni only)
 * 
 * Request: { answer_text }
 * Response: Updated question with answer
 */
exports.answer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { answer_text } = req.body;

  // Validate input
  const validation = validateAnswerText(answer_text);
  if (!validation.valid) {
    return sendValidationError(res, validation.error);
  }

  // Delegate to service
  const updatedQuestion = await answerQuestion(id, answer_text, req.user.id);

  sendSuccess(res, updatedQuestion, "Answer submitted successfully");
});

/**
 * GET /api/questions/:id
 * Get question by ID with view tracking
 * 
 * Response: Question with incremented view count
 */
exports.getQuestion = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Delegate to service
  const question = await getQuestion(id);

  sendSuccess(res, question);
});

/**
 * GET /api/questions/all
 * Get all questions with filters and pagination
 * 
 * Query params: { status, category, domain, answered, page, limit }
 * Response: Paginated questions
 */
exports.getAllQuestions = asyncHandler(async (req, res) => {
  const {
    status,
    category,
    domain,
    answered,
    page = PAGINATION.DEFAULT_PAGE,
    limit = PAGINATION.DEFAULT_LIMIT,
  } = req.query;

  // Build filters object
  const filters = {};
  if (status) filters.status = status;
  if (category) filters.category = category;
  if (domain) filters.domain = domain;
  if (answered !== undefined) filters.answered = answered === "true";

  // Delegate to service
  const result = await searchQuestions(filters, page, limit);

  sendPaginated(res, result.questions, result.pagination.total, page, limit);
});

/**
 * GET /api/questions/my-questions
 * Get questions for current user
 * 
 * Students see: their own questions
 * Alumni see: questions assigned to them
 * 
 * Query params: { page, limit }
 * Response: Paginated questions
 */
exports.getMyQuestions = asyncHandler(async (req, res) => {
  const {
    page = PAGINATION.DEFAULT_PAGE,
    limit = PAGINATION.DEFAULT_LIMIT,
  } = req.query;

  // Delegate to service (filters by user ID/role)
  const result = await getMyQuestions(req.user.id, page, limit);

  sendPaginated(res, result.questions, result.pagination.total, page, limit);
});

/**
 * POST /api/questions/:id/assign
 * Assign question to alumni (admin only)
 * 
 * Request: { alumni_id }
 * Response: Updated question
 * 
 * Future: Trigger background job to notify alumni
 */
exports.assignQuestion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { alumni_id } = req.body;

  if (!alumni_id) {
    return sendValidationError(res, "Alumni ID is required");
  }

  // Delegate to service
  const question = await assignQuestion(id, alumni_id);

  sendSuccess(res, question, "Question assigned successfully");
});

/**
 * POST /api/questions/:id/helpful
 * Mark question as helpful
 * 
 * Response: Updated question with helpful count
 */
exports.markHelpful = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Delegate to service
  const question = await markHelpful(id);

  sendSuccess(res, { helpful_count: question.helpful_count }, "Marked as helpful");
});

/**
 * GET /api/questions/search
 * Search questions by text with regex
 * 
 * Query params: { query, page, limit }
 * Response: Paginated questions ranked by views
 * 
 * Future: Add full-text search index for better performance
 * db.questions.createIndex({ question_text: "text" })
 */
exports.searchQuestions = asyncHandler(async (req, res) => {
  const {
    query,
    page = PAGINATION.DEFAULT_PAGE,
    limit = PAGINATION.DEFAULT_LIMIT,
  } = req.query;

  if (!query || query.trim().length === 0) {
    return sendValidationError(res, "Search query is required");
  }

  // Delegate to service with search filter
  const result = await searchQuestions({ searchQuery: query }, page, limit);

  sendPaginated(res, result.questions, result.pagination.total, page, limit);
});
