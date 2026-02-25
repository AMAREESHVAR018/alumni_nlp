/**
 * Calculate cosine similarity between two vectors
 * @param {Array<number>} vecA - First vector
 * @param {Array<number>} vecB - Second vector
 * @returns {number} Cosine similarity score (0-1)
 */
const cosineSimilarity = (vecA, vecB) => {
  if (!vecA || !vecB || vecA.length !== vecB.length) {
    throw new Error("Vectors must have equal length");
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    magnitudeA += vecA[i] * vecA[i];
    magnitudeB += vecB[i] * vecB[i];
  }

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (magnitudeA * magnitudeB);
};

/**
 * Find most similar vectors
 * @param {Array<number>} queryVector - Query embedding
 * @param {Array<Array<number>>} documentVectors - List of embeddings
 * @param {number} threshold - Minimum similarity score
 * @param {number} topK - Return top K results
 * @returns {Array<Object>} Results with index and score
 */
const findTopKSimilar = (
  queryVector,
  documentVectors,
  threshold = 0.80,
  topK = 5
) => {
  if (!documentVectors || documentVectors.length === 0) {
    return [];
  }

  const similarities = documentVectors
    .map((vec, idx) => ({
      index: idx,
      score: cosineSimilarity(queryVector, vec),
    }))
    .filter((item) => item.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return similarities;
};

/**
 * Normalize vector to unit length
 * @param {Array<number>} vector - Input vector
 * @returns {Array<number>} Normalized vector
 */
const normalizeVector = (vector) => {
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  if (magnitude === 0) return vector;
  return vector.map((val) => val / magnitude);
};

module.exports = {
  cosineSimilarity,
  findTopKSimilar,
  normalizeVector,
};
