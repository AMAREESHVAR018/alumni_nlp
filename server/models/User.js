const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["student", "alumni", "admin"], required: true },
  
  // Profile fields for both
  bio: String,
  profilePicture: String,
  
  // Alumni-specific fields
  company: String,
  jobTitle: String,
  graduationYear: Number,
  domain: String, // e.g., "Software Engineering", "Data Science", "Product Management"
  skills: [String],
  yearsOfExperience: Number,
  linkedinUrl: String,
  
  // Student-specific fields
  currentYear: Number,
  university: String,
  targetRoles: [String],
  interests: [String],
  
  // General
  phone: String,
  isVerified: { type: Boolean, default: false },
  verificationToken: String,
  
}, { timestamps: true });

/**
 * ============================================
 * DATABASE INDEXES
 * ============================================
 * 
 * Indexes significantly improve query performance
 * Trade-off: Faster reads, slower writes, more storage
 * 
 * Creation strategy:
 * 1. Create during development: mongoose auto-creates indexes
 * 2. Production: Use explicit index creation scripts or MongoDB Atlas UI
 *    Command: db.users.createIndex({ email: 1 }, { unique: true })
 */

// CRITICAL: Email index (unique)
// Used by: Login queries (find user by email)
// Performance: Without index: O(n) scan, With index: O(log n) lookup
// Impact: ~100-200x faster for login
userSchema.index({ email: 1 }, { unique: true, sparse: true });

// Role index
// Used by: Alumni filtering, student filtering
// Performance: Makes role-based queries fast
// Impact: ~10-50x faster for role queries
userSchema.index({ role: 1 });

// Alumni domain index
// Used by: Finding experts in specific domains
// Performance: Fast domain-based alumni search
// Impact: ~10-30x faster for domain queries
userSchema.index({ domain: 1 });

/**
 * Future index considerations:
 * - Text index on bio + skills for full-text search
 * - Compound index (role, domain) for alumni filtering
 * - TTL index on verificationToken for token expiration
 */

module.exports = mongoose.model("User", userSchema);
