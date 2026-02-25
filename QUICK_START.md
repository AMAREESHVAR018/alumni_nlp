# Quick Start Guide

## Fast Setup with Docker (Recommended - 5 minutes)

### Prerequisites
- Docker Desktop installed (https://www.docker.com/products/docker-desktop)

### Steps

1 **Clone & Navigate**
```bash
cd alumni-chat-system
```

2. **Start Services**
```bash
docker-compose up --build
```

3. **Wait for startup** (2-3 minutes on first run)
   - Backend: http://localhost:5000 ✓
   - Frontend: http://localhost:3000 ✓
   - NLP Service: http://localhost:5001 ✓
   - MongoD: localhost:27017 ✓

4. **Open Application**
   - Navigate to http://localhost:3000
   - Click "Here's the link"
   - Register your account

### First-Time Setup

**Create Test Accounts:**

1. **Student Account**
   - Role: Student
   - Email: student@example.com
   - Password: password123
   - University: Example University
   - Current Year: 3

2. **Alumni Account**
   - Role: Alumni
   - Email: alumni@example.com
   - Password: password123
   - Company: Tech Company
   - Job Title: Senior Engineer
   - Years of Experience: 5

### Next Steps

- Student: Ask a question → Get answers from alumni
- Alumni: Post a job → Manage applications
- Explore the alumni directory and job board

## Manual Setup (10 minutes)

### Backend Setup
```bash
cd server
npm install
# Update .env if using local MongoDB
npm start
```

### NLP Service Setup
```bash
cd nlp-service
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

### Frontend Setup
```bash
cd client
npm install
REACT_APP_API_URL=http://localhost:5000/api npm start
```

## Troubleshooting

### Docker Issues
```bash
# Rebuild containers
docker-compose down
docker-compose up --build

# View logs
docker-compose logs -f nlp-service
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Port Already In Use
Edit `docker-compose.yml`:
```yaml
ports:
  - "3001:3000"  # Changed from 3000
```

### Database Issues
```bash
# Check MongoDB
docker exec alumni_mongo mongosh

# Clear and restart
docker-compose down -v
docker-compose up
```

## Key Features to Try

1. **Ask a Question**
   - Login as student
   - Dashboard → Ask Question
   - System checks for similar answered questions

2. **Post a Job**
   - Login as alumni
   - Dashboard → Post Job
   - Fill in job details and skills required

3. **Search Alumni**
   - Dashboard → Alumni Directory
   - Filter by domain, company, skills

4. **Apply for Job**
   - Student → Jobs board
   - Click "Apply Now"
   - Upload resume link and cover letter

## API Testing

```bash
# Test backend health
curl http://localhost:5000

# Test NLP service
curl -X POST http://localhost:5001/health

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@example.com","password":"password123"}'

# Get questions
curl http://localhost:5000/api/questions/all
```

## Performance Tips

- First question embedding takes ~3-5 seconds
- Similarity check with existing questions takes ~1-2 seconds
- Job search filters respond instantly
- Alumni search filters within 500ms

## System Architecture

```
Client (React)
    ↓ (REST API)
Backend (Node.js/Express)
    ↓           ↓
MongoDB      NLP Service (Flask)
             (Embeddings)
```

## Default Credentials (If Using Pre-seeded Data)

```
Superadmin
Email: admin@example.com
Password: admin123
```

## Storage & Limits

- Embedding vectors: Stored in MongoDB
- Max file size for resume: No limit (external links)
- Max text length per question: Unlimited
- Questions per student: Unlimited
- Job posts per alumni: Unlimited

## Production Checklist

Before deploying to production:
- [ ] Update JWT_SECRET in .env
- [ ] Update MONGO_URI to production database
- [ ] Set NODE_ENV=production
- [ ] Enable HTTPS/TLS
- [ ] Set up proper MongoDB authentication
- [ ] Configure CORS for your domain
- [ ] Set up email notifications
- [ ] Enable rate limiting
- [ ] Set up monitoring and logs
- [ ] Backup strategy

## Getting Help

- Check `/README_COMPLETE.md` for detailed docs
- View logs: `docker-compose logs service_name`
- MongoDB connection issues? Verify MONGO_URI
- NLP not working? Check port 5001 is accessible

## Next: Customization

### Change Theme Colors
Edit `client/tailwind.config.js`:
```js
colors: {
  primary: '#3B82F6',    // Change blue
  secondary: '#10B981',  // Change green
}
```

### Adjust Similarity Threshold
Edit `server/.env`:
```
SIMILARITY_THRESHOLD=0.75  # More lenient matching
```

### Change NLP Model
Edit `nlp-service/app.py`:
```python
model = SentenceTransformer('all-mpnet-base-v2')  # Larger model
```

---

**Happy mentoring! 🎓**
