/**
 * =====================================================
 * API DOCUMENTATION
 * NLP-Based Intelligent Alumni-Student Chat System
 * =====================================================
 * 
 * Version: 1.0.0
 * Base URL: http://localhost:5000/api
 * 
 * This document describes all available API endpoints,
 * their parameters, responses, and examples.
 */

// =====================================================
// AUTHENTICATION ENDPOINTS
// =====================================================

/**
 * POST /auth/register
 * Register a new user (student or alumni)
 * 
 * Rate Limit: 3 attempts per hour
 * 
 * Request Body:
 * {
 *   "name": "John Doe",
 *   "email": "john@example.com",
 *   "password": "SecurePass123!",
 *   "role": "student" | "alumni",
 *   "batch": 2020,                  // For alumni
 *   "company": "Tech Corp",         // For alumni
 *   "position": "Senior Engineer",  // For alumni
 *   "skills": ["Python", "Node.js"] // For alumni
 * }
 * 
 * Response (201 Created):
 * {
 *   "success": true,
 *   "message": "User registered successfully",
 *   "data": {
 *     "userId": "507f1f77bcf86cd799439011",
 *     "email": "john@example.com",
 *     "role": "student"
 *   }
 * }
 * 
 * Error (400/409):
 * {
 *   "success": false,
 *   "message": "Email already exists",
 *   "code": "USER_EXISTS"
 * }
 */

/**
 * POST /auth/login
 * Authenticate user and get JWT token
 * 
 * Rate Limit: 5 attempts per 15 minutes
 * 
 * Request Body:
 * {
 *   "email": "john@example.com",
 *   "password": "SecurePass123!"
 * }
 * 
 * Response (200 OK):
 * {
 *   "success": true,
 *   "message": "Login successful",
 *   "data": {
 *     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *     "user": {
 *       "userId": "507f1f77bcf86cd799439011",
 *       "email": "john@example.com",
 *       "role": "student"
 *     },
 *     "expiresIn": "7d"
 *   }
 * }
 * 
 * Error (401):
 * {
 *   "success": false,
 *   "message": "Invalid credentials",
 *   "code": "INVALID_CREDENTIALS"
 * }
 */

// =====================================================
// QUESTION ENDPOINTS
// =====================================================

/**
 * POST /questions
 * Ask a new question (NLP similarity matching enabled)
 * 
 * Rate Limit: 20 per 10 minutes
 * Authentication: Required (student)
 * 
 * WORKFLOW:
 * 1. Student submits question text
 * 2. System generates embedding using NLP service
 * 3. Compares against all answered questions
 * 4. If similarity score > 0.80:
 *    - Returns matched answer immediately
 *    - Marks question as "answered"
 * 5. Else:
 *    - Saves question as "pending"
 *    - Assigns to relevant alumni for response
 * 
 * Request Headers:
 * {
 *   "Authorization": "Bearer <jwt_token>"
 * }
 * 
 * Request Body:
 * {
 *   "question_text": "How do I prepare for product management interviews?",
 *   "category": "Interview",  // See CATEGORIES below
 *   "domain": "Product Management"
 * }
 * 
 * CATEGORIES:
 * - "Career Path"
 * - "Skills"
 * - "Job Search"
 * - "Interview"
 * - "Education"
 * - "Internship"
 * - "Project Help"
 * - "Other"
 * 
 * Response (201 Created):
 * {
 *   "success": true,
 *   "message": "Question matched with existing answer!",
 *   "data": {
 *     "questionId": "507f1f77bcf86cd799439011",
 *     "studentName": "John Doe",
 *     "questionText": "How do I prepare for PM interviews?",
 *     "status": "answered",
 *     "matched": true,
 *     "similarityScore": 0.92,
 *     "matchedAnswer": "Here's how to prepare for PM interviews...",
 *     "matchedQuestionId": "507f1f77bcf86cd799439012"
 *   }
 * }
 * 
 * Response (201 When No Match):
 * {
 *   "success": true,
 *   "message": "Question saved. Pending alumni response.",
 *   "data": {
 *     "questionId": "507f1f77bcf86cd799439011",
 *     "status": "pending",
 *     "matched": false,
 *     "message": "Your question has been assigned to relevant alumni."
 *   }
 * }
 * 
 * Error (422):
 * {
 *   "success": false,
 *   "message": "Question text must be between 10 and 5000 characters",
 *   "code": "VALIDATION_ERROR"
 * }
 * 
 * SIMILARITY MATCHING ALGORITHM:
 * 1. Input text → NLP Service (all-MiniLM-L6-v2 model)
 * 2. Returns 384-dimensional embedding vector
 * 3. Query: Fetch all answered questions with embeddings
 * 4. For each answered question:
 *    - Calculate cosine similarity between vectors
 *    - Formula: (A·B) / (||A|| × ||B||)
 *    - Range: 0 (dissimilar) to 1 (identical)
 * 5. Select highest scoring match
 * 6. If score ≥ 0.80: Return matched answer
 * 7. Else: Save as pending
 * 
 * PERFORMANCE NOTES:
 * - NLP embedding: ~100-200ms (with 2x retry on failure)
 * - Database query: ~50-100ms
 * - Similarity computation: ~100-500ms (depends on answered questions count)
 * - Total: ~500-800ms average
 * 
 * SCALABILITY:
 * - Current: Compares against up to 1000 answered questions
 * - Future: Vector database (Pinecone/Weaviate) for 1M+ scale
 * - Future: Redis caching to skip redundant computations
 */

