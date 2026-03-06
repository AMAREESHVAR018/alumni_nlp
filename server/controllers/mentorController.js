const User = require("../models/User");
const axios = require("axios");

/**
 * Utility: Calculate Cosine Similarity between two numeric vectors
 */
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * GET /api/mentors/recommendations/:studentId
 * Recommend alumni mentors based on AI semantic similarity
 */
exports.getMentorRecommendations = async (req, res, next) => {
  try {
    const studentId = req.params.studentId;
    
    // Authorization: admins and alumni can view any student's recommendations,
    // but students may only view their own.
    if (req.user.role !== 'admin' && req.user.role !== 'alumni' && req.user.id !== studentId) {
      return res.status(403).json({ success: false, message: "Unauthorized access to student profile." });
    }

    // 1. Fetch Student Data
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found." });
    }

    if (student.role !== 'student') {
      return res.status(400).json({ success: false, message: "Requested User ID is not a student." });
    }

    // 2. Generate Student Embedding
    let studentEmbedding = student.embedding_vector;

    // If student doesn't have an embedding cached yet, generate and save it
    if (!studentEmbedding || studentEmbedding.length === 0) {
      const summaryText = `${student.department || ''} student interested in ${student.interests ? student.interests.join(", ") : ''}. Skills: ${student.skills ? student.skills.join(", ") : ''}. Goal: ${student.career_goals || ''}`;
      
      try {
        const nlpUrl = process.env.NLP_SERVICE_URL || 'http://localhost:5001';
        const response = await axios.post(`${nlpUrl}/embed`, { text: summaryText });
        studentEmbedding = response.data.embedding; // Model returns { "embedding": [...] }

        // Save for future calls (Caching)
        student.embedding_vector = studentEmbedding;
        await student.save();
      } catch (err) {
        console.error("NLP Service disconnected. Using fallback vectors.", err.message);
        // Fallback or exit
        return res.status(503).json({ success: false, message: "NLP Embedding Service is unavailable right now." });
      }
    }

    // 3. Fetch Alumni Data (Where embedding exists)
    const alumniList = await User.find({ role: 'alumni', embedding_vector: { $exists: true, $not: { $size: 0 } } });

    if (alumniList.length === 0) {
      return res.status(200).json({ success: true, recommendedMentors: [] });
    }

    // 4. Calculate Vector Similarities
    const scoredAlumni = alumniList.map(alumni => {
      const score = cosineSimilarity(studentEmbedding, alumni.embedding_vector);
      return {
        _id: alumni._id,
        name: alumni.name,
        company: alumni.company,
        jobRole: alumni.jobTitle,
        skills: alumni.skills || [],
        profilePicture: alumni.profilePicture,
        similarityScore: Math.round(score * 100) // Convert to nice percentage
      };
    });

    // 5. Sort by descending similarity and take top 5
    scoredAlumni.sort((a, b) => b.similarityScore - a.similarityScore);
    const top5Mentors = scoredAlumni.slice(0, 5);

    // 6. Return standard format
    return res.status(200).json({
      success: true,
      recommendedMentors: top5Mentors
    });

  } catch (error) {
    next(error);
  }
};
