const express = require("express");
const { authenticate } = require("../middleware/auth");
const { getMentorRecommendations } = require("../controllers/mentorController");

const router = express.Router();

// Require authentication for mentor routes
router.use(authenticate);

// Route matches GET /api/mentors/recommendations/:studentId
router.get("/recommendations/:studentId", getMentorRecommendations);

module.exports = router;