/**
 * GET /questions/:questionId
 * Get details of a specific question
 * 
 * Authentication: Required
 * 
 * Response (200 OK):
 * {
 *   "success": true,
 *   "message": "Question retrieved successfully",
 *   "data": {
 *     "questionId": "507f1f77bcf86cd799439011",
 *     "studentName": "John Doe",
 *     "questionText": "How do I prepare for PM interviews?",
 *     "category": "Interview",
 *     "status": "answered",
 *     "answer": "Here's how to prepare...",
 *     "answeredBy": "Jane Smith",
 *     "createdAt": "2024-02-25T10:00:00Z",
 *     "viewsCount": 42,
 *     "helpfulCount": 15
 *   }
 * }
 */

/**
 * GET /questions
 * Search and filter questions
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Results per page (default: 10, max: 100)
 * - category: Filter by category
 * - status: Filter by status (pending/answered/assigned)
 * - domain: Filter by domain
 * - search: Full-text search in question text
 * 
 * Example: GET /questions?category=Interview&status=answered&page=1&limit=20
 * 
 * Response (200 OK):
 * {
 *   "success": true,
 *   "message": "Questions retrieved successfully",
 *   "data": [
 *     {
 *       "questionId": "507f1f77bcf86cd799439011",
 *       "questionText": "How do I prepare for PM interviews?",
 *       "category": "Interview",
 *       "status": "answered",
 *       "helpfulCount": 15
 *     }
 *   ],
 *   "pagination": {
 *     "page": 1,
 *     "limit": 20,
 *     "total": 150,
 *     "pages": 8
 *   }
 * }
 */

/**
 * POST /questions/:questionId/answer
 * Answer a pending question (alumni only)
 * 
 * Authentication: Required (alumni)
 * Authorization: Must be assigned to question
 * 
 * Request Body:
 * {
 *   "answer_text": "Here's a detailed answer to your question..."
 * }
 * 
 * Response (200 OK):
 * {
 *   "success": true,
 *   "message": "Question answered successfully",
 *   "data": {
 *     "questionId": "507f1f77bcf86cd799439011",
 *     "status": "answered",
 *     "answeredBy": "Jane Smith"
 *   }
 * }
 */

/**
 * POST /questions/:questionId/helpful
 * Mark question as helpful
 * 
 * Authentication: Required
 * 
 * Response (200 OK):
 * {
 *   "success": true,
 *   "message": "Marked as helpful",
 *   "data": {
 *     "helpfulCount": 16
 *   }
 * }
 */

/**
 * GET /questions/my/questions
 * Get all questions asked by current user
 * 
 * Authentication: Required
 * Query Parameters:
 * - page: Page number
 * - limit: Results per page
 * 
 * Response (200 OK):
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "questionId": "507f1f77bcf86cd799439011",
 *       "questionText": "...",
 *       "status": "answered",
 *       "createdAt": "2024-02-25T10:00:00Z"
 *     }
 *   ],
 *   "pagination": { ... }
 * }
 */

// =====================================================
// JOB ENDPOINTS
// =====================================================

