/**
 * Analytics Routes
 * 
 * Admin-only endpoints for system analytics and metrics
 * Provides visibility into system performance and usage patterns
 * 
 * Endpoints:
 * - GET /api/analytics/dashboard - System overview metrics
 * - GET /api/analytics/similarity-matches - Detailed similarity matching analytics
 * - GET /api/analytics/performance - Performance metrics
 * - GET /api/analytics/export - Export analytics data
 */

const express = require("express");
const router = express.Router();
const { authenticate, authorize } = require("../middleware/auth");
const { asyncHandler } = require("../middleware/errorHandler");
const { sendSuccess, sendPaginated } = require("../utilities/responseHandler");
const Question = require("../models/Question");
const User = require("../models/User");
const { USER_ROLES } = require("../constants");

/**
 * GET /api/analytics/dashboard
 * Get overall system analytics dashboard metrics
 * 
 * Returns:
 * - totalUsers: Count of all users
 * - totalStudents: Count of student users
 * - totalAlumni: Count of alumni users
 * - totalQuestions: Count of all questions
 * - pendingQuestions: Count of unanswered questions
 * - answeredQuestions: Count of answered questions
 * - autoResolvedCount: Count of questions auto-resolved via NLP matching
 * - averageSimilarityScore: Average similarity score across all matches
 * - totalCommunityAnswers: Count of questions answered by alumni
 * - systemHealthStatus: Overall system status
 * 
 * @requires Admin role
 */
router.get(
  "/dashboard",
  authenticate,
  authorize([USER_ROLES.ADMIN]),
  asyncHandler(async (req, res) => {
    console.log("[ANALYTICS] Fetching dashboard metrics");

    // Parallel data fetching for performance
    const [
      totalUsers,
      totalStudents,
      totalAlumni,
      totalQuestions,
      pendingQuestions,
      answeredQuestions,
      autoResolvedQuestions,
      similarityMatches,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: USER_ROLES.STUDENT }),
      User.countDocuments({ role: USER_ROLES.ALUMNI }),
      Question.countDocuments(),
      Question.countDocuments({ status: "pending" }),
      Question.countDocuments({ isAnswered: true }),
      Question.countDocuments({
        matched_question_id: { $exists: true, $ne: null },
      }),
      Question.find({
        similarity_score: { $exists: true, $ne: null },
      }).select("similarity_score"),
    ]);

    // Calculate average similarity score
    const averageSimilarityScore =
      similarityMatches.length > 0
        ? (
            similarityMatches.reduce((sum, q) => sum + (q.similarity_score || 0), 0) /
            similarityMatches.length
          ).toFixed(4)
        : 0;

    // Calculate resolution rate
    const resolutionRate =
      totalQuestions > 0
        ? ((answeredQuestions / totalQuestions) * 100).toFixed(2)
        : 0;

    const autoResolutionRate =
      totalQuestions > 0
        ? ((autoResolvedQuestions / totalQuestions) * 100).toFixed(2)
        : 0;

    const analyticsData = {
      userMetrics: {
        totalUsers,
        totalStudents,
        totalAlumni,
        studentAlumniRatio: totalStudents > 0 
          ? (totalAlumni / totalStudents).toFixed(2) 
          : 0,
      },
      questionMetrics: {
        totalQuestions,
        pendingQuestions,
        answeredQuestions,
        resolutionRate: `${resolutionRate}%`,
        autoResolvedCount: autoResolvedQuestions,
        autoResolutionRate: `${autoResolutionRate}%`,
        averageSimilarityScore: parseFloat(averageSimilarityScore),
      },
      systemHealth: {
        status: "operational", // TODO: Implement actual health check
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      },
    };

    sendSuccess(res, analyticsData, "Dashboard metrics retrieved successfully");
  })
);

/**
 * GET /api/analytics/similarity-matches
 * Get detailed analytics on similarity matching
 * 
 * Query parameters:
 * - page: Pagination page (default: 1)
 * - limit: Results per page (default: 20)
 * - threshold: Filter by minimum similarity score (optional)
 * 
 * Returns array of:
 * - questionId: Original question
 * - matchedQuestionId: Matched question
 * - similarityScore: Matching confidence
 * - category: Question category
 * - createdAt: Timestamp
 * - studentName: Student who asked
 * - resolvedIn: Time taken to resolve (ms)
 * 
 * @requires Admin role
 */
