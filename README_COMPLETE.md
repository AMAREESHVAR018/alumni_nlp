# Alumni-Student Chat System with NLP

A comprehensive web application that connects students with alumni through an intelligent Q&A system, alumni directory, and job board with NLP-powered knowledge management.

## Features

### For Students
- **Ask Questions**: Get answers from experienced alumni with NLP-powered similarity detection
- **Browse Alumni**: Search and filter alumni by domain, company, skills, and experience
- **Job Board**: Browse internships and job opportunities posted by alumni
- **Apply to Jobs**: Submit applications with resume and cover letter
- **Track Interactions**: Monitor questions asked and job applications

### For Alumni
- **Answer Questions**: Respond to questions from students in your field
- **Post Opportunities**: Share internships and job openings
- **Manage Applications**: Review and manage student applications
- **Build Network**: Connect with students interested in your field and company

### NLP Features
- **Similarity Detection**: Automatically identifies similar previously answered questions
- **Smart Routing**: Assigns new questions to relevant alumni based on domain
- **Knowledge Base**: Builds a reusable Q&A database that grows over time
- **Embeddings**: Uses Sentence Transformers for semantic similarity matching

## Tech Stack

### Backend
- **Node.js** + Express.js
- **MongoDB** (with Mongoose)
- **JWT** Authentication
- **Axios** for HTTP requests

### NLP Service
- **Flask** (Python)
- **Sentence Transformers** for embeddings
- **Scikit-learn** for similarity calculations

### Frontend
- **React.js** (React Router)
- **Tailwind CSS** for styling
- **Axios** for API calls
- **Context API** for state management

### Deployment
- **Docker** & **Docker Compose**

## Project Structure

```
alumni-chat-system/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── context/       # Auth context
│   │   ├── services/      # API services
│   │   ├── App.js         # Main app
│   │   └── index.js
│   ├── package.json
│   └── Dockerfile
├── server/                 # Node.js Backend
│   ├── config/           # Database config
│   ├── controllers/       # Business logic
│   ├── middleware/        # Auth middleware
│   ├── models/            # MongoDB schemas
│   ├── routes/            # API routes
│   ├── app.js             # Express app
│   ├── server.js          # Server entry
│   ├── .env               # Environment variables
│   ├── package.json
│   └── Dockerfile
├── nlp-service/           # Python NLP Service
│   ├── app.py             # Flask app
│   ├── requirements.txt
│   └── Dockerfile
├── docker-compose.yml     # Container orchestration
└── README.md
```

## Installation & Setup

### Prerequisites
- Docker & Docker Compose (recommended)
- OR Node.js 18+, Python 3.11+, MongoDB

### Option 1: Using Docker Compose (Recommended)

1. **Clone and navigate to project**
```bash
cd alumni-chat-system
```

2. **Update environment variables** (.env file in server/)
```bash
PORT=5000
MONGO_URI=mongodb://mongo:27017/alumni_chat
JWT_SECRET=your_secret_key_here
NLP_SERVICE_URL=http://nlp-service:5001
SIMILARITY_THRESHOLD=0.80
NODE_ENV=production
```

3. **Start all services**
```bash
docker-compose up --build
```

Services will be available at:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000
- **NLP Service**: http://localhost:5001
- **MongoDB**: localhost:27017

### Option 2: Local Development Setup

#### Backend Setup
```bash
cd server
npm install
# Update .env with your MongoDB URI
npm start  # or npm install -g nodemon && npm run dev
```

#### NLP Service Setup
```bash
cd nlp-service
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

#### Frontend Setup
```bash
cd client
npm install
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Alumni Directory
- `GET /api/auth/alumni/search` - Search alumni with filters
- `GET /api/auth/alumni/:id` - Get alumni profile

### Questions
- `POST /api/questions` - Ask a question
- `GET /api/questions/all` - Get all questions
- `GET /api/questions/:id` - Get question detail
- `GET /api/questions/my-questions` - Get user's questions
- `POST /api/questions/:id/answer` - Answer a question
- `POST /api/questions/:id/assign` - Assign question to alumni
- `POST /api/questions/:id/helpful` - Mark as helpful

### Job Posts
- `GET /api/jobs` - Get all job posts
- `POST /api/jobs` - Create job post (alumni only)
- `GET /api/jobs/:id` - Get job detail
- `GET /api/jobs/my-jobs/list` - Get user's job posts
- `PUT /api/jobs/:id` - Update job post
- `POST /api/jobs/:id/close` - Close job posting

### Job Applications
- `POST /api/jobs/:job_id/apply` - Apply for job
- `GET /api/jobs/applications/my-applications` - Get user's applications
- `GET /api/jobs/:job_id/applications` - Get job applications (alumni)
- `PUT /api/jobs/applications/:app_id/status` - Update application status