/**
 * POST /jobs
 * Post a new job opportunity (alumni only)
 * 
 * Rate Limit: 10 per 10 minutes
 * Authentication: Required (alumni)
 * 
 * Request Body:
 * {
 *   "title": "Senior Software Engineer",
 *   "company": "Tech Corp",
 *   "description": "We are looking for...",
 *   "location": "San Francisco, CA",
 *   "employment_type": "full-time" | "internship" | "contract",
 *   "experience_level": "senior" | "mid" | "entry",
 *   "skills_required": ["Python", "AWS", "Docker"],
 *   "salary_min": 150000,
 *   "salary_max": 200000,
 *   "link": "https://apply.techcorp.com/job/123"
 * }
 * 
 * Response (201 Created):
 * {
 *   "success": true,
 *   "message": "Job posted successfully",
 *   "data": {
 *     "jobId": "507f1f77bcf86cd799439011",
 *     "title": "Senior Software Engineer",
 *     "postedBy": "Jane Smith",
 *     "createdAt": "2024-02-25T10:00:00Z"
 *   }
 * }
 */

/**
 * GET /jobs
 * Get all job postings
 * 
 * Query Parameters:
 * - page: Page number
 * - limit: Results per page
 * - company: Filter by company
 * - experience_level: Filter by level
 * - employment_type: Filter by type
 * 
 * Response (200 OK):
 * {
 *   "success": true,
 *   "data": [ ... ],
 *   "pagination": { ... }
 * }
 */

/**
 * POST /jobs/:jobId/apply
 * Apply for a job (student only)
 * 
 * Authentication: Required (student)
 * 
 * Request Body:
 * {
 *   "resume_url": "https://storage.example.com/resume.pdf",
 *   "cover_letter": "I am interested in this position..."
 * }
 * 
 * Response (201 Created):
 * {
 *   "success": true,
 *   "message": "Application submitted",
 *   "data": {
 *     "applicationId": "507f1f77bcf86cd799439011",
 *     "status": "pending"
 *   }
 * }
 */

// =====================================================
// ANALYTICS ENDPOINTS (ADMIN ONLY)
// =====================================================

/**
 * GET /analytics/dashboard
 * Get system overview metrics
 * 
 * Authentication: Required (admin)
 * 
 * Response (200 OK):
 * {
 *   "success": true,
 *   "data": {
 *     "userMetrics": {
 *       "totalUsers": 500,
 *       "totalStudents": 400,
 *       "totalAlumni": 100,
 *       "studentAlumniRatio": 4.0
 *     },
 *     "questionMetrics": {
 *       "totalQuestions": 1200,
 *       "pendingQuestions": 150,
 *       "answeredQuestions": 1050,
 *       "resolutionRate": "87.5%",
 *       "autoResolvedCount": 385,
 *       "autoResolutionRate": "32.08%",
 *       "averageSimilarityScore": 0.87
 *     },
 *     "systemHealth": {
 *       "status": "operational",
 *       "uptime": 123456,
 *       "timestamp": "2024-02-25T10:00:00Z"
 *     }
 *   }
 * }
 */

/**
 * GET /analytics/similarity-matches
 * Get detailed similarity matching analytics
 * 
 * Authentication: Required (admin)
 * Query Parameters:
 * - page: Page number
 * - limit: Results per page
 * - threshold: Minimum similarity score (0-1)
 * 
 * Response (200 OK):
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "questionId": "507f1f77bcf86cd799439011",
 *       "studentName": "John Doe",
 *       "questionText": "How do I prepare for PM interviews?",
 *       "matchedQuestionId": "507f1f77bcf86cd799439012",
 *       "matchedQuestionText": "PM interview prep tips?",
 *       "matchedAnswer": "Here's what I recommend...",
 *       "similarityScore": 0.92,
 *       "category": "Interview",
 *       "createdAt": "2024-02-25T10:00:00Z"
 *     }
 *   ],
 *   "pagination": { ... }
 * }
 */

/**
 * GET /analytics/performance
 * Get system performance metrics
 * 
 * Authentication: Required (admin)
 * 
 * Response (200 OK):
 * {
 *   "success": true,
 *   "data": {
 *     "embeddingGeneration": {
 *       "avgTimeMs": 150,
 *       "p95TimeMs": 300,
 *       "p99TimeMs": 500,
 *       "successRate": "99.5%"
 *     },
 *     "databaseQueries": {
 *       "avgTimeMs": 50,
 *       "p95TimeMs": 150,
 *       "p99TimeMs": 300
 *     },
 *     "similarityMatching": {
 *       "avgTimeMs": 200,
 *       "p95TimeMs": 400,
 *       "matchRate": "35%"
 *     },
 *     "systemOverhead": {
 *       "avgMemoryUsageMb": 245.3,
 *       "cpuUsagePercent": "N/A"
 *     }
 *   }
 * }
 */

