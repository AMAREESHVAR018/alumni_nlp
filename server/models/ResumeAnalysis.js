const mongoose = require("mongoose");

const resumeAnalysisSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  resumeScore: {
    type: Number,
    required: true,
  },
  skillsDetected: {
    type: [String],
    default: [],
  },
  skillsMissing: {
    type: [String],
    default: [],
  },
  suggestedRoles: {
    type: [String],
    default: [],
  },
  rawText: {
    type: String,
    select: false // Avoid sending raw text on standard queries to save bandwidth
  }
}, { timestamps: true });

module.exports = mongoose.model("ResumeAnalysis", resumeAnalysisSchema);
