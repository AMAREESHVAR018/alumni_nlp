const router = require("express").Router();
const { authenticate, authorize } = require("../middleware/auth");
const {
  ask,
  answer,
  getQuestion,
  getAllQuestions,
  getMyQuestions,
  assignQuestion,
  markHelpful,
  searchQuestions,
} = require("../controllers/questionController");

// Ask a question (students)
router.post("/", authenticate, ask);

// Search questions by text — must come BEFORE /:id to avoid route shadowing
router.get("/search", searchQuestions);

// Get all questions (with filters) — public
router.get("/all", getAllQuestions);

// Get questions for current user
router.get("/my-questions", authenticate, getMyQuestions);

// Get question by ID — public (view tracking)
router.get("/:id", getQuestion);

// Answer a question (alumni only)
router.post("/:id/answer", authenticate, authorize(["alumni"]), answer);

// Assign question to alumni (admin only)
router.post("/:id/assign", authenticate, authorize(["admin"]), assignQuestion);

// Mark question as helpful — requires auth to prevent anonymous spam votes
router.post("/:id/helpful", authenticate, markHelpful);

module.exports = router;
