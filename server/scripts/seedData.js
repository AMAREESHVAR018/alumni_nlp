#!/usr/bin/env node

/**
 * =====================================================
 * SEED DATA SCRIPT
 * Populates database with demo data for testing
 * =====================================================
 * 
 * Usage:
 *   node scripts/seedData.js
 * 
 * What it does:
 *   1. Drops existing collections (if in development)
 *   2. Creates admin, alumni, and student users
 *   3. Creates sample questions with embeddings
 *   4. Creates job postings
 *   5. Creates answered questions for similarity matching
 *   6. Logs summary statistics
 */

require("dotenv").config({ path: __dirname + "/../.env" });

const mongoose = require("mongoose");
const bcryptjs = require("bcryptjs");

// Models
const User = require("../models/User");
const Question = require("../models/Question");
const JobPost = require("../models/JobPost");

// Constants
const USER_ROLES = {
  STUDENT: "student",
  ALUMNI: "alumni",
  ADMIN: "admin",
};

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

// Sample embedding vectors (384-dimensional for all-MiniLM-L6-v2)
// In reality, these would come from the NLP service
const generateMockEmbedding = (seed = 0) => {
  const array = new Array(384);
  for (let i = 0; i < 384; i++) {
    // Pseudo-random number based on seed
    array[i] = Math.sin(seed + i) + Math.sin((seed + i) * 0.1);
  }
  // Normalize to unit vector
  const magnitude = Math.sqrt(array.reduce((sum, val) => sum + val * val, 0));
  return array.map((val) => val / magnitude);
};

// Hash password helper
const hashPassword = async (password) => {
  return await bcryptjs.hash(password, 10);
};

