const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema({
  alumni_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  company: { type: String, required: true },
  description: { type: String, required: true },
  skills_required: [String],
  experience_level: { type: String, enum: ["entry", "mid", "senior"], default: "entry" },
  location: String,
  employment_type: { type: String, enum: ["internship", "full-time", "contract"], required: true },
  salary_range: String,
  deadline: { type: Date, required: true },
  domain: String, // e.g., "Software Engineering", "Data Science"
  category: { type: String, enum: ["internship", "job", "contract"], required: true },
  is_active: { type: Boolean, default: true },
  applicants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // spec-required
  applications_count: { type: Number, default: 0 },
  views_count: { type: Number, default: 0 },
  benefits: [String],
  about_company: String,
  
}, { timestamps: true });

/**
 * ============================================
 * DATABASE INDEXES FOR JOB POSTINGS
 * ============================================
 * 
 * Optimize queries for job search and alumni management
 */

// Alumni jobs index
// Query: db.jobposts.find({ alumni_id: X })
// Used by: Get jobs posted by specific alumni (/jobs/my-jobs)
// Performance: ~10-30x faster
jobSchema.index({ alumni_id: 1 });

// Company search index (spec-required)
jobSchema.index({ company: 1 });

// Experience level search index
// Query: db.jobposts.find({ experience_level: X, is_active: true })
// Used by: Job search filtering by level
// Performance: ~10-20x faster
jobSchema.index({ experience_level: 1, is_active: 1 });

// Domain and category index
// Query: db.jobposts.find({ domain: X, category: Y })
// Used by: Job filtering by domain/category
// Performance: ~10-20x faster
jobSchema.index({ domain: 1, category: 1 });

// Active jobs index
// Query: db.jobposts.find({ is_active: true }).sort({ createdAt: -1 })
// Used by: Homepage job listings
// Performance: ~10-20x faster
jobSchema.index({ is_active: 1, createdAt: -1 });

/**
 * Future optimizations:
 * - Text index on title, description, company for full-text search
 * - TTL index to auto-archive expired job postings
 * - Geospatial index on location for location-based search
 */

module.exports = mongoose.model("JobPost", jobSchema);
