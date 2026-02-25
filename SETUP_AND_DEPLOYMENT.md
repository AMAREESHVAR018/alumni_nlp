# Production Setup & Installation Guide

## 📦 Installation Steps

### 1. Install New Dependencies

```bash
cd server
npm install helmet morgan
```

**What's being installed:**
- **helmet**: Security HTTP headers (XSS protection, clickjacking prevention, etc.)
- **morgan**: HTTP request logging middleware

### 2. Enable Production Middleware in app.js

Uncomment these lines in `server/app.js`:

```javascript
// BEFORE (commented):
// const helmet = require("helmet");
// const morgan = require("morgan");

// AFTER (uncommented):
const helmet = require("helmet");
const morgan = require("morgan");

// ... then in app.js:

app.use(helmet());
app.use(morgan("combined"));
```

### 3. Set Environment Variables

Create or update `.env` file in the `server` directory:

```env
# Server
NODE_ENV=production
PORT=5000

# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority

# Authentication
JWT_SECRET=your-super-secure-random-string-min-32-chars-1234567890abcdef

# NLP Service
NLP_SERVICE_URL=http://nlp-service:5001

# Similarity Matching
SIMILARITY_THRESHOLD=0.80
```

### 4. Create MongoDB Indexes for Performance

Connect to your MongoDB and run:

```javascript
// Primary index for answered questions lookup
db.questions.createIndex({
  "isAnswered": 1,
  "answer_text": 1,
  "embedding_vector": 1
});

// For searching by category/domain
db.questions.createIndex({
  "category": 1,
  "domain": 1,
  "isAnswered": 1
});

// For user's questions
db.questions.createIndex({ "student_id": 1, "createdAt": -1 });

// Future: Full-text search index
db.questions.createIndex({ "question_text": "text" });

// Job indexes
db.jobposts.createIndex({ "alumni_id": 1, "is_active": 1 });
db.jobposts.createIndex({ "employment_type": 1, "is_active": 1 });

// Application indexes
db.applications.createIndex({ "student_id": 1, "status": 1 });
db.applications.createIndex({ "job_id": 1, "status": 1 });
```

---

## 🏃 Running the Application

### Development Mode

```bash
# From server directory
npm install
npm start

# Server will start on http://localhost:5000
# Health check: http://localhost:5000/health
```

### Production Mode with Docker

```bash
# Build all services
docker-compose up -d

# Services will be available:
# - Backend: http://localhost:5000
# - Frontend: http://localhost:3000
# - NLP Service: http://localhost:5001 (internal)
# - MongoDB: mongodb://mongo:27017 (internal)
```

---

## 🔍 Testing the NLP Engine

### Test 1: Simple Question Ask

```bash
# Ask a question
curl -X POST http://localhost:5000/api/questions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "question_text": "How do I learn machine learning?",
    "category": "Learning",
    "domain": "AI"
  }'

# Expected response:
# {
#   "success": true,
#   "message": "Question submitted",
#   "data": {
#     "question": { ... },
#     "matched": false,
#     "similarityScore": 0
#   }
# }
```

### Test 2: Test Similarity Matching

```bash
# First, create an answered question in MongoDB:
db.questions.insertOne({
  student_id: ObjectId("..."),
  question_text: "What is machine learning?",
  category: "Learning",
  domain: "AI",
  embedding_vector: [0.1, 0.2, ...], // 384-dim vector
  answer_text: "ML is a subset of AI where...",
  isAnswered: true,
  status: "answered"
});

# Then ask very similar question:
curl -X POST http://localhost:5000/api/questions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "question_text": "What exactly is machine learning?",
    "category": "Learning",
    "domain": "AI"
  }'

# Expected: matched: true, similarityScore: > 0.80
```

### Test 3: Rate Limiting

```bash
# Try to login 6 times in 15 minutes (limit is 5)
for i in {1..6}; do
  curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email": "test@example.com", "password": "test123"}'
done

# 6th request should return:
# {
#   "success": false,
#   "error": {
#     "code": "RATE_LIMIT_EXCEEDED",
#     "message": "Too many login attempts. Please try again later."
#   }
# }

# Response headers will include:
# X-RateLimit-Limit: 5
# X-RateLimit-Remaining: 0
# X-RateLimit-Reset: 2024-02-25T15:30:00Z
```

### Test 4: Health Check

```bash
# Check if NLP service is healthy
curl http://localhost:5000/health

# Response:
# {
#   "success": true,
#   "status": "healthy",
#   "uptime": 1234.567,
#   "environment": "production"
# }
```

---

## 📊 Monitoring & Logging

### View Application Logs

```bash
# Development (terminal output)
npm start

# Production (Docker)
docker-compose logs -f backend

# With specific service
docker-compose logs -f nlp-service
```

### Log Patterns to Look For

```
[NLP] Generated embedding for question (384-dim)
[NLP] generateEmbedding - Success on attempt 1
[NLP] Health check: ✓ Healthy
[NLP] Similarity check failed: Service timeout
[QUESTION] Found 150 answered questions to compare
[QUESTION] Found match with score 0.92 > 0.80
[RATE-LIMIT] auth:login limit exceeded for IP: 192.168.1.100
```

### Morgan Log Format

```
192.168.1.100 - - [25/Feb/2024:14:30:45 +0000] "POST /api/questions HTTP/1.1" 201 1234 "-" "Mozilla/5.0"
    ↑              ↑      ↑                      ↑   ↑ ↑
  Remote IP    Timestamp  Method Path       Status Size
```

---