/**
 * GET /analytics/export
 * Export analytics data
 * 
 * Authentication: Required (admin)
 * Query Parameters:
 * - format: "json" or "csv" (default: json)
 * - type: "questions" or "matches" or "users" (default: questions)
 * 
 * Response:
 * - If format=json: Returns JSON data
 * - If format=csv: Returns CSV file download
 * 
 * Example: GET /analytics/export?format=csv&type=matches
 */

// =====================================================
// HEALTH & STATUS ENDPOINTS
// =====================================================

/**
 * GET /
 * Root health check
 * 
 * No authentication required
 * 
 * Response (200 OK):
 * {
 *   "success": true,
 *   "message": "Alumni NLP Backend Running",
 *   "timestamp": "2024-02-25T10:00:00Z",
 *   "version": "1.0.0"
 * }
 */

/**
 * GET /health
 * System health status
 * 
 * No authentication required
 * 
 * Response (200 OK):
 * {
 *   "success": true,
 *   "status": "healthy",
 *   "uptime": 123456,
 *   "environment": "production"
 * }
 */

// =====================================================
// ERROR RESPONSES
// =====================================================

/**
 * All error responses follow this format:
 * 
 * {
 *   "success": false,
 *   "message": "Human readable error message",
 *   "code": "ERROR_CODE",
 *   "statusCode": 400 | 401 | 403 | 404 | 422 | 500 | 503
 * }
 * 
 * Error Codes:
 * 
 * INVALID_CREDENTIALS (401)
 * - Invalid email or password
 * 
 * USER_EXISTS (409)
 * - User with this email already exists
 * 
 * USER_NOT_FOUND (404)
 * - User not found in system
 * 
 * UNAUTHORIZED (401)
 * - Missing or invalid JWT token
 * 
 * FORBIDDEN (403)
 * - User lacks permission for this action
 * 
 * VALIDATION_ERROR (422)
 * - Input validation failed
 * 
 * NOT_FOUND (404)
 * - Resource not found
 * 
 * NLP_ERROR (503)
 * - NLP service failed (question continues without matching)
 * 
 * INTERNAL_ERROR (500)
 * - Server error
 */

// =====================================================
// RATE LIMITING
// =====================================================

/**
 * Rate Limiting Policies:
 * 
 * 1. Login: 5 attempts per 15 minutes
 *    - Returns 429 when exceeded
 *    - Headers: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset
 * 
 * 2. Register: 3 attempts per hour
 * 
 * 3. Questions: 20 per 10 minutes
 * 
 * 4. Jobs: 10 per 10 minutes
 * 
 * 5. General API: 100 per 15 minutes
 * 
 * Rate Limit Response (429):
 * {
 *   "success": false,
 *   "message": "Rate limit exceeded. Try again in 600 seconds",
 *   "code": "RATE_LIMIT_EXCEEDED",
 *   "retryAfter": 600
 * }
 */

// =====================================================
// AUTHENTICATION
// =====================================================

/**
 * JWT Token Format:
 * 
 * Header: Bearer <token>
 * 
 * Example:
 * Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 * 
 * Token Expiry: 7 days
 * 
 * Payload includes:
 * - userId: User's unique identifier
 * - email: User's email
 * - role: User's role (student/alumni/admin)
 * - iat: Token issued at timestamp
 * - exp: Token expiration timestamp
 */

// =====================================================
// QUICK EXAMPLES
// =====================================================

// Example 1: Register and login
/*
POST /auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "role": "student"
}

POST /auth/login
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
// Returns: JWT token
*/

// Example 2: Ask a question with NLP matching
/*
POST /questions
Headers: Authorization: Bearer <token>
{
  "question_text": "How do I prepare for product management interviews?",
  "category": "Interview",
  "domain": "Product Management"
}
// Returns: Either matched answer (if similarity > 0.80) or pending status
*/

// Example 3: Get analytics (admin)
/*
GET /analytics/dashboard
Headers: Authorization: Bearer <admin_token>
// Returns: System metrics and analytics
*/

module.exports = {
  documentation: "API Documentation v1.0.0",
};
