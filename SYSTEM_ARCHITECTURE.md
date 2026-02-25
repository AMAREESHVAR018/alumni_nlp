# System Architecture & Design Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Data Flow](#data-flow)
4. [Entity-Relationship Model](#entity-relationship-model)
5. [NLP Workflow](#nlp-workflow)
6. [Technology Stack](#technology-stack)
7. [Module Description](#module-description)

---

## System Overview

### Project Name
**NLP-Based Intelligent Alumni-Student Chat System with Automated Knowledge Management**

### Objective
Develop an intelligent platform that automatically matches student questions to alumni answers using Natural Language Processing (NLP) and cosine similarity algorithms, reducing response time from days to milliseconds for 30-35% of questions.

### Key Features
- **Instant Answer Matching**: 384-dimensional semantic embeddings + cosine similarity
- **Smart Question Management**: Questions automatically categorized and prioritized
- **Alumni Network**: Alumni can answer questions and post job opportunities
- **Performance Analytics**: Admin dashboard with system metrics
- **Role-Based Access**: RBAC for Students, Alumni, and Admins
- **Rate Limiting**: Protection against abuse (5 policies)

### Scale Target
- **Phase 1** (Current): 10K questions
- **Phase 2** (6 months): 100K questions with Vector DB
- **Phase 3** (12 months): 1M+ questions globally

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                          │
│  Components: Auth, Questions, Jobs, Alumni, Dashboard Analytics │
└────────────┬──────────────────────────────────────────────────────┘
             │ HTTPS (JWT Authentication)
             ↓
┌─────────────────────────────────────────────────────────────────┐
│                  BACKEND (Node.js + Express)                     │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  API LAYER (Controllers)                                │  │
│  │  ├─ authController (register, login, auth middleware)   │  │
│  │  ├─ questionController (ask, answer, search questions)  │  │
│  │  ├─ jobController (post, apply for jobs)                │  │
│  │  └─ analyticsController (admin dashboard metrics)       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                         ↓                                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  BUSINESS LOGIC LAYER (Services)                        │  │
│  │  ├─ authService (authentication logic)                  │  │
│  │  ├─ questionService (NLP matching, similarity)          │  │
│  │  ├─ jobService (job management)                         │  │
│  │  └─ nlpService (embedding generation, retry logic)      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                         ↓                                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  UTILITY LAYER (Pure Functions)                         │  │
│  │  ├─ similarity.js (cosine similarity calculations)      │  │
│  │  ├─ validators.js (input validation)                    │  │
│  │  ├─ responseHandler.js (response formatting)            │  │
│  │  └─ errorHandler.js (centralized error handling)        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                         ↓                                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  DATA ACCESS LAYER (Models)                             │  │
│  │  ├─ User (students, alumni, admins)                     │  │
│  │  ├─ Question (with embeddings and similarity scores)    │  │
│  │  ├─ JobPost (job listings)                              │  │
│  │  └─ Application (job applications)                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                         ↓                                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  MIDDLEWARE                                              │  │
│  │  ├─ auth.js (JWT verification, role checking)           │  │
│  │  ├─ rateLimiter.js (5 rate limit policies)              │  │
│  │  ├─ errorHandler.js (centralized error handling)        │  │
│  │  └─ CORS (cross-origin requests)                        │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────┬──────────────────────────────────────────────┘
                  │
       ┌──────────┴──────────┬──────────────┐
       ↓                     ↓              ↓
┌──────────────┐      ┌──────────────┐  ┌──────────────┐
│  MongoDB     │      │ NLP Service  │  │   (Future)   │
│  (Questions, │      │  (Python)    │  │   Vector DB  │
│  Users, Jobs)│      │  for semantic│  │   (Pinecone) │
│              │      │  embeddings  │  │              │
└──────────────┘      └──────────────┘  └──────────────┘
```

---

## Data Flow

### Flow 1: Student Asks a Question (with NLP Matching)

```
1. STUDENT SUBMITS QUESTION
   │
   ├─ Input: { question_text, category, domain }
   ├─ Authentication: JWT token verified
   └─ Validation: Text length 10-5000 characters

2. CONTROLLER PROCESSING (questionController.ask)
   │
   └─ Call: askQuestion(studentId, text, category, domain)

3. SERVICE LAYER PROCESSING (questionService.askQuestion)
   │
   ├─ Step 1: Validate input (defensive check)
   │
   ├─ Step 2: Call NLP service
   │  ├─ Input: Question text
   │  ├─ Model: all-MiniLM-L6-v2
   │  ├─ Output: 384-dimensional embedding vector
   │  ├─ Retry: 2x with exponential backoff on failure
   │  ├─ Timeout: 10 seconds
   │  └─ Graceful degradation: Continue without embedding if fails
   │
   ├─ Step 3: Query database for answered questions
   │  ├─ Filter: isAnswered=true, has answer_text, has embedding_vector
   │  ├─ Optimization: Use .lean() for read-only, select minimal fields
   │  ├─ Limit: 1000 questions (performance bound)
   │  └─ Result: Array of answered questions with embeddings
   │
   ├─ Step 4: Compute similarity scores
   │  ├─ For each answered question:
   │  │  └─ similarity_score = cosineSimilarity(newVector, answeredVector)
   │  ├─ Formula: (A·B) / (||A|| × ||B||)
   │  └─ Range: 0 (dissimilar) to 1 (identical)
   │
   ├─ Step 5: Find best match
   │  ├─ Select: Question with highest similarity score
   │  └─ Threshold: 0.80 (80% confidence)
   │
   ├─ Step 6: Decision Logic
   │  ├─ IF score >= 0.80:
   │  │  ├─ Status = "ANSWERED" ✓
   │  │  ├─ matched_question_id = matched question
   │  │  ├─ similarity_score = score
   │  │  └─ Return: Matched answer IMMEDIATELY
   │  │
   │  └─ ELSE:
   │     ├─ Status = "PENDING" ⧖
   │     ├─ Save to database
   │     └─ Assign to relevant alumni
   │
   └─ Step 7: Save to database
      └─ Question object with all fields

4. CONTROLLER RESPONSE
   │
   └─ HTTP 201 Created
      ├─ IF matched: { status: 'answered', similarityScore: 0.92, matchedAnswer: '...' }
      └─ IF pending: { status: 'pending', message: 'Assigned to alumni' }

5. CLIENT RECEIVES
   │
   ├─ IF matched: Shows answer immediately ✓
   └─ IF pending: Shows "waiting for response" ⧖
```

### Flow 2: Admin Views Analytics

```
1. ADMIN REQUESTS DASHBOARD
   │
   └─ GET /api/analytics/dashboard (JWT verified, admin role checked)

2. ANALYTICS SERVICE
   │
   ├─ Count total users (parallel queries)
   ├─ Count students, alumni, admins
   ├─ Count total questions
   ├─ Count pending, answered, assigned questions
   ├─ Count auto-resolved questions (matched_question_id exists)
   ├─ Calculate statistics:
   │  ├─ Resolution rate: answered / total
   │  ├─ Auto-resolution rate: auto-resolved / total
   │  └─ Average similarity score: mean of all similarity_score values
   │
   └─ Return aggregated metrics

3. RESPONSE FORMAT
   │
   └─ {
        userMetrics: { totalUsers, totalStudents, totalAlumni, ratio },
        questionMetrics: { total, pending, answered, resolutionRate, autoResolvedCount },
        systemHealth: { status, uptime, timestamp }
      }
```

---

## Entity-Relationship Model

### User Entity
```javascript
{
  _id: ObjectId,
  name: String,              // Full name
  email: String (unique),    // Email
  password: Hash,            // bcrypt hash (10 rounds)
  role: Enum{student, alumni, admin},
  university: String,
  batch: Number,             // Graduation year
  
  // Alumni specific fields
  company: String,           // Current company
  position: String,          // Job title
  skills: [String],          // Array of skills
  
  createdAt: Date,
  updatedAt: Date
}
```

### Question Entity
```javascript
{
  _id: ObjectId,
  student_id: ObjectId (ref: User),     // Who asked
  question_text: String,                // 10-5000 characters
  embedding_vector: [Number] (384-dim), // NLP embedding (nullable)
  
  // Answering
  answer_text: String (nullable),       // Alumni answer
  answered_by: ObjectId (ref: User, nullable),
  assigned_to: ObjectId (ref: User, nullable),
  
  // NLP Matching
  status: Enum{pending, assigned, answered},
  isAnswered: Boolean,
  similarity_score: Number (nullable),        // 0-1 range
  matched_question_id: ObjectId (nullable),   // If matched
  
  // Metadata
  category: String,                    // e.g., "Interview"
  domain: String,                      // e.g., "Software Engineering"
  
  // Engagement metrics
  helpful_count: Number,
  views: Number,
  
  createdAt: Date,
  updatedAt: Date
}
```

### JobPost Entity
```javascript
{
  _id: ObjectId,
  alumni_id: ObjectId (ref: User),     // Who posted
  
  // Job details
  title: String,                        // Job title
  company: String,
  description: String,
  location: String,
  employment_type: Enum{internship, full-time, contract},
  experience_level: Enum{entry, mid, senior},
  
  // Requirements
  skills_required: [String],
  
  // Compensation
  salary_min: Number (nullable),
  salary_max: Number (nullable),
  
  // Application link
  link: String (URL),
  
  // Engagement
  views: Number,
  applications_count: Number,
  
  createdAt: Date,
  updatedAt: Date
}
```

### Application Entity
```javascript
{
  _id: ObjectId,
  job_id: ObjectId (ref: JobPost),
  student_id: ObjectId (ref: User),
  
  status: Enum{pending, reviewed, shortlisted, rejected, accepted},
  resume_url: String,
  cover_letter: String (nullable),
  
  createdAt: Date,
  updatedAt: Date
}
```

### Relationships Diagram
```
User (Student)
  ├─── asks ──→ [1..n] Question
  ├─── applies for ──→ [0..n] Application
  └─── receives ──→ [0..n] Answer (via Question.answered_by)

User (Alumni)
  ├─── answers ──→ [0..n] Question
  ├─── posts ──→ [0..n] JobPost
  └─── assigned to ──→ [0..n] Question (to answer)

User (Admin)
  └─── views ──→ Analytics

Question
  ├─── matches ──→ [0..1] Question (via matched_question_id)
  ├─── has ──→ [0..1] NLP Embedding (384-dim vector)
  └─── categorized as ──→ Category

JobPost
  ├─── receives ──→ [0..n] Application
  └─── posted by ──→ User (Alumni)
```

---

## NLP Workflow

### Detailed NLP Question Matching Flow

```
STEP 1: QUESTION SUBMISSION
═════════════════════════════
Input: "How do I prepare for PM interviews?"
↓
STEP 2: VALIDATION
═════════════════════════════
✓ Length: 10-5000 chars
✓ No empty/whitespace
✓ User authenticated
↓
STEP 3: NLP SERVICE CALL
═════════════════════════════
URL: http://localhost:5001/api/embeddings
Method: POST
Payload: { text: "How do I prepare for PM interviews?" }

Retry Logic:
├─ Attempt 1: ────────→ [Timeout 10s]
├─ Wait 500ms | If fails
├─ Attempt 2: ────────→ [Timeout 10s]
└─ Wait 1000ms | If fails → Graceful degradation

Response: {
  embedding: [0.12, -0.45, ..., -0.23],  // 384 numbers
  model: "all-MiniLM-L6-v2",
  dimensions: 384
}
↓
STEP 4: DATABASE QUERY
═════════════════════════════
Query: Find all answered questions with embeddings

SELECT question_text, answer_text, embedding_vector, helpful_count
FROM questions
WHERE isAnswered = true 
  AND answer_text IS NOT NULL
  AND embedding_vector IS NOT NULL
LIMIT 1000;

Result: ~150-800 questions (depending on system state)
↓
STEP 5: SIMILARITY COMPUTATION
═════════════════════════════
For each answered question:
  similarity = cosineSimilarity(newEmbedding, answeredEmbedding)

Formula Breakdown:
  A = [0.12, -0.45, ..., -0.23]  (new question vector)
  B = [0.11, -0.44, ..., -0.24]  (answered question vector)
  
  A·B = 0.12*0.11 + (-0.45)*(-0.44) + ... = 0.8742
  ||A|| = √(0.12² + (-0.45)² + ... + (-0.23)²) = 1.0000 (normalized)
  ||B|| = √(0.11² + (-0.44)² + ... + (-0.24)²) = 1.0000 (normalized)
  
  similarity = 0.8742 / (1.0000 × 1.0000) = 0.8742 = 87.42%

Result: Array of { questionId, text, score, helpful, views }
Sorted descending by score
↓
STEP 6: THRESHOLD CHECK
═════════════════════════════
Best match score: 0.8742
Threshold: 0.80

IF 0.8742 >= 0.80: ✓ MATCH FOUND
  ├─ Question status = "answered"
  ├─ matched_question_id = matched question ID
  ├─ similarity_score = 0.8742
  └─ Return: Matched answer text immediately

ELSE: ✗ NO MATCH
  ├─ Question status = "pending"
  ├─ matched_question_id = null
  ├─ Save to database
  └─ Assign to alumni for manual response
↓
STEP 7: LOGGING & METRICS
═════════════════════════════
Log entry (to console/monitoring system):

[QUESTION] SIMILARITY MATCH FOUND:
  Score: 0.8742 (threshold: 0.80)
  Matched Question: "PM interview prep tips - 50 chars..."
  Comparison Time: 234ms for 500 questions
  Helpful Count: 42
  Views: 256
  Processing Time: 650ms total
  Embedding Time: 180ms
↓
STEP 8: CLIENT RESPONSE
═════════════════════════════
HTTP 201 Created
{
  success: true,
  message: "Found similar answer with 87.4% match",
  data: {
    questionId: "507f1f77bcf86cd799439011",
    status: "answered",
    matched: true,
    similarityScore: 0.8742,
    matchedQuestionId: "507f1f77bcf86cd799439010",
    matchedAnswer: "Here's how to ace PM interviews: 1. Study case studies..."
  }
}
```

---

## Technology Stack

### Backend
| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Runtime | Node.js | 18+ | JavaScript runtime |
| Framework | Express | 5.2.1 | HTTP server & routing |
| Database | MongoDB | 7.1.0 | NoSQL document store |
| ODM | Mongoose | 9.2.1 | MongoDB schema & queries |
| Authentication | JWT | 9.0.3 | Stateless authentication |
| Password Hashing | bcryptjs | 3.0.3 | Secure password storage |
| Environment | dotenv | 16.0.0 | Environment variables |
| HTTP Client | Axios | 1.13.5 | NLP service calls |
| CORS | cors | 2.8.5 | Cross-origin requests |
| Validation | Custom | - | Input validation (built-in) |
| Error Handling | Custom | - | Centralized error handler |
| Rate Limiting | Custom | - | In-memory rate limiting |

### Frontend
| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| UI Framework | React | 18+ | Component-based UI |
| Build Tool | Create React App | 5.0+ | Project setup & bundling |
| Routing | React Router | 6+ | Client-side routing |
| State Management | Context API | - | Global state management |
| HTTP Client | Axios | 1.13.5 | API calls |
| Styling | Tailwind CSS | 3+ | Utility-first CSS |
| Authentication | JWT tokens | - | Client token storage |

### NLP Service
| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Runtime | Python | 3.10+ | Python runtime |
| Framework | Flask | 3.0+ | HTTP API |
| NLP Model | Sentence Transformers | 2.2.1 | Embedding generation |
| Model | all-MiniLM-L6-v2 | - | 384-dimensional embeddings |

### DevOps
| Component | Technology | Purpose |
|-----------|-----------|---------|
| Containerization | Docker | Isolated environments |
| Orchestration | Docker Compose | Multi-container setup |
| Database Hosting | MongoDB Atlas | Managed MongoDB |
| Deployment | AWS/Heroku/DigitalOcean | Cloud hosting |

---

## Module Description

### Backend Modules

1. **Authentication Module** (`authController.js`, `authService.js`)
   - User registration with role selection
   - Login with JWT token generation
   - Password hashing via bcryptjs
   - Token verification middleware

2. **Question Management Module** (`questionController.js`, `questionService.js`)
   - Ask questions with NLP embedding
   - Cosine similarity matching
   - Answer questions (alumni only)
   - Mark questions as helpful
   - Search and filter questions

3. **Job Management Module** (`jobController.js`, `jobService.js`)
   - Post job opportunities (alumni)
   - Apply for jobs (students)
   - Track applications
   - Search jobs by criteria

4. **Analytics Module** (`analyticsRoutes.js`)
   - System metrics dashboard
   - Similarity matching analytics
   - Performance metrics
   - Data export (JSON/CSV)

5. **NLP Module** (`nlpService.js`)
   - Generate embeddings via Python service
   - Retry logic with exponential backoff
   - Timeout handling (10 seconds)
   - Graceful degradation on failures

6. **Utility Modules**
   - `similarity.js`: Pure cosine similarity math
   - `validators.js`: Input validation rules
   - `responseHandler.js`: Consistent response formatting
   - `errorHandler.js`: Centralized error handling

### Database Models

1. **User Model**
   - Authentication credentials
   - Profile information
   - Role and permissions
   - Alumni-specific data (company, skills)

2. **Question Model**
   - Question text and metadata
   - NLP embedding vector (384-dim)
   - Similarity matching results
   - Categorization and tags
   - Engagement metrics

3. **JobPost Model**
   - Job details and requirements
   - Salary range
   - Skills needed
   - Application link

4. **Application Model**
   - Job application tracking
   - Applicant information
   - Application status
   - Resume and cover letter

---

## Performance Characteristics

### Question Asking Latency
- **Embedding Generation**: 100-200ms (NLP service)
- **Database Query**: 50-100ms (MongoDB)
- **Similarity Computation**: 100-500ms (depends on question count)
- **Database Write**: 20-50ms
- **Total**: 500-800ms (acceptable)

### Scaling Limits
- **Phase 1** (Current): 10K questions max
- **Phase 2** (Vector DB): 100K-1M questions
- **Phase 3** (Distributed): 10M+ questions

---

## Future Enhancements

1. **Vector Database Integration** (Phase 2)
   - Use Pinecone/Weaviate for O(log n) search
   - Sub-50ms latency for 1M+ questions

2. **Advanced Analytics**
   - ML-based answer ranking
   - Trending topics detection
   - Alumni performance metrics

3. **Recommendation Engine**
   - Personalized alma recommendations
   - Question routing based on alumni expertise

4. **Real-time Chat**
   - WebSocket-based messaging
   - Live notifications

5. **Multi-language Support**
   - Question translation
   - Multi-lingual embeddings

---

## Conclusion

This architecture provides a scalable, maintainable foundation for an intelligent alumni-student platform. The separation of concerns (Controllers → Services → Models), combined with efficient NLP matching, enables both rapid iteration and production-grade reliability.

The modular design allows for smooth scaling from 10K to 1M+ questions through strategic technology upgrades (Vector DB, caching, distributed systems) without requiring fundamental architectural changes.
