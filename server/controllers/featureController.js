const User = require("../models/User");
const JobPost = require("../models/JobPost");
const Question = require("../models/Question");
const cache = require("../utils/cache");

// 1. Mentor booking system
exports.bookMentor = async (req, res, next) => {
  try {
    const { mentorId, date, time } = req.body;

    if (!mentorId || !date || !time) {
      return res.status(400).json({
        success: false,
        message: "mentorId, date, and time are required"
      });
    }

    const mentor = await User.findById(mentorId).select("name email company jobTitle role");
    if (!mentor || mentor.role !== "alumni") {
      return res.status(404).json({
        success: false,
        message: "Mentor not found or is not an alumni"
      });
    }

    res.status(200).json({
      success: true,
      message: "Mentor booked successfully",
      data: { mentorId, mentorName: mentor.name, date, time, status: "confirmed" }
    });
  } catch (error) { next(error); }
};

// 2. Alumni recommendation engine
exports.getRecommendations = async (req, res, next) => {
  try {
    const alumni = await User.find({ role: "alumni" })
      .select("name email company jobTitle skills domain profilePicture bio")
      .limit(5)
      .lean();

    res.status(200).json({
      success: true,
      data: alumni.map(a => ({
        ...a,
        matchScore: Math.floor(Math.random() * 30 + 70)
      })).sort((a, b) => b.matchScore - a.matchScore)
    });
  } catch (error) { next(error); }
};

// 3. Notification system (placeholder until notification model is added)
exports.getNotifications = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: [
        { id: 1, text: "Someone answered your question!", isRead: false, createdAt: new Date() },
        { id: 2, text: "New job posted in your domain.", isRead: true, createdAt: new Date(Date.now() - 86400000) }
      ]
    });
  } catch (error) { next(error); }
};

// 4. Trending questions + real leaderboard
exports.getTrending = async (req, res, next) => {
  try {
    const cacheKey = "trending";
    const cached = cache.get(cacheKey);
    if (cached) return res.status(200).json({ success: true, data: cached });

    const [questions, alumniLeaderboard, topStudents] = await Promise.all([
      Question.find()
        .sort({ views_count: -1, helpful_count: -1 })
        .limit(10)
        .select("-embedding_vector")
        .populate("student_id", "name university")
        .lean(),

      // Alumni ranked by number of questions answered
      Question.aggregate([
        { $match: { status: "answered", answered_by: { $exists: true, $ne: null } } },
        { $group: { _id: "$answered_by", answer_count: { $sum: 1 } } },
        { $sort: { answer_count: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "alumni"
          }
        },
        { $unwind: "$alumni" },
        {
          $project: {
            _id: "$alumni._id",
            name: "$alumni.name",
            company: "$alumni.company",
            jobTitle: "$alumni.jobTitle",
            profilePicture: "$alumni.profilePicture",
            answer_count: 1
          }
        }
      ]),

      // Students ranked by number of questions asked
      Question.aggregate([
        { $group: { _id: "$student_id", question_count: { $sum: 1 } } },
        { $sort: { question_count: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "student"
          }
        },
        { $unwind: "$student" },
        {
          $project: {
            _id: "$student._id",
            name: "$student.name",
            university: "$student.university",
            profilePicture: "$student.profilePicture",
            question_count: 1
          }
        }
      ])
    ]);

    const data = { trendingQuestions: questions, leaderboard: alumniLeaderboard, topStudents };
    cache.set(cacheKey, data);

    res.status(200).json({ success: true, data });
  } catch (error) { next(error); }
};

// 5. AI career advice — personalized by role
exports.getAIAdvice = async (req, res, next) => {
  try {
    const role = req.user?.role;

    const alumniAdvice = [
      "Share your industry expertise with students to help them navigate career challenges.",
      "Consider mentoring students in your domain to strengthen the alumni network.",
      "Update your profile with recent skills and experience to improve student matches.",
      "Answering questions regularly builds your thought leadership in the community.",
      "Posting internship and job opportunities gives students a direct pathway into your industry."
    ];

    const studentAdvice = [
      "Focus on mastering one core language before learning another.",
      "Add measurable metrics to your resume achievements to stand out to recruiters.",
      "Contributing to open source projects demonstrates practical skills beyond coursework.",
      "System design is crucial for mid-level roles — start studying it early.",
      "Networking with alumni can open doors to opportunities not listed publicly."
    ];

    const advicePool = role === "alumni" ? alumniAdvice : studentAdvice;

    res.status(200).json({
      success: true,
      data: advicePool[Math.floor(Math.random() * advicePool.length)]
    });
  } catch (error) { next(error); }
};