### NLP Service
- `POST /nlp/embed` - Generate embedding for text
- `POST /nlp/similarity` - Check similarity between query and documents
- `POST /nlp/batch-similarity` - Batch similarity check

## Database Models

### User
```javascript
{
  name, email, password, role (student/alumni/admin),
  bio, profilePicture,
  // Alumni fields
  company, jobTitle, graduationYear, domain, skills, yearsOfExperience,
  // Student fields
  currentYear, university, targetRoles, interests,
  phone, isVerified
}
```

### Question
```javascript
{
  student_id (ref: User),
  question_text, embedding_vector,
  answer_text, answered_by (ref: User),
  assigned_to (ref: User),
  status (pending/assigned/answered),
  category, domain, isAnswered, views, helpful_count,
  similarity_score, matched_question_id (ref: Question)
}
```

### JobPost
```javascript
{
  alumni_id (ref: User),
  title, company, description,
  skills_required, experience_level, location,
  employment_type, salary_range, deadline,
  domain, category, is_active,
  applications_count, views_count,
  benefits, about_company
}
```

### Application
```javascript
{
  student_id (ref: User), job_id (ref: JobPost),
  resume_link, cover_letter,
  status (pending/reviewed/shortlisted/rejected/accepted),
  applied_at, reviewed_by (ref: User), feedback
}
```

## Usage Guide

### For Students
1. **Register** as a Student with university details
2. **Browse Alumni** using filters for skills/domain you're interested in
3. **Ask Questions** about career, skills, opportunities
4. **Browse Jobs** - View opportunities posted by alumni
5. **Apply** to jobs by uploading resume and cover letter
6. **Track** all your questions and applications

### For Alumni
1. **Register** as an Alumni with company/job details
2. **Answer Questions** assigned to you by the system
3. **Post Jobs** - Share internships/jobs from your company
4. **Review Applications** - See and manage student applications
5. **Manage Profile** - Update skills, experience, contact info

## NLP Features in Detail

### Similarity Detection (Threshold: 0.80)
When a student asks a question:
1. System generates embedding using Sentence Transformers
2. Compares with all answered questions' embeddings
3. If similarity ≥ 0.80 → Returns stored answer automatically
4. If < 0.80 → Routes to relevant alumni based on domain

### How Embeddings Work
- Uses `all-MiniLM-L6-v2` model (384-dimensional vectors)
- Semantic similarity using cosine distance
- Processes ~2000 chars/embedding in <100ms
- Stored in MongoDB for quick retrieval

## Configuration

### Environment Variables
```env
# Backend
PORT=5000
MONGO_URI=mongodb://mongo:27017/alumni_chat
JWT_SECRET=your_jwt_secret_key
NLP_SERVICE_URL=http://nlp-service:5001
SIMILARITY_THRESHOLD=0.80
NODE_ENV=development

# Frontend (in .env or .env.local)
REACT_APP_API_URL=http://localhost:5000/api
```

### Customization
- Adjust `SIMILARITY_THRESHOLD` to make matching stricter/looser
- Modify Tailwind colors in `client/tailwind.config.js`
- Change NLP model in `nlp-service/app.py`

## Performance Tips

1. **Batch Similarity Checks**: For large question sets, use `/batch-similarity`
2. **Pagination**: API endpoints support limit/page parameters
3. **Indexing**: MongoDB indexes on `student_id`, `alumni_id`, `domain`
4. **Caching**: Consider Redis for frequently accessed alumni profiles

## Troubleshooting

### NLP Service Connection Issues
```bash
# Test NLP service
curl -X POST http://localhost:5001/health

# Check logs
docker logs alumni_nlp
```

### Database Connection
```bash
# Verify MongoDB
mongosh "mongodb://localhost:27017/alumni_chat"
```

### Port Conflicts
```bash
# Change ports in docker-compose.yml or .env
```

## Future Enhancements

- [ ] Real-time notifications (Socket.io)
- [ ] Video chat integration
- [ ] Resume parsing and skill extraction
- [ ] Admin dashboard
- [ ] Email notifications
- [ ] Advanced analytics dashboard
- [ ] Mentorship programs
- [ ] Peer-to-peer learning sessions
- [ ] Mobile app (React Native)
- [ ] Multi-language support

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## License

This project is licensed under ISC License - see LICENSE file for details.

## Support

For issues and questions:
- Open GitHub Issues
- Check existing documentation
- Contact development team

## Author

Created as an NLP-powered solution for mentorship and career guidance.

---

**Note**: This is a production-ready codebase. Ensure to update JWT_SECRET and database credentials before deployment.
