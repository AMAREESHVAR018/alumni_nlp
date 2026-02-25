# Environment Configuration Guide

## Overview

This guide explains all environment variables required to run the NLP Alumni Chat System in development, testing, and production environments.

## Quick Start

### Step 1: Create `.env` File

In the `server/` directory, create a `.env` file:

```bash
cd server
touch .env
```

### Step 2: Copy Template

Use the template below based on your environment.

---

## Environment Variables by Deployment Stage

### DEVELOPMENT ENVIRONMENT

```env
# =====================================================
# NODE ENVIRONMENT
# =====================================================
NODE_ENV=development
PORT=5000
SERVER_URL=http://localhost:5000

# =====================================================
# DATABASE CONFIGURATION
# =====================================================
# Local MongoDB (if running locally)
MONGO_URI=mongodb://localhost:27017/alumni-chat

# MongoDB Atlas (managed cloud database)
# Format: mongodb+srv://username:password@cluster.mongodb.net/dbname
MONGO_URI=mongodb+srv://alumni_user:password@alumni-cluster.mongodb.net/alumni-chat-dev

# =====================================================
# AUTHENTICATION
# =====================================================
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRY=7d

# =====================================================
# NLP SERVICE CONFIGURATION
# =====================================================
# URL for Python NLP service
NLP_SERVICE_URL=http://localhost:5001
NLP_TIMEOUT=10000  # milliseconds
SIMILARITY_THRESHOLD=0.80

# =====================================================
# CORS CONFIGURATION
# =====================================================
# Comma-separated allowed origins
CLIENT_URL=http://localhost:3000
CORS_ORIGINS=http://localhost:3000,http://localhost:5000

# =====================================================
# LOGGING & MONITORING
# =====================================================
LOG_LEVEL=debug
LOG_FORMAT=dev

# =====================================================
# RATE LIMITING (optional - defaults to in-memory)
# =====================================================
# For production, use Redis:
REDIS_URL=redis://localhost:6379
```

### TESTING ENVIRONMENT

```env
NODE_ENV=test
PORT=5001  # Different port to avoid conflicts
SERVER_URL=http://localhost:5001

# Use test-specific database
MONGO_URI=mongodb://localhost:27017/alumni-chat-test

# Use test JWT secret
JWT_SECRET=test-jwt-secret-for-testing-only
JWT_EXPIRY=1h

# NLP service (mock or local test instance)
NLP_SERVICE_URL=http://localhost:5002

# Disable certain features for testing
RATE_LIMITING_ENABLED=false
```

### PRODUCTION ENVIRONMENT

```env
# =====================================================
# NODE ENVIRONMENT (CRITICAL)
# =====================================================
NODE_ENV=production
PORT=5000  # Or port provided by host (e.g., Heroku uses PORT env var)
SERVER_URL=https://api.alumnichat.com  # Your production domain

# =====================================================
# DATABASE (MUST USE MONGODB ATLAS)
# =====================================================
# NEVER store plaintext passwords. Use environment secrets!
MONGO_URI=mongodb+srv://prod_user:${DB_PASSWORD}@alumni-cluster-prod.mongodb.net/alumni-chat
DB_PASSWORD=${SECRET_DB_PASSWORD}  # Provided by secret manager

# =====================================================
# AUTHENTICATION (STRONG SECRETS)
# =====================================================
# Generate strongly: openssl rand -base64 32
JWT_SECRET=${SECRET_JWT_KEY}  # From secure secret manager
JWT_EXPIRY=7d

# =====================================================
# NLP SERVICE (PRODUCTION URL)
# =====================================================
NLP_SERVICE_URL=http://nlp-service:5001  # Docker service name if containerized
# OR: https://nlp.alumnichat.com (if deployed separately)
NLP_TIMEOUT=10000
SIMILARITY_THRESHOLD=0.80
NLP_RETRIES=2

# =====================================================
# CORS (STRICT PRODUCTION SETTINGS)
# =====================================================
CLIENT_URL=https://alumnichat.com
CORS_ORIGINS=https://alumnichat.com,https://www.alumnichat.com

# =====================================================
# LOGGING & MONITORING
# =====================================================
LOG_LEVEL=error  # Only errors in production
LOG_FORMAT=json  # JSON format for log aggregation

# =====================================================
# SECURITY
# =====================================================
SECURE_COOKIES=true
SAME_SITE=Strict
HTTP_ONLY=true

# =====================================================
# RATE LIMITING (PRODUCTION)
# =====================================================
# Use Redis for distributed rate limiting
REDIS_URL=redis://${REDIS_PASSWORD}@redis-prod.amazonaws.com:6379
RATE_LIMITING_ENABLED=true

# =====================================================
# ANALYTICS & MONITORING
# =====================================================
DATADOG_API_KEY=${SECRET_DATADOG_KEY}
SENTRY_DSN=${SECRET_SENTRY_DSN}
```