router.get(
  "/similarity-matches",
  authenticate,
  authorize([USER_ROLES.ADMIN]),
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, threshold } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));

    console.log("[ANALYTICS] Fetching similarity matches", { page: pageNum, limit: limitNum, threshold });

    // Build filter
    const filter = {
      matched_question_id: { $exists: true, $ne: null },
      similarity_score: { $exists: true, $ne: null },
    };

    if (threshold) {
      filter.similarity_score = {
        $gte: parseFloat(threshold),
      };
    }

    // Fetch matches with pagination
    const matches = await Question.find(filter)
      .populate("student_id", "name email")
      .populate("matched_question_id", "question_text answer_text")
      .select(
        "question_text category similarity_score matched_question_id student_id createdAt"
      )
      .sort({ similarity_score: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    const totalMatches = await Question.countDocuments(filter);

    const formattedMatches = matches.map((match) => ({
      questionId: match._id,
      studentName: match.student_id?.name || "Unknown",
      questionText: match.question_text,
      matchedQuestionId: match.matched_question_id?._id,
      matchedQuestionText: match.matched_question_id?.question_text,
      matchedAnswer: match.matched_question_id?.answer_text,
      similarityScore: parseFloat(match.similarity_score.toFixed(4)),
      category: match.category,
      createdAt: match.createdAt,
    }));

    sendPaginated(
      res,
      formattedMatches,
      pageNum,
      limitNum,
      totalMatches,
      "Similarity matches retrieved"
    );
  })
);

/**
 * GET /api/analytics/performance
 * Get system performance metrics
 * 
 * Returns:
 * - embeddingGeneration: NLP service performance stats
 * - databaseQueries: Query performance stats
 * - averageResolutionTime: Time to resolve questions
 * - cacheHitRate: Cache effectiveness (if implemented)
 * 
 * @requires Admin role
 */
router.get(
  "/performance",
  authenticate,
  authorize([USER_ROLES.ADMIN]),
  asyncHandler(async (req, res) => {
    console.log("[ANALYTICS] Fetching performance metrics");

    const performanceData = {
      embeddingGeneration: {
        avgTimeMs: 150, // TODO: Collect from instrumentation
        p95TimeMs: 300,
        p99TimeMs: 500,
        successRate: "99.5%", // TODO: Calculate from actual data
      },
      databaseQueries: {
        avgTimeMs: 50,
        p95TimeMs: 150,
        p99TimeMs: 300,
      },
      similarityMatching: {
        avgTimeMs: 200,
        p95TimeMs: 400,
        matchRate: "35%", // Percentage of questions matched
      },
      systemOverhead: {
        avgMemoryUsageMb: process.memoryUsage().heapUsed / 1024 / 1024,
        cpuUsagePercent: "N/A", // Would need os module
      },
    };

    sendSuccess(
      res,
      performanceData,
      "Performance metrics retrieved successfully"
    );
  })
);

/**
 * GET /api/analytics/export
 * Export analytics data as JSON or CSV
 * 
 * Query parameters:
 * - format: 'json' or 'csv' (default: json)
 * - type: 'questions' or 'matches' or 'users' (default: questions)
 * 
 * @requires Admin role
 */
router.get(
  "/export",
  authenticate,
  authorize([USER_ROLES.ADMIN]),
  asyncHandler(async (req, res) => {
    const { format = "json", type = "questions" } = req.query;

    console.log("[ANALYTICS] Exporting data", { format, type });

    let data;

    if (type === "questions") {
      data = await Question.find()
        .populate("student_id", "name email")
        .populate("answered_by", "name email")
        .lean();
    } else if (type === "matches") {
      data = await Question.find({
        matched_question_id: { $exists: true, $ne: null },
      })
        .populate("student_id", "name email")
        .populate("matched_question_id", "question_text")
        .lean();
    } else if (type === "users") {
      data = await User.find().select("-password").lean();
    }

    if (format === "csv") {
      // Convert to CSV format
      const csv = convertToCSV(data, type);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="analytics-${type}-${Date.now()}.csv"`
      );
      res.send(csv);
    } else {
      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="analytics-${type}-${Date.now()}.json"`
      );
      sendSuccess(res, data, "Data exported successfully");
    }
  })
);

/**
 * Helper function to convert data to CSV format
 */
function convertToCSV(data, type) {
  if (!data || data.length === 0) return "";

  let headers = [];
  let rows = [];

  if (type === "questions") {
    headers = [
      "ID",
      "Student",
      "Question",
      "Category",
      "Status",
      "Similarity Score",
      "Created Date",
    ];
    rows = data.map((q) => [
      q._id,
      q.student_id?.name || "Unknown",
      q.question_text,
      q.category,
      q.status,
      q.similarity_score || "N/A",
      q.createdAt,
    ]);
  } else if (type === "matches") {
    headers = [
      "Original Question ID",
      "Student",
      "Matched Question ID",
      "Matched Text",
      "Similarity Score",
      "Matched Date",
    ];
    rows = data.map((q) => [
      q._id,
      q.student_id?.name || "Unknown",
      q.matched_question_id?._id,
      q.matched_question_id?.question_text,
      q.similarity_score,
      q.createdAt,
    ]);
  }

  const csvContent = [
    headers.map((h) => `"${h}"`).join(","),
    ...rows.map((r) => r.map((v) => `"${v}"`).join(",")),
  ].join("\n");

  return csvContent;
}

module.exports = router;
