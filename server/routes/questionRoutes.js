const router = require("express").Router();
const { authenticate } = require("../middleware/auth");
const {
  ask,
  answer,
  getQuestion,
  getAllQuestions,
  getMyQuestions,
  assignQuestion,
  markHelpful
} = require("../controllers/questionController");

// Ask a question (students)
router.post("/", authenticate, ask);

// Get all questions (with filters)
router.get("/all", getAllQuestions);

// Get questions for current user
router.get("/my-questions", authenticate, getMyQuestions);

// Get question by ID
router.get("/:id", getQuestion);

// Answer a question (alumni assigned to question)
router.post("/:id/answer", authenticate, answer);

// Assign question to alumni (admin only middleware can be added)
router.post("/:id/assign", authenticate, assignQuestion);

// Mark question as helpful
router.post("/:id/helpful", markHelpful);

module.exports = router;
