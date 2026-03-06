const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
const axios = require('axios');
const { faker } = require('@faker-js/faker');

const User = require('../models/User');
const Question = require('../models/Question');
const JobPost = require('../models/JobPost');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

const USER_ROLES = { STUDENT: 'student', ALUMNI: 'alumni', ADMIN: 'admin' };
const DOMAINS = ['Software Engineering', 'Data Science', 'Product Management', 'Design', 'Marketing'];
const REAL_COMPANIES = ['Google', 'Microsoft', 'Amazon', 'Apple', 'Meta', 'Netflix', 'Stripe', 'Airbnb', 'Uber', 'Salesforce'];
const REAL_TITLES = ['Software Engineer', 'Backend Developer', 'Frontend Engineer', 'Data Scientist', 'Machine Learning Engineer', 'DevOps Engineer', 'Full Stack Developer', 'Cloud Architect'];
const JOB_LOCATIONS = ['San Francisco, CA', 'New York, NY', 'Seattle, WA', 'Austin, TX', 'Remote'];

// Realistic tech career questions with categories
const REALISTIC_QUESTIONS = [
  { text: "What programming languages should I learn to get a job at Google?", category: "Skills" },
  { text: "How do I prepare for technical interviews at FAANG companies?", category: "Interview" },
  { text: "What is the difference between machine learning and deep learning?", category: "Skills" },
  { text: "How important is a GitHub portfolio for getting an internship?", category: "Internship" },
  { text: "What soft skills do tech companies look for in fresh graduates?", category: "Career Path" },
  { text: "Should I learn React or Angular for frontend development?", category: "Skills" },
  { text: "How do I negotiate my salary as a fresh graduate?", category: "Career Path" },
  { text: "What certifications are worth getting for cloud computing?", category: "Education" },
  { text: "How do I transition from backend to full-stack development?", category: "Career Path" },
  { text: "What is the best way to prepare for system design interviews?", category: "Interview" },
];

// Specific test accounts required for testing
const TEST_ACCOUNTS = [
  {
    name: "Test Student One",
    email: "student1@test.com",
    password: "password123",
    role: USER_ROLES.STUDENT,
    domain: "Software Engineering",
    skills: ["JavaScript", "Python", "React"],
    interests: ["Web Development", "AI/ML"],
    career_goals: "Become a full-stack engineer at a top tech company",
    isVerified: true,
  },
  {
    name: "Test Student Two",
    email: "student2@test.com",
    password: "password123",
    role: USER_ROLES.STUDENT,
    domain: "Data Science",
    skills: ["Python", "SQL", "Machine Learning"],
    interests: ["Data Engineering", "Research"],
    career_goals: "Work as a data scientist",
    isVerified: true,
  },
  {
    name: "Test Alumni One",
    email: "alumni1@test.com",
    password: "password123",
    role: USER_ROLES.ALUMNI,
    company: "Google",
    jobTitle: "Senior Software Engineer",
    domain: "Software Engineering",
    skills: ["JavaScript", "Python", "System Design", "React", "Node.js"],
    interests: ["Mentoring", "Open Source"],
    isVerified: true,
  },
];

// Deterministic mock embedding (fallback when NLP service is unavailable)
const generateMockEmbedding = (seed) => {
  const array = new Array(384);
  for (let i = 0; i < 384; i++) {
    array[i] = Math.sin(seed + i) + Math.sin((seed + i) * 0.1);
  }
  const magnitude = Math.sqrt(array.reduce((sum, val) => sum + val * val, 0));
  return array.map((val) => val / magnitude);
};

// Fetch real NLP embedding from the Python service; returns null if unavailable
const fetchNlpEmbedding = async (text) => {
  try {
    const nlpUrl = process.env.NLP_SERVICE_URL || 'http://localhost:5001';
    const response = await axios.post(`${nlpUrl}/embed`, { text }, { timeout: 5000 });
    return response.data.embedding || null;
  } catch {
    return null;
  }
};

