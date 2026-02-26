from flask import Flask, request, jsonify
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import logging
import numpy as np

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Load model with error handling
try:
    model = SentenceTransformer('all-MiniLM-L6-v2')
    logger.info("Model loaded successfully")
except Exception as e:
    logger.error(f"Failed to load model: {e}")
    model = None


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    if model is not None:
        return jsonify({'status': 'healthy', 'model': 'loaded'}), 200
    return jsonify({'status': 'unhealthy', 'model': 'not loaded'}), 500


@app.route('/embed', methods=['POST'])
def embed():
    """Generate embedding for a given text"""
    try:
        if model is None:
            return jsonify({'error': 'Model not loaded'}), 500
        
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({'error': 'Missing text field'}), 400
        
        text = data['text']
        if not isinstance(text, str) or not text.strip():
            return jsonify({'error': 'Text must be non-empty string'}), 400
        
        embedding = model.encode(text).tolist()
        return jsonify({'embedding': embedding}), 200
    
    except Exception as e:
        logger.error(f"Error in embed: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/similarity', methods=['POST'])
def similarity():
    """Calculate similarity between a query and multiple documents"""
    try:
        if model is None:
            return jsonify({'error': 'Model not loaded'}), 500
        
        data = request.get_json()
        if not data or 'query' not in data or 'documents' not in data:
            return jsonify({'error': 'Missing query or documents field'}), 400
        
        query = data['query']
        documents = data['documents']
        threshold = data.get('threshold', 0.80)
        
        if not isinstance(query, str) or not query.strip():
            return jsonify({'error': 'Query must be non-empty string'}), 400
        
        if not isinstance(documents, list) or len(documents) == 0:
            return jsonify({'error': 'Documents must be non-empty list'}), 400
        
        # Generate embeddings
        query_embedding = model.encode(query)
        document_embeddings = model.encode(documents)
        
        # Calculate similarities
        similarities = cosine_similarity([query_embedding], document_embeddings)[0]
        
        # Create results
        results = []
        for idx, similarity_score in enumerate(similarities):
            if similarity_score >= threshold:
                results.append({
                    'index': idx,
                    'document': documents[idx],
                    'score': float(similarity_score)
                })
        
        # Sort by score descending
        results.sort(key=lambda x: x['score'], reverse=True)
        
        return jsonify({
            'query': query,
            'threshold': threshold,
            'total_matches': len(results),
            'matches': results,
            'best_match': results[0] if results else None
        }), 200
    
    except Exception as e:
        logger.error(f"Error in similarity: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/batch-similarity', methods=['POST'])
def batch_similarity():
    """Calculate similarity between multiple queries and documents"""
    try:
        if model is None:
            return jsonify({'error': 'Model not loaded'}), 500
        
        data = request.get_json()
        if not data or 'queries' not in data or 'documents' not in data:
            return jsonify({'error': 'Missing queries or documents field'}), 400
        
        queries = data['queries']
        documents = data['documents']
        threshold = data.get('threshold', 0.80)
        
        if not isinstance(queries, list) or len(queries) == 0:
            return jsonify({'error': 'Queries must be non-empty list'}), 400
        
        if not isinstance(documents, list) or len(documents) == 0:
            return jsonify({'error': 'Documents must be non-empty list'}), 400
        
        # Generate embeddings
        query_embeddings = model.encode(queries)
        document_embeddings = model.encode(documents)
        
        # Calculate similarities for all queries
        batch_results = []
        for q_idx, query_embedding in enumerate(query_embeddings):
            similarities = cosine_similarity([query_embedding], document_embeddings)[0]
            
            matches = []
            for doc_idx, similarity_score in enumerate(similarities):
                if similarity_score >= threshold:
                    matches.append({
                        'index': doc_idx,
                        'document': documents[doc_idx],
                        'score': float(similarity_score)
                    })
            
            matches.sort(key=lambda x: x['score'], reverse=True)
            
            batch_results.append({
                'query': queries[q_idx],
                'matches': matches,
                'best_match': matches[0] if matches else None
            })
        
        return jsonify({
            'threshold': threshold,
            'results': batch_results
        }), 200
    
    except Exception as e:
        logger.error(f"Error in batch_similarity: {e}")
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=False)