## ⚠️ Common Issues & Solutions

### Issue 1: NLP Service Timeout

**Error:** "NLP service timeout: Failed after 2 attempts"

**Solutions:**
```bash
# 1. Check if NLP service is running
docker-compose ps nlp-service

# 2. Test NLP service directly
curl http://nlp-service:5001/health

# 3. Increase timeout in nlpService.js
const NLP_TIMEOUT = 15000; // from 10000

# 4. Check service logs
docker-compose logs nlp-service
```

### Issue 2: MongoDB Connection Failed

**Error:** "MongoError: connect ECONNREFUSED"

**Solutions:**
```bash
# 1. Check MongoDB is running
docker-compose ps mongo

# 2. Verify connection string
echo $MONGO_URI

# 3. Test connection
mongosh "mongodb://mongo:27017"

# 4. Check network
docker network ls
docker inspect alumni-chat-system_alumni_network
```

### Issue 3: Rate Limiter Not Working

**Issue:** No rate limit errors after many requests

**Solutions:**
```bash
# 1. Verify rate limiter is applied in app.js
# Check that routes have: app.use("/api/auth/login", rateLimiters.login)

# 2. Check if running behind proxy
# Use: app.set("trust proxy", 1); to get real IP

# 3. Check rate limit config
const RATE_LIMITS = {
  login: { windowMs: 15 * 60 * 1000, max: 5 },
  // ...
}
```

---

## 🔧 Fine-Tuning Configuration

### Adjust Similarity Threshold

```env
# More strict (fewer matches)
SIMILARITY_THRESHOLD=0.90

# More lenient (more matches)
SIMILARITY_THRESHOLD=0.70
```

### Adjust Rate Limits

In `middleware/rateLimiter.js`:

```javascript
const RATE_LIMITS = {
  login: { windowMs: 15 * 60 * 1000, max: 5 },      // 5 per 15 min
  register: { windowMs: 60 * 60 * 1000, max: 3 },  // 3 per hour
  questions: { windowMs: 10 * 60 * 1000, max: 20 }, // 20 per 10 min
  jobs: { windowMs: 10 * 60 * 1000, max: 10 },     // 10 per 10 min
};
```

### Adjust Body Size Limit

In `app.js`:

```javascript
// Increase if you need to accept larger files (e.g., resume uploads)
app.use(express.json({ limit: "50mb" })); // from 10mb
```

### Adjust NLP Service Timeout

In `services/nlpService.js`:

```javascript
const NLP_TIMEOUT = 15000; // 15 seconds (from 10000)
const MAX_RETRIES = 3;     // 3 retries (from 2)
```

---

## 📈 Performance Tuning

### MongoDB Queries

```javascript
// SLOW: Loads everything
const questions = await Question.find({ isAnswered: true });

// FASTER: Only needed fields
const questions = await Question.find({ isAnswered: true })
  .select("question_text embedding_vector answer_text")
  .lean();
```

### Batch Similarity Checking

```javascript
// Current: O(n) comparisons
for (let q of answeredQuestions) {
  similarity = cosineSimilarity(embedding, q.embedding);
}

// Future: GPU-accelerated with ONNX
// OR vector database (Pinecone) for O(log n)
```

---

## 🚀 Production Deployment

### Pre-Deployment Checklist

- ✅ All environment variables set
- ✅ MongoDB indexes created
- ✅ helmet() and morgan() enabled in app.js
- ✅ Rate limiting configured appropriately
- ✅ NLP service tested and accessible
- ✅ Docker images built and tested
- ✅ Logs aggregation configured (optional)
- ✅ Monitoring alerts set up (optional)
- ✅ SSL/TLS certificate configured (on reverse proxy)

### Docker Deployment

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# Verify all services are healthy
docker-compose ps

# Check logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Kubernetes Deployment (Future)

```yaml
# Create configmap for environment variables
kubectl create configmap alumni-chat-config --from-env-file=.env

# Deploy using helm or kubectl
kubectl apply -f k8s/deployment.yaml
```

---

## 🎯 Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| Question ask response | <1000ms | ~300-700ms |
| Similarity check | <500ms | ~100-500ms |
| Search queries | <200ms | ~50-150ms |
| NLP embedding | <200ms | ~100-200ms |
| p99 latency | <2000ms | varies |

---

## 📞 Support & Debugging

### Enable Debug Logging

```bash
# Set debug env var
DEBUG=alumni-chat:* npm start

# Or specific service
DEBUG=alumni-chat:nlp npm start
```

### MongoDB Debug

```bash
# Monitor query performance
db.setProfilingLevel(1, { slowms: 100 });

# View slow queries
db.system.profile.find({ millis: { $gt: 100 } }).pretty();
```

### NLP Service Debug

```bash
# Check embedding endpoint
curl -X POST http://localhost:5001/embed \
  -H "Content-Type: application/json" \
  -d '{"text": "What is AI?"}'

# Check similarity endpoint
curl -X POST http://localhost:5001/similarity \
  -H "Content-Type: application/json" \
  -d '{
    "query": "machine learning",
    "documents": ["AI fundamentals", "deep learning"],
    "threshold": 0.80
  }'
```

---

## ✅ Installation Complete!

Your production-grade NLP-powered Alumni Chat System is now ready for deployment. The system includes:

✨ **Service layer architecture** for separation of concerns
✨ **Intelligent NLP similarity engine** with retry logic
✨ **Production hardening** with security & rate limiting  
✨ **Comprehensive logging** with Morgan
✨ **Scalability considerations** for future growth

Happy deploying! 🚀

