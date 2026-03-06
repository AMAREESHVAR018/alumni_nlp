const express = require("express");
const multer = require("multer");

const { authenticate } = require("../middleware/auth");
const {
  analyzeResume,
  getHistory,
  getAnalysis,
} = require("../controllers/resumeController");

const router = express.Router();

// Multer: keep file in memory (max 5 MB), PDF / DOCX / TXT only
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    const allowed = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "text/plain",
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error("Invalid file type. Only PDF, DOCX, and TXT are allowed."),
        false
      );
    }
  },
});

// All resume routes require authentication
router.use(authenticate);

// POST /api/resume/analyze  — upload and analyse
router.post("/analyze", upload.single("resume"), analyzeResume);

// GET  /api/resume/history  — paginated history
router.get("/history", getHistory);

// GET  /api/resume/history/:id  — single analysis detail
router.get("/history/:id", getAnalysis);

module.exports = router;
