/**
 * TF-IDF Fallback for NLP Service
 * 
 * Used when the Python Flask NLP service is unavailable.
 * Computes simple TF-IDF similarity between query and candidate questions.
 */

const computeTFIDF = (query, candidateQuestions) => {
  if (!candidateQuestions || candidateQuestions.length === 0) {
    return { bestMatch: null, score: 0 };
  }

  const extractWords = (str) => String(str).toLowerCase().match(/\w+/g) || [];
  
  const docCount = candidateQuestions.length;
  const documentWords = candidateQuestions.map(q => extractWords(q.question_text));
  const wordDocMap = {};

  documentWords.forEach(words => {
      const uniqueWords = new Set(words);
      uniqueWords.forEach(w => {
          wordDocMap[w] = (wordDocMap[w] || 0) + 1;
      });
  });

  const idf = (word) => Math.log(docCount / ((wordDocMap[word] || 0) + 1)) + 1;

  const queryWords = extractWords(query);
  const queryTf = {};
  queryWords.forEach(w => { queryTf[w] = (queryTf[w] || 0) + 1; });

  let bestDoc = null;
  let maxScore = 0;

  candidateQuestions.forEach((doc, idx) => {
      const tf = {};
      documentWords[idx].forEach(w => { tf[w] = (tf[w] || 0) + 1; });

      let score = 0;
      Object.keys(queryTf).forEach(word => {
          if (tf[word]) {
              const idfVal = idf(word);
              score += queryTf[word] * idfVal * tf[word] * idfVal;
          }
      });
      
      const normQ = Math.sqrt(Object.keys(queryTf).reduce((sum, w) => sum + Math.pow(queryTf[w] * idf(w), 2), 0));
      const normD = Math.sqrt(Object.keys(tf).reduce((sum, w) => sum + Math.pow(tf[w] * idf(w), 2), 0));

      let finalScore = 0;
      if (normQ > 0 && normD > 0) {
          finalScore = score / (normQ * normD);
      }

      if (finalScore > maxScore) {
          maxScore = finalScore;
          bestDoc = doc;
      }
  });

  return { bestMatch: bestDoc, score: maxScore };
};

module.exports = {
  computeTFIDF
};
