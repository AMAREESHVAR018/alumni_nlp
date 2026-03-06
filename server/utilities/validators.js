/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean}
 */
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} { valid: boolean, errors: Array<string> }
 */
const validatePassword = (password) => {
  const errors = [];

  if (!password) {
    errors.push("Password is required");
  } else {
    if (password.length < 6) {
      errors.push("Password must be at least 6 characters");
    }
    if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter");
    }
    if (!/[0-9]/.test(password)) {
      errors.push("Password must contain at least one number");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Validate question text
 * @param {string} text - Question text
 * @returns {Object} { valid: boolean, error: string|null }
 */
const validateQuestionText = (text) => {
  if (!text || text.trim().length === 0) {
    return { valid: false, error: "Question text is required" };
  }

  if (text.trim().length < 10) {
    return { valid: false, error: "Question must be at least 10 characters" };
  }

  if (text.length > 5000) {
    return { valid: false, error: "Question cannot exceed 5000 characters" };
  }

  // Reject common XSS / script-injection patterns
  if (/<script[\s\S]*?>|javascript\s*:|on\w+\s*=/i.test(text)) {
    return { valid: false, error: "Question contains disallowed content" };
  }

  return { valid: true, error: null };
};

/**
 * Validate answer text
 * @param {string} text - Answer text
 * @returns {Object} { valid: boolean, error: string|null }
 */
const validateAnswerText = (text) => {
  if (!text || text.trim().length === 0) {
    return { valid: false, error: "Answer text is required" };
  }

  if (text.trim().length < 20) {
    return { valid: false, error: "Answer must be at least 20 characters" };
  }

  if (text.length > 10000) {
    return { valid: false, error: "Answer cannot exceed 10000 characters" };
  }

  // Reject common XSS / script-injection patterns
  if (/<script[\s\S]*?>|javascript\s*:|on\w+\s*=/i.test(text)) {
    return { valid: false, error: "Answer contains disallowed content" };
  }

  return { valid: true, error: null };
};

/**
 * Validate job post data
 * @param {Object} jobData - Job data object
 * @returns {Object} { valid: boolean, errors: Array<string> }
 */
const validateJobPost = (jobData) => {
  const errors = [];

  if (!jobData.title || jobData.title.trim().length === 0) {
    errors.push("Job title is required");
  }

  if (!jobData.company || jobData.company.trim().length === 0) {
    errors.push("Company name is required");
  }

  if (!jobData.description || jobData.description.trim().length === 0) {
    errors.push("Job description is required");
  }

  if (!jobData.deadline) {
    errors.push("Application deadline is required");
  } else if (new Date(jobData.deadline) <= new Date()) {
    errors.push("Deadline must be in the future");
  }

  if (!jobData.employment_type || 
      !["internship", "full-time", "contract"].includes(jobData.employment_type)) {
    errors.push("Valid employment type is required");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Validate job application data
 * @param {Object} appData - Application data
 * @returns {Object} { valid: boolean, errors: Array<string> }
 */
const validateJobApplication = (appData) => {
  const errors = [];

  if (!appData.resume_link || appData.resume_link.trim().length === 0) {
    errors.push("Resume link is required");
  } else {
    try {
      new URL(appData.resume_link);
    } catch {
      errors.push("Resume link must be a valid URL");
    }
  }

  if (appData.cover_letter && appData.cover_letter.length > 5000) {
    errors.push("Cover letter cannot exceed 5000 characters");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Escape special regex characters to prevent ReDoS attacks
 * @param {string} str - Input string from user
 * @returns {string} Escaped string safe for use in $regex queries
 */
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

module.exports = {
  validateEmail,
  validatePassword,
  validateQuestionText,
  validateAnswerText,
  validateJobPost,
  validateJobApplication,
  escapeRegex,
};