---

## Detailed Variable Descriptions

### Core Environment

| Variable | Values | Default | Description |
|----------|--------|---------|-------------|
| `NODE_ENV` | `development` \| `test` \| `production` | `development` | Sets error handling, logging, security levels |
| `PORT` | number (1-65535) | 5000 | HTTP server listen port |
| `SERVER_URL` | URL string | Auto-detected | Full server URL for CORS, links in emails |

### Database

| Variable | Format | Example | Description |
|----------|--------|---------|-------------|
| `MONGO_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/db` | Database connection URL |
| `DB_NAME` | string | `alumni-chat` | Database name (included in MONGO_URI) |
| `DB_TIMEOUT` | milliseconds | `5000` | Connection timeout |
| `DB_POOL_SIZE` | number | `10` | Connection pool size |

### Authentication

| Variable | Format | Example | Description |
|----------|--------|---------|-------------|
| `JWT_SECRET` | string (32+ chars) | `abc123...xyz` | Secret key for signing JWTs (MUST be secure!) |
| `JWT_EXPIRY` | string or seconds | `7d` or `604800` | How long tokens are valid |
| `PASSWORD_SALT_ROUNDS` | number (10-12) | `10` | bcryptjs salt rounds (higher = slower/more secure) |

### NLP Service

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `NLP_SERVICE_URL` | URL | `http://localhost:5001` | Python Flask NLP service endpoint |
| `NLP_TIMEOUT` | milliseconds | `10000` | Max time to wait for NLP response |
| `NLP_RETRIES` | number | `2` | Number of retry attempts on failure |
| `SIMILARITY_THRESHOLD` | 0-1 | `0.80` | Minimum score to auto-match questions |
| `EMBEDDING_DIMENSION` | number | `384` | Vector dimension (all-MiniLM-L6-v2) |
| `NLP_MODEL_NAME` | string | `all-MiniLM-L6-v2` | Which Sentence Transformer model to use |

### CORS & Security

| Variable | Format | Example | Description |
|----------|--------|---------|-------------|
| `CLIENT_URL` | URL | `http://localhost:3000` | React frontend URL |
| `CORS_ORIGINS` | comma-separated URLs | `http://localhost:3000,https://example.com` | Allowed CORS origins |
| `SECURE_COOKIES` | `true` \| `false` | `false` (dev), `true` (prod) | HTTPS-only cookies |
| `SAME_SITE` | `Lax` \| `Strict` | `Lax` | CSRF protection level |

### Rate Limiting

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `RATE_LIMITING_ENABLED` | boolean | `true` | Enable rate limiting middleware |
| `REDIS_URL` | URL | `redis://localhost:6379` | Redis connection for distributed rate limiting |
| `RATE_LIMIT_TTL` | seconds | `900` | Time window for rate limits (15 min) |

### Logging & Monitoring

| Variable | Values | Default | Description |
|----------|--------|---------|-------------|
| `LOG_LEVEL` | `error` \| `warn` \| `info` \| `debug` | `debug` | Minimum log levels to show |
| `LOG_FORMAT` | `dev` \| `json` | `dev` | Log output format |
| `SENTRY_DSN` | URL | - | Sentry error tracking URL |
| `DATADOG_API_KEY` | string | - | DataDog monitoring API key |

---

## Setup Instructions by Environment

### LOCAL DEVELOPMENT

1. **MongoDB Setup**
   ```bash
   # Option 1: Use MongoDB Community (local)
   # Install: https://www.mongodb.com/docs/manual/installation/
   # Then: brew services start mongodb-community (Mac) or mongod (Windows)
   
   # Option 2: Use Docker
   docker run -d -p 27017:27017 --name mongodb mongo:7.1.0
   ```

2. **Create `.env`**
   ```bash
   cd server
   cat > .env << 'EOF'
   NODE_ENV=development
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/alumni-chat
   JWT_SECRET=dev-secret-change-in-production
   JWT_EXPIRY=7d
   NLP_SERVICE_URL=http://localhost:5001
   SIMILARITY_THRESHOLD=0.80
   CLIENT_URL=http://localhost:3000
   CORS_ORIGINS=http://localhost:3000
   LOG_LEVEL=debug
   EOF
   ```

3. **Start services**
   ```bash
   # Terminal 1: Backend
   cd server && npm install && npm start
   
   # Terminal 2: NLP Service (Python)
   cd nlp-service && pip install -r requirements.txt && python app.py
   
   # Terminal 3: Frontend
   cd client && npm install && npm start
   ```

