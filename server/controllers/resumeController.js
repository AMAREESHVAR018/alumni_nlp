/**
 * Resume Controller
 *
 * Handles resume file uploads, text extraction, NLP analysis via the Python
 * NLP service, and persistence of analysis results.
 *
 * Routes:
 *   POST /api/resume/analyze        – Upload & analyse a resume
 *   GET  /api/resume/history        – Get current user's analysis history
 *   GET  /api/resume/history/:id    – Get a specific analysis result
 */

const path = require("path");
const axios = require("axios");
const FormData = require("form-data");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

const ResumeAnalysis = require("../models/ResumeAnalysis");
const { asyncHandler } = require("../middleware/errorHandler");
const {
  sendSuccess,
  sendError,
  sendPaginated,
} = require("../utilities/responseHandler");
const { PAGINATION } = require("../constants");

const NLP_SERVICE_URL =
  process.env.NLP_SERVICE_URL || "http://localhost:5001";

// ── helpers ────────────────────────────────────────────────────────────────

/**
 * Extract plain text from a buffer based on MIME / extension.
 * Tries the FastAPI NLP service endpoint first; falls back to local parsing.
 */
async function extractTextLocally(buffer, mimetype, originalname) {
  const ext = path.extname(originalname).toLowerCase();

  if (mimetype === "application/pdf" || ext === ".pdf") {
    const result = await pdfParse(buffer);
    return result.text || "";
  }

  if (
    mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    ext === ".docx" ||
    ext === ".doc"
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || "";
  }

  if (mimetype === "text/plain" || ext === ".txt") {
    return buffer.toString("utf-8");
  }

  throw new Error(
    `Unsupported file type (${ext}). Please upload a PDF, DOCX, or TXT file.`
  );
}

/**
 * Send file to the FastAPI /analyze-resume endpoint.
 * Returns the analysis JSON from the NLP service.
 */
async function analyzeViaService(buffer, originalname, mimetype) {
  const form = new FormData();
  form.append("file", buffer, {
    filename: originalname,
    contentType: mimetype,
  });

  const response = await axios.post(
    `${NLP_SERVICE_URL}/analyze-resume`,
    form,
    {
      headers: form.getHeaders(),
      timeout: 30_000,
    }
  );
  return response.data;
}

/**
 * Fallback: extract text locally and send to /analyze-resume-text.
 */
async function analyzeViaTextFallback(buffer, mimetype, originalname) {
  const text = await extractTextLocally(buffer, mimetype, originalname);
  if (!text.trim()) {
    throw new Error("Could not extract text from the uploaded file.");
  }
  const response = await axios.post(
    `${NLP_SERVICE_URL}/analyze-resume-text`,
    { text },
    { timeout: 30_000 }
  );
  return response.data;
}

// ── controllers ────────────────────────────────────────────────────────────

/**
 * POST /api/resume/analyze
 * Accepts a multipart/form-data file upload (field name: "resume").
 * Returns analysis: score, skills_detected, skills_missing, suggested_roles.
 */
exports.analyzeResume = asyncHandler(async (req, res) => {
  if (!req.file) {
    return sendError(res, "No file uploaded. Please attach a resume file.", 400, "NO_FILE");
  }

  const { buffer, mimetype, originalname } = req.file;

  let analysisData;

  // Try to send the file directly to the NLP service
  try {
    analysisData = await analyzeViaService(buffer, originalname, mimetype);
  } catch (serviceErr) {
    // NLP service unavailable or rejected file type — fall back to local extraction
    console.warn(
      "[RESUME] NLP service file upload failed, using text fallback:",
      serviceErr.message
    );
    try {
      analysisData = await analyzeViaTextFallback(buffer, mimetype, originalname);
    } catch (fallbackErr) {
      return sendError(
        res,
        fallbackErr.message || "Failed to analyse resume",
        422,
        "ANALYSIS_FAILED"
      );
    }
  }

  // Persist the result
  const saved = await ResumeAnalysis.create({
    studentId: req.user.id,
    resumeScore: analysisData.resume_score,
    skillsDetected: analysisData.skills_detected || [],
    skillsMissing: analysisData.skills_missing || [],
    suggestedRoles: analysisData.suggested_roles || [],
    rawText: analysisData.raw_text_preview || "",
  });

  sendSuccess(
    res,
    {
      analysisId: saved._id,
      resumeScore: saved.resumeScore,
      skillsDetected: saved.skillsDetected,
      skillsMissing: saved.skillsMissing,
      suggestedRoles: saved.suggestedRoles,
      wordCount: analysisData.word_count || 0,
      analysedAt: saved.createdAt,
    },
    "Resume analysed successfully",
    201
  );
});

/**
 * GET /api/resume/history
 * Returns the authenticated student's past resume analyses (paginated).
 */
exports.getHistory = asyncHandler(async (req, res) => {
  const {
    page = PAGINATION.DEFAULT_PAGE,
    limit = PAGINATION.DEFAULT_LIMIT,
  } = req.query;

  const validLimit = Math.min(Number(limit), PAGINATION.MAX_LIMIT);
  const skip = (Number(page) - 1) * validLimit;

  const [analyses, total] = await Promise.all([
    ResumeAnalysis.find({ studentId: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(validLimit)
      .lean(),
    ResumeAnalysis.countDocuments({ studentId: req.user.id }),
  ]);

  sendPaginated(res, analyses, total, page, validLimit, "Resume history retrieved");
});

/**
 * GET /api/resume/history/:id
 * Returns a single analysis result (only the owner can view it).
 */
exports.getAnalysis = asyncHandler(async (req, res) => {
  const analysis = await ResumeAnalysis.findById(req.params.id).select("+rawText");

  if (!analysis) {
    return sendError(res, "Analysis not found", 404, "NOT_FOUND");
  }

  if (analysis.studentId.toString() !== req.user.id && req.user.role !== "admin") {
    return sendError(res, "Access denied", 403, "FORBIDDEN");
  }

  sendSuccess(res, analysis);
});