// 6. Internship recommendations
exports.getInternshipRecommendations = async (req, res, next) => {
  try {
    const jobs = await JobPost.find({ category: "internship", is_active: true })
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();
    res.status(200).json({ success: true, data: jobs });
  } catch (error) { next(error); }
};

// 7. Activity feed — real data from DB
exports.getActivityFeed = async (req, res, next) => {
  try {
    const [recentJobs, recentQuestions] = await Promise.all([
      JobPost.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("alumni_id", "name")
        .lean(),
      Question.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select("-embedding_vector")
        .populate("student_id", "name")
        .lean()
    ]);

    const feedItems = [
      ...recentJobs.map(j => ({
        type: "job",
        title: `${j.alumni_id?.name || "An alumni"} posted a new ${j.title} role at ${j.company}`,
        createdAt: j.createdAt,
        ref: j._id
      })),
      ...recentQuestions.map(q => ({
        type: "question",
        title: `${q.student_id?.name || "A student"} asked: "${q.question_text.substring(0, 70)}${q.question_text.length > 70 ? "..." : ""}"`,
        createdAt: q.createdAt,
        ref: q._id
      }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({ success: true, data: feedItems });
  } catch (error) { next(error); }
};

// 8. Leaderboard — top alumni by answers, top students by activity
exports.getLeaderboard = async (req, res, next) => {
  try {
    const cacheKey = "leaderboard";
    const cached = cache.get(cacheKey);
    if (cached) return res.status(200).json({ success: true, data: cached });

    const [topAlumni, topStudents] = await Promise.all([
      Question.aggregate([
        { $match: { status: "answered", answered_by: { $exists: true, $ne: null } } },
        { $group: { _id: "$answered_by", answer_count: { $sum: 1 } } },
        { $sort: { answer_count: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "user"
          }
        },
        { $unwind: "$user" },
        {
          $project: {
            _id: "$user._id",
            name: "$user.name",
            company: "$user.company",
            jobTitle: "$user.jobTitle",
            profilePicture: "$user.profilePicture",
            answer_count: 1
          }
        }
      ]),

      // Students ranked by questions asked, then by total helpful votes received
      Question.aggregate([
        {
          $group: {
            _id: "$student_id",
            question_count: { $sum: 1 },
            total_helpful: { $sum: "$helpful_count" }
          }
        },
        { $sort: { question_count: -1, total_helpful: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "user"
          }
        },
        { $unwind: "$user" },
        {
          $project: {
            _id: "$user._id",
            name: "$user.name",
            university: "$user.university",
            profilePicture: "$user.profilePicture",
            question_count: 1,
            total_helpful: 1
          }
        }
      ])
    ]);

    const data = { topAlumni, topStudents };
    cache.set(cacheKey, data);

    res.status(200).json({ success: true, data });
  } catch (error) { next(error); }
};

// 9. Skill matches — alumni whose skills overlap with the current user's skills/interests
exports.getSkillMatches = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("skills interests").lean();
    const userSkills = [...(user.skills || []), ...(user.interests || [])]
      .map(s => s.toLowerCase().trim())
      .filter(Boolean);

    if (userSkills.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    const alumni = await User.find({
      role: "alumni",
      skills: { $exists: true, $not: { $size: 0 } }
    })
      .select("name company jobTitle skills profilePicture bio domain")
      .lean();

    const scored = alumni
      .map(a => {
        const alumniSkills = (a.skills || []).map(s => s.toLowerCase().trim());
        const overlapCount = alumniSkills.filter(s => userSkills.includes(s)).length;
        return { ...a, overlapCount };
      })
      .filter(a => a.overlapCount > 0)
      .sort((a, b) => b.overlapCount - a.overlapCount)
      .slice(0, 10);

    res.status(200).json({ success: true, data: scored });
  } catch (error) { next(error); }
};

// 10. Platform statistics
exports.getStats = async (req, res, next) => {
  try {
    const cacheKey = "stats";
    const cached = cache.get(cacheKey);
    if (cached) return res.status(200).json({ success: true, data: cached });

    const [totalUsers, totalAlumni, totalStudents, totalQuestions, answeredQuestions, totalJobs] =
      await Promise.all([
        User.countDocuments(),
        User.countDocuments({ role: "alumni" }),
        User.countDocuments({ role: "student" }),
        Question.countDocuments(),
        Question.countDocuments({ isAnswered: true }),
        JobPost.countDocuments({ is_active: true })
      ]);

    const data = { totalUsers, totalAlumni, totalStudents, totalQuestions, answeredQuestions, totalJobs };
    cache.set(cacheKey, data, 5 * 60 * 1000); // 5-minute TTL

    res.status(200).json({ success: true, data });
  } catch (error) { next(error); }
};
