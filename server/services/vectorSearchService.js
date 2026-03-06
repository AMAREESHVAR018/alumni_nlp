const { Pinecone } = require('@pinecone-database/pinecone');
const axios = require('axios');
const logger = require('../utils/logger');

// Initialize Pinecone Client if env vars exist
let pineconeIndex = null;
let usePinecone = false;

try {
  if (process.env.PINECONE_API_KEY) {
    const pc = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });
    // Fallback to "alumni-questions" if index not specified
    const indexName = process.env.PINECONE_INDEX || "alumni-questions"; 
    pineconeIndex = pc.index(indexName);
    usePinecone = true;
    logger.info(`[VECTOR DB] Pinecone initialized for index: ${indexName}`);
  } else {
    logger.info(`[VECTOR DB] PINECONE_API_KEY not found. Falling back to local FAISS via NLP service.`);
  }
} catch (error) {
  logger.warn(`[VECTOR DB] Failed to initialize Pinecone, falling back to FAISS: ${error.message}`);
  usePinecone = false;
}

const NLP_URL = process.env.NLP_SERVICE_URL || 'http://localhost:5001';

/**
 * Store Question Embedding to Vector Database
 * 
 * @param {Object} question - The Question mongoose document 
 */
exports.storeQuestionEmbedding = async (question) => {
  if (!question || !question.embedding_vector || !question.embedding_vector.length) {
    return false;
  }

  // Common metadata to store alongside the vector
  const metadata = {
    question_text: question.question_text,
    category: question.category,
    domain: question.domain,
    status: question.status,
    answered_by: question.answered_by ? question.answered_by.toString() : null
  };

  try {
    if (usePinecone && pineconeIndex) {
      // Pinecone DB Upsert
      await pineconeIndex.upsert([{
        id: question._id.toString(),
        values: question.embedding_vector,
        metadata: metadata
      }]);
      logger.info(`[VECTOR DB] Stored question ${question._id} in Pinecone`);
      return true;
    } else {
      // Local FAISS Python Upsert
      await axios.post(`${NLP_URL}/faiss/add`, {
        id: question._id.toString(),
        vector: question.embedding_vector,
        metadata: metadata
      });
      logger.info(`[VECTOR DB] Stored question ${question._id} in FAISS`);
      return true;
    }
  } catch (error) {
    logger.error(`[VECTOR DB ERROR] Failed to store embedding for question ${question._id}: ${error.message}`);
    return false;
  }
};

/**
 * Search Similar Questions
 * 
 * @param {Array<number>} queryEmbedding - The 384-dimensional vector of the student's question
 * @param {number} topK - Number of results to fetch
 * @returns {Promise<Array>} List of matches formatted generically 
 */
exports.searchSimilarQuestions = async (queryEmbedding, topK = 5) => {
  if (!queryEmbedding || !queryEmbedding.length) {
    return [];
  }

  try {
    if (usePinecone && pineconeIndex) {
      // Pinecone Search
      const queryResponse = await pineconeIndex.query({
        vector: queryEmbedding,
        topK: topK,
        includeMetadata: true
      });

      return queryResponse.matches.map(match => ({
        questionId: match.id,
        score: match.score,
        metadata: match.metadata
      }));

    } else {
      // FAISS Python Search
      const response = await axios.post(`${NLP_URL}/faiss/search`, {
        vector: queryEmbedding,
        top_k: topK
      });

      return response.data.matches.map(match => ({
        questionId: match.id,
        score: match.score,
        metadata: match.metadata
      }));
    }
  } catch (error) {
    logger.error(`[VECTOR DB ERROR] Semantic search failed: ${error.message}`);
    return []; // Return empty array to fallback easily
  }
};
