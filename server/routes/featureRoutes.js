const express = require("express");
const { authenticate } = require("../middleware/auth");
const {
  bookMentor,
  getRecommendations,
  getNotifications,
  getTrending,
  getAIAdvice,
  getInternshipRecommendations,
  getActivityFeed,
  getLeaderboard,
  getSkillMatches,
  getStats
} = require("../controllers/featureController");

const router = express.Router();

router.use(authenticate);

router.post("/book-mentor", bookMentor);
router.get("/recommendations", getRecommendations);
router.get("/notifications", getNotifications);
router.get("/trending", getTrending);
router.get("/ai-advice", getAIAdvice);
router.get("/internships", getInternshipRecommendations);
router.get("/activity", getActivityFeed);
router.get("/leaderboard", getLeaderboard);
router.get("/skill-matches", getSkillMatches);
router.get("/stats", getStats);

module.exports = router;