const seedDatabase = async () => {
  try {
    console.log('🌱 Seeding database (idempotent — clears then re-seeds)...');

    // Clear all collections so re-runs produce identical state
    await Promise.all([
      User.deleteMany({}),
      Question.deleteMany({}),
      JobPost.deleteMany({}),
      Conversation.deleteMany({}),
      Message.deleteMany({}),
    ]);
    console.log('🗑️  Existing data cleared.');

    const passwordHash = await bcryptjs.hash('Password123!', 10);
    let nlpAvailable = true;

    // ── 1. Fixed test accounts ────────────────────────────────────────────────
    console.log('🔑 Creating fixed test accounts...');
    const createdTestUsers = [];
    for (const account of TEST_ACCOUNTS) {
      const hashedPw = await bcryptjs.hash(account.password, 10);
      let embeddingVector = [];
      if (account.role === USER_ROLES.ALUMNI) {
        const summary = `${account.name} works at ${account.company} as ${account.jobTitle}. Skills: ${account.skills.join(', ')}`;
        const nlpResult = nlpAvailable ? await fetchNlpEmbedding(summary) : null;
        if (nlpResult) {
          embeddingVector = nlpResult;
        } else {
          nlpAvailable = false;
          embeddingVector = generateMockEmbedding(99);
        }
      }
      const user = await User.create({ ...account, password: hashedPw, embedding_vector: embeddingVector });
      createdTestUsers.push(user);
      console.log(`   ✓ ${account.email}`);
    }

    // ── 2. Admin ──────────────────────────────────────────────────────────────
    await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: passwordHash,
      role: USER_ROLES.ADMIN,
      isVerified: true,
    });

    // ── 3. 10-20 random users (mix of alumni and students) ────────────────────
    const RANDOM_USER_COUNT = faker.number.int({ min: 10, max: 20 });
    console.log(`   Generating ${RANDOM_USER_COUNT} random users (alumni + students)…`);
    const randomAlumniList = [];
    const randomStudentList = [];

    for (let i = 0; i < RANDOM_USER_COUNT; i++) {
      const isAlumni = i % 2 === 0; // alternate for a natural mix
      if (isAlumni) {
        const domain = DOMAINS[Math.floor(Math.random() * DOMAINS.length)];
        const company = faker.helpers.arrayElement(REAL_COMPANIES);
        const jobTitle = faker.helpers.arrayElement(REAL_TITLES);
        const skills = faker.helpers.arrayElements(
          ['Python', 'JavaScript', 'React', 'Node.js', 'AWS', 'System Design', 'SQL', 'Docker', 'Go', 'Kubernetes'],
          { min: 3, max: 6 }
        );
        const summary = `Works at ${company} as ${jobTitle}. Expertise in ${skills.join(', ')}. Domain: ${domain}.`;
        const nlpResult = nlpAvailable ? await fetchNlpEmbedding(summary) : null;
        if (!nlpResult) nlpAvailable = false;

        randomAlumniList.push({
          name: faker.person.fullName(),
          email: faker.internet.email().toLowerCase(),
          password: passwordHash,
          role: USER_ROLES.ALUMNI,
          company,
          jobTitle,
          graduationYear: faker.number.int({ min: 2010, max: 2022 }),
          domain,
          skills,
          bio: faker.lorem.paragraph(),
          career_summary: summary,
          embedding_vector: nlpResult || generateMockEmbedding(i),
          isVerified: true,
        });
      } else {
        randomStudentList.push({
          name: faker.person.fullName(),
          email: faker.internet.email().toLowerCase(),
          password: passwordHash,
          role: USER_ROLES.STUDENT,
          university: faker.company.name() + ' University',
          currentYear: faker.number.int({ min: 1, max: 4 }),
          targetRoles: [faker.helpers.arrayElement(REAL_TITLES)],
          interests: faker.helpers.arrayElements(
            ['Web Development', 'AI/ML', 'Data Science', 'Cloud', 'Cybersecurity', 'Mobile'], 2
          ),
          isVerified: true,
        });
      }
    }

    const createdRandomAlumni = randomAlumniList.length ? await User.insertMany(randomAlumniList) : [];
    const createdRandomStudents = randomStudentList.length ? await User.insertMany(randomStudentList) : [];
    console.log(`   ✓ ${createdRandomAlumni.length} random alumni, ${createdRandomStudents.length} random students`);

    // Pools for linking data
    const allAlumni = [
      ...createdTestUsers.filter(u => u.role === USER_ROLES.ALUMNI),
      ...createdRandomAlumni,
    ];
    const allStudents = [
      ...createdTestUsers.filter(u => u.role === USER_ROLES.STUDENT),
      ...createdRandomStudents,
    ];

    // ── 4. 5-10 job posts linked to alumni ────────────────────────────────────
    const JOB_COUNT = faker.number.int({ min: 5, max: 10 });
    const jobList = [];
    for (let i = 0; i < JOB_COUNT; i++) {
      const alumni = allAlumni[i % allAlumni.length];
      const jobTitle = faker.helpers.arrayElement(REAL_TITLES);
      const company = faker.helpers.arrayElement(REAL_COMPANIES);
      const jobCateg = faker.helpers.arrayElement(['internship', 'job', 'contract']);
      const jobType = jobCateg === 'internship' ? 'internship' : jobCateg === 'contract' ? 'contract' : 'full-time';
      const reqSkills = faker.helpers.arrayElements(
        ['Python', 'JavaScript', 'React', 'Node.js', 'AWS', 'System Design', 'SQL', 'Docker', 'Kubernetes', 'Java'], 3
      );
      jobList.push({
        alumni_id: alumni._id,
        title: jobTitle,
        company,
        description: `We are looking for a talented ${jobTitle} to join our team at ${company}. You will design scalable systems, write clean code, and collaborate with world-class engineers.`,
        skills_required: reqSkills,
        experience_level: faker.helpers.arrayElement(['entry', 'mid', 'senior']),
        location: faker.helpers.arrayElement(JOB_LOCATIONS),
        employment_type: jobType,
        salary_range: `$${faker.number.int({ min: 80, max: 120 })}k - $${faker.number.int({ min: 130, max: 200 })}k`,
        deadline: faker.date.future(),
        domain: alumni.domain,
        category: jobCateg,
        is_active: true,
      });
    }
    await JobPost.insertMany(jobList);
    console.log(`   ✓ ${jobList.length} job posts`);

    // ── 5. 10-20 questions linked to students ─────────────────────────────────
    const QUESTION_COUNT = faker.number.int({ min: 10, max: 20 });
    const questionList = [];
    for (let i = 0; i < QUESTION_COUNT; i++) {
      const student = allStudents[i % allStudents.length];
      const isAnswered = Math.random() < 0.5;
      const alumni = isAnswered ? allAlumni[i % allAlumni.length] : null;
      const qTemplate = REALISTIC_QUESTIONS[i % REALISTIC_QUESTIONS.length];
      // Try to get real embedding for the first question, fall back for rest
      let embedding = generateMockEmbedding(i);
      if (i === 0 && nlpAvailable) {
        const nlpResult = await fetchNlpEmbedding(qTemplate.text);
        if (nlpResult) embedding = nlpResult;
        else nlpAvailable = false;
      }
      questionList.push({
        student_id: student._id,
        question_text: qTemplate.text,
        embedding_vector: embedding,
        answer_text: isAnswered
          ? `Based on my experience at ${faker.helpers.arrayElement(REAL_COMPANIES)}: ${faker.lorem.paragraph()}`
          : undefined,
        answered_by: isAnswered ? alumni._id : undefined,
        status: isAnswered ? 'answered' : 'pending',
        category: qTemplate.category,
        domain: faker.helpers.arrayElement(DOMAINS),
        isAnswered,
        views_count: faker.number.int({ min: 0, max: 500 }),
        helpful_count: isAnswered ? faker.number.int({ min: 0, max: 100 }) : 0,
      });
    }
    await Question.insertMany(questionList);
    console.log(`   ✓ ${questionList.length} questions`);

    // ── 6. 5-10 conversations with messages ───────────────────────────────────
    const CONVO_COUNT = faker.number.int({ min: 5, max: 10 });
    for (let i = 0; i < CONVO_COUNT; i++) {
      const student = allStudents[i % allStudents.length];
      const alumni = allAlumni[i % allAlumni.length];

      const conversation = new Conversation({ participants: [student._id, alumni._id] });
      await conversation.save();

      const numMessages = faker.number.int({ min: 2, max: 8 });
      let lastMessage = null;
      for (let j = 0; j < numMessages; j++) {
        const isStudentTurn = j % 2 === 0;
        const sender = isStudentTurn ? student._id : alumni._id;
        const receiver = isStudentTurn ? alumni._id : student._id;
        const msg = new Message({
          conversationId: conversation._id,
          senderId: sender,
          receiverId: receiver,
          content: faker.lorem.sentence(),
          isRead: true,
        });
        await msg.save();
        lastMessage = msg;
      }

      conversation.lastMessage = lastMessage._id;
      await conversation.save();
    }
    console.log(`   ✓ ${CONVO_COUNT} conversations`);

    console.log('\n✅ Seeding complete!');
    console.log(`   NLP embeddings: ${nlpAvailable ? 'REAL (NLP service online)' : 'MOCK FALLBACK (NLP service offline)'}`);
    console.log('   Test credentials (password: password123):');
    console.log('     student1@test.com  |  student2@test.com  |  alumni1@test.com');

  } catch (error) {
    console.error('❌ Error in Database Seeding:', error);
  }
};

module.exports = seedDatabase;