### DOCKER DEPLOYMENT

1. **Create `.env`** with production values

2. **Start with Docker Compose**
   ```bash
   docker-compose up -d
   ```

3. **Verify services**
   ```bash
   docker-compose logs -f
   curl http://localhost:5000/health
   ```

### HEROKU DEPLOYMENT

1. **Set environment variables**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET="$(openssl rand -base64 32)"
   heroku config:set MONGO_URI="mongodb+srv://..."
   heroku config:set NLP_SERVICE_URL="https://your-nlp-service.herokuapp.com"
   ```

2. **Deploy**
   ```bash
   git push heroku main
   heroku logs --tail
   ```

### AWS/PRODUCTION

1. **Use AWS Systems Manager Parameter Store or Secrets Manager**
   ```bash
   aws secretsmanager create-secret \
     --name alumni-chat/prod/mongo-uri \
     --secret-string "mongodb+srv://..."
   ```

2. **Reference in application startup**
   ```javascript
   const mongoUri = await getSecretValue('alumni-chat/prod/mongo-uri');
   ```

---

## Security Best Practices

### 1. Never Commit `.env` File

```bash
# Add to .gitignore
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
echo ".env.*.local" >> .gitignore
```

### 2. Secure Secret Management

**Development**: Use `.env` file locally ✓
**Production**: Use secret manager ✓

```javascript
// Example: AWS Secrets Manager
const AWS = require('aws-sdk');
const client = new AWS.SecretsManager();

const getSecret = async (secretName) => {
  const result = await client.getSecretValue({ SecretId: secretName }).promise();
  return JSON.parse(result.SecretString);
};

const secrets = await getSecret('alumni-chat/prod');
const { MONGO_URI, JWT_SECRET } = secrets;
```

### 3. Strong Secrets

Generate using:
```bash
# JWT Secret (32+ characters)
openssl rand -base64 32

# Database password (20+ characters)
openssl rand -base64 20
```

### 4. Rotate Secrets Regularly

- **JWT Secret**: Every 3-6 months
- **Database password**: Every 6 months
- **API Keys**: On team member changes

### 5. Validate Environment on Startup

```javascript
// Validate required variables exist
const requiredEnvVars = [
  'NODE_ENV',
  'PORT',
  'MONGO_URI',
  'JWT_SECRET',
  'NLP_SERVICE_URL'
];

requiredEnvVars.forEach(variable => {
  if (!process.env[variable]) {
    throw new Error(`Missing required environment variable: ${variable}`);
  }
});
```

---

## Troubleshooting

### Problem: "MONGOOSE CONNECTION ERROR"

**Solution**: Check `MONGO_URI`
```bash
# Test connection
node -e "const mongoose = require('mongoose'); mongoose.connect(process.env.MONGO_URI);"
```

### Problem: "JWT_SECRET not found"

**Solution**: Ensure `.env` file exists and is read
```bash
# Check file exists
ls -la server/.env

# Check NODE_ENV
echo $NODE_ENV
```

### Problem: "NLP Service Unreachable"

**Solution**: Verify Flask service running
```bash
# Test endpoint
curl http://localhost:5001/health

# Check if PORT 5001 is in use
lsof -i :5001
```

### Problem: "CORS Origin Not Allowed"

**Solution**: Verify `CORS_ORIGINS` includes client URL
```env
CLIENT_URL=http://localhost:3000
CORS_ORIGINS=http://localhost:3000,http://localhost:5000
```

---

## Monitoring Configuration

### DataDog Integration

```env
DATADOG_API_KEY=your_datadog_api_key
DATADOG_SITE=datadoghq.com  # or datadoghq.eu
```

### Sentry Integration

```env
SENTRY_DSN=https://key@sentry.io/project-id
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1
```

### Custom Monitoring

Store performance metrics for analytics:
```javascript
// In NLP service
metrics.recordEmbeddingTime(embeddingTimeMs);
metrics.recordSimilarityMatch(score, timeMs);
```

---

## Checklist for Production

- [ ] Generate strong `JWT_SECRET` (32+ chars)
- [ ] Use MongoDB Atlas (never share credentials)
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS (use certificate)
- [ ] Configure CORS to specific domain
- [ ] Set up error monitoring (Sentry)
- [ ] Enable structured logging (JSON format)
- [ ] Set resource limits (memory, CPU)
- [ ] Regular backups of MongoDB
- [ ] Monitor NLP service availability
- [ ] Test rate limiting under load
- [ ] Implement secret rotation policy
- [ ] Document all production URLs
- [ ] Setup alerting for errors/slowness

---

**For questions or issues, refer to the main README.md or contact the team.**