// Main seeding function
const seedDatabase = async () => {
  try {
    console.log("\n=====================================================");
    console.log("Starting Database Seeding");
    console.log("=====================================================\n");

    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/alumni-chat";
    console.log(`Connecting to MongoDB: ${mongoUri}`);
    await mongoose.connect(mongoUri);
    console.log("✓ Connected to MongoDB\n");

    // Clear existing data (only in development)
    if (process.env.NODE_ENV !== "production") {
      console.log("🗑️  Clearing existing collections...");
      await User.deleteMany({});
      await Question.deleteMany({});
      await JobPost.deleteMany({});
      console.log("✓ Collections cleared\n");
    } else {
      console.log("⚠️  Skipping clear (production mode)\n");
    }

    // =====================================================
    // CREATE USERS
    // =====================================================
    console.log("👥 Creating Users...\n");

    const adminPassword = await hashPassword("AdminPass123!");
    const alumniPassword = await hashPassword("AlumniPass123!");
    const studentPassword = await hashPassword("StudentPass123!");

    // Admin User
    const admin = await User.create({
      name: "Admin User",
      email: "admin@example.com",
      password: adminPassword,
      role: USER_ROLES.ADMIN,
      university: "Tech University",
      batch: 2015,
    });
    console.log(`   ✓ Admin: admin@example.com (password: AdminPass123!)`);

    // Alumni Users
    const alumni1 = await User.create({
      name: "Jane Smith",
      email: "jane.smith@example.com",
      password: alumniPassword,
      role: USER_ROLES.ALUMNI,
      university: "Tech University",
      batch: 2018,
      company: "Google",
      position: "Senior Software Engineer",
      skills: ["Python", "Go", "Kubernetes", "System Design"],
    });
    console.log(`   ✓ Alumni 1: jane.smith@example.com`);

    const alumni2 = await User.create({
      name: "John Wilson",
      email: "john.wilson@example.com",
      password: alumniPassword,
      role: USER_ROLES.ALUMNI,
      university: "Tech University",
      batch: 2019,
      company: "Microsoft",
      position: "Product Manager",
      skills: ["Product Strategy", "Data Analysis", "Leadership"],
    });
    console.log(`   ✓ Alumni 2: john.wilson@example.com`);

    const alumni3 = await User.create({
      name: "Sarah Johnson",
      email: "sarah.johnson@example.com",
      password: alumniPassword,
      role: USER_ROLES.ALUMNI,
      university: "Tech University",
      batch: 2020,
      company: "Amazon",
      position: "Data Scientist",
      skills: ["Machine Learning", "Python", "AWS", "Statistics"],
    });
    console.log(`   ✓ Alumni 3: sarah.johnson@example.com\n`);

    // Student Users
    const student1 = await User.create({
      name: "Alice Brown",
      email: "alice.brown@example.com",
      password: studentPassword,
      role: USER_ROLES.STUDENT,
      university: "Tech University",
      batch: 2025,
    });
    console.log(`   ✓ Student 1: alice.brown@example.com (password: StudentPass123!)`);

    const student2 = await User.create({
      name: "Bob Davis",
      email: "bob.davis@example.com",
      password: studentPassword,
      role: USER_ROLES.STUDENT,
      university: "Tech University",
      batch: 2025,
    });
    console.log(`   ✓ Student 2: bob.davis@example.com\n`);

    // =====================================================
    // CREATE ANSWERED QUESTIONS (for NLP matching)
    // =====================================================
    console.log("📚 Creating Answered Questions (for similarity matching)...\n");

    const answeredQuestions = [
      {
        student_id: student1._id,
        question_text:
          "How do I prepare for software engineering interviews at big tech companies?",
        answer_text:
          "Here's a comprehensive preparation guide: 1. Data structures and algorithms (LeetCode, HackerRank) 2. System design (watch YouTube videos) 3. Behavioral questions (STAR method) 4. Mock interviews (Pramp, InterviewBit) 5. Review company specifics (products, culture)",
        category: "Interview",
        domain: "Software Engineering",
        embedding_vector: generateMockEmbedding(101),
      },
      {
        student_id: student1._id,
        question_text:
          "What is the best way to transition from student to professional software developer?",
        answer_text:
          "Transition tips: 1. Build real projects (GitHub portfolio) 2. Contribute to open source 3. Network with professionals (conferences, meetups) 4. Interview preparation (focus on fundamentals) 5. First job: Accept learning opportunity over salary 6. Keep learning (new languages, frameworks)",
        category: "Career Path",
        domain: "Software Engineering",
        embedding_vector: generateMockEmbedding(102),
      },
      {
        student_id: student2._id,
        question_text: "Which programming languages should I learn first?",
        answer_text:
          "Recommended learning path: 1. Start with Python (beginner-friendly, high demand) 2. Learn JavaScript (web development) 3. Study Java or C++ (deep understanding) 4. Explore Go or Rust (modern systems programming) 5. Don't get stuck learning languages - focus on problem solving",
        category: "Skills",
        domain: "Software Engineering",
        embedding_vector: generateMockEmbedding(103),
      },
      {
        student_id: student1._id,
        question_text: "How do I ace a product management interview?",
        answer_text:
          "PM interview strategies: 1. Master product sense (analyze apps, discuss improvements) 2. Learn metrics (DAU, NPS, retention) 3. Prepare case studies (design a feature, analyze market) 4. Behavioral: Tell stories of impact 5. Ask smart questions about strategy 6. Practice with PM circles",
        category: "Interview",
        domain: "Product Management",
        embedding_vector: generateMockEmbedding(104),
      },
      {
        student_id: student2._id,
        question_text: "How can I get an internship at a top tech company?",
        answer_text:
          "Internship application strategy: 1. Start early (sophomore/junior year) 2. Build portfolio projects 3. Network (LinkedIn, conferences) 4. Practice coding interviews 5. Tailor resume to job description 6. Apply to multiple companies 7. Interview preparation (behavioral + technical)",
        category: "Internship",
        domain: "Software Engineering",
        embedding_vector: generateMockEmbedding(105),
      },
    ];

    const createdAnsweredQuestions = await Question.insertMany(
      answeredQuestions.map((q) => ({
        ...q,
        answered_by: alumni1._id,
        status: "answered",
        isAnswered: true,
        helpful_count: Math.floor(Math.random() * 50),
        views: Math.floor(Math.random() * 200),
      }))
    );
    console.log(`   ✓ Created ${createdAnsweredQuestions.length} answered questions\n`);

    // =====================================================
    // CREATE PENDING QUESTIONS (student questions)
    // =====================================================
    console.log(\"💬 Creating Pending Questions...\n\");

    const pendingQuestions = [
      {
        student_id: student1._id,
        question_text: "What should I focus on for my first tech job?",
        category: "Career Path",
        domain: "Software Engineering",
        embedding_vector: generateMockEmbedding(201),
        status: "pending",
        isAnswered: false,
      },
      {
        student_id: student2._id,
        question_text: "How long does it take to become a good developer?",
        category: "Skills",
        domain: "Software Engineering",
        embedding_vector: generateMockEmbedding(202),
        status: "pending",
        isAnswered: false,
      },
      {
        student_id: student1._id,
        question_text: "Is it important to learn multiple programming languages?",
        category: "Education",
        domain: "Software Engineering",
        embedding_vector: generateMockEmbedding(203),
        status: "pending",
        isAnswered: false,
      },
    ];

    const createdPendingQuestions = await Question.insertMany(pendingQuestions);
    console.log(`   ✓ Created ${createdPendingQuestions.length} pending questions\n`);

    // =====================================================
    // CREATE JOB POSTINGS
    // =====================================================
    console.log(\"🎯 Creating Job Postings...\n\");

    const jobPostings = [
      {
        alumni_id: alumni1._id,
        title: "Senior Backend Engineer",
        company: "Tech Corp",
        description:
          "We are looking for a senior backend engineer with 5+ years of experience in building scalable systems. You will lead a team and work on our core infrastructure.",
        location: "San Francisco, CA",
        employment_type: "full-time",
        experience_level: "senior",
        skills_required: ["Go", "Kubernetes", "gRPC", "PostgreSQL"],
        salary_min: 200000,
        salary_max: 250000,
        link: "https://example.com/job/123",
      },
      {
        alumni_id: alumni2._id,
        title: "Product Manager - AI/ML",
        company: "Innovation Labs",
        description:
          "Lead product strategy for our new AI-powered products. You will work with engineering and design teams to bring innovative solutions to market.",
        location: "Palo Alto, CA",
        employment_type: "full-time",
        experience_level: "mid",
        skills_required: ["Product Strategy", "Data Analysis", "AI/ML"],
        salary_min: 150000,
        salary_max: 200000,
        link: "https://example.com/job/124",
      },
      {
        alumni_id: alumni3._id,
        title: "Machine Learning Engineer",
        company: "Data Systems Inc",
        description:
          "Build machine learning models and pipelines for real-time analytics. Work with distributed systems and large datasets.",
        location: "Seattle, WA",
        employment_type: "full-time",
        experience_level: "mid",
        skills_required: ["Python", "TensorFlow", "AWS", "SQL"],
        salary_min: 160000,
        salary_max: 210000,
        link: "https://example.com/job/125",
      },
      {
        alumni_id: alumni1._id,
        title: "Internship - Software Engineering",
        company: "StartUp XYZ",
        description:
          "3-month summer internship working on web development. Great opportunity to learn and contribute to a growing startup.",
        location: "Remote",
        employment_type: "internship",
        experience_level: "entry",
        skills_required: ["JavaScript", "React", "Node.js"],
        salary_min: 25000,
        salary_max: 30000,
        link: "https://example.com/job/126",
      },
    ];

    const createdJobs = await JobPost.insertMany(jobPostings);
    console.log(`   ✓ Created ${createdJobs.length} job postings\n`);

    // =====================================================
    // PRINT SUMMARY
    // =====================================================
    console.log("=====================================================");
    console.log("✓ SEED DATA CREATED SUCCESSFULLY");
    console.log("=====================================================\n");

    console.log("📊 DATABASE SUMMARY:");
    console.log(`   Users: ${await User.countDocuments()}`);
    console.log(`   --- Admins: ${await User.countDocuments({ role: USER_ROLES.ADMIN })}`);
    console.log(`   --- Alumni: ${await User.countDocuments({ role: USER_ROLES.ALUMNI })}`);
    console.log(`   --- Students: ${await User.countDocuments({ role: USER_ROLES.STUDENT })}`);
    console.log(
      `   Questions: ${await Question.countDocuments()}`
    );
    console.log(
      `   --- Answered: ${await Question.countDocuments({ isAnswered: true })}`
    );
    console.log(
      `   --- Pending: ${await Question.countDocuments({ isAnswered: false })}`
    );
    console.log(`   Job Postings: ${await JobPost.countDocuments()}\n`);

    console.log("🔐 TEST CREDENTIALS:");
    console.log(`   Admin: admin@example.com / AdminPass123!`);
    console.log(`   Alumni: jane.smith@example.com / AlumniPass123!`);
    console.log(`   Student: alice.brown@example.com / StudentPass123!\n`);

    console.log("💡 NEXT STEPS:");
    console.log(`   1. Start backend: npm start`);
    console.log(`   2. Login with above credentials`);
    console.log(`   3. Ask questions to test NLP matching`);
    console.log(`   4. Test admin analytics endpoint\n`);

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log(\"✓ Database seeding complete!\\n\");
    process.exit(0);
  } catch (error) {
    console.error(\"❌ Error during seeding:\", error);
    process.exit(1);
  }
};

// Run seeding
seedDatabase();
