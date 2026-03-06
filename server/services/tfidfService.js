const natural = require('natural');
const TfIdf = natural.TfIdf;

/**
 * Fallback similarity engine using TF-IDF when NLP Python service is down
 */
const calculateTfIdfSimilarity = (query, documents, threshold = 0.5) => {
  if (!documents || documents.length === 0) {
    return { matches: [], best_match: null, total_matches: 0 };
  }

  const tfidf = new TfIdf();
  
  // Add all documents to the corpus
  documents.forEach(doc => {
    tfidf.addDocument(typeof doc === 'string' ? doc : String(doc));
  });

  const matches = [];
  
  // Calculate similarity score of query against each document
  tfidf.tfidfs(query, function(i, measure) {
    // Normalize score roughly between 0-1 for small strings
    // Note: TF-IDF scores aren't strictly 0-1 like cosine similarity
    // but we'll use a relative baseline
    const score = Math.min(1.0, measure / 10.0); 
    
    if (score >= threshold) {
      matches.push({
        index: i,
        document: documents[i],
        score: parseFloat(score.toFixed(4))
      });
    }
  });

  // Sort by highest score first
  matches.sort((a, b) => b.score - a.score);

  return {
    best_match: matches.length > 0 ? matches[0] : null,
    matches,
    total_matches: matches.length,
    isFallback: true // Flag to indicate fallback was used
  };
};

module.exports = {
  calculateTfIdfSimilarity
};
