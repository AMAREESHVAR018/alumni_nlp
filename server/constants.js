// User Roles
const USER_ROLES = {
  STUDENT: "student",
  ALUMNI: "alumni",
  ADMIN: "admin",
};

// Question Statuses
const QUESTION_STATUS = {
  PENDING: "pending",
  ASSIGNED: "assigned",
  ANSWERED: "answered",
};

// Question Categories
const QUESTION_CATEGORIES = [
  "Career Path",
  "Skills",
  "Job Search",
  "Interview",
  "Education",
  "Internship",
  "Project Help",
  "Other",
];

// Employment Types
const EMPLOYMENT_TYPES = {
  INTERNSHIP: "internship",
  FULL_TIME: "full-time",
  CONTRACT: "contract",
};

// Application Status
const APPLICATION_STATUS = {
  PENDING: "pending",
  REVIEWED: "reviewed",
  SHORTLISTED: "shortlisted",
  REJECTED: "rejected",
  ACCEPTED: "accepted",
};

// Experience Levels
const EXPERIENCE_LEVELS = {
  ENTRY: "entry",
  MID: "mid",
  SENIOR: "senior",
};

// NLP Configuration
const NLP_CONFIG = {
  SIMILARITY_THRESHOLD: parseFloat(process.env.SIMILARITY_THRESHOLD) || 0.80,
  MODEL: "all-MiniLM-L6-v2",
  EMBEDDING_DIMENSION: 384,
};

// Pagination
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
};

// JWT
const JWT_CONFIG = {
  EXPIRY: "7d",
  REFRESH_EXPIRY: "30d",
  ALGORITHM: "HS256",
};

// Error Codes
const ERROR_CODES = {
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  USER_EXISTS: "USER_EXISTS",
  USER_NOT_FOUND: "USER_NOT_FOUND",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  NOT_FOUND: "NOT_FOUND",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  NLP_ERROR: "NLP_ERROR",
  DATABASE_ERROR: "DATABASE_ERROR",
  JOB_NOT_FOUND: "JOB_NOT_FOUND",
  JOB_CLOSED: "JOB_CLOSED",
  APPLICATION_NOT_FOUND: "APPLICATION_NOT_FOUND",
  DUPLICATE_APPLICATION: "DUPLICATE_APPLICATION",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  INVALID_TOKEN: "INVALID_TOKEN",
};

module.exports = {
  USER_ROLES,
  QUESTION_STATUS,
  QUESTION_CATEGORIES,
  EMPLOYMENT_TYPES,
  APPLICATION_STATUS,
  EXPERIENCE_LEVELS,
  NLP_CONFIG,
  PAGINATION,
  JWT_CONFIG,
  ERROR_CODES,
};
