from flask import Flask, request, jsonify
from flask_cors import CORS
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import logging
import numpy as np
import faiss

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize FAISS Index (all-MiniLM-L6-v2 outputs 384-dimensional vectors)
EMBEDDING_DIM = 384
try:
    faiss_index = faiss.IndexFlatL2(EMBEDDING_DIM)
    faiss_metadata = [] # Stores { "id": str, "metadata": dict } corresponding to internal array index
    logger.info("FAISS Index initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize FAISS: {e}")
    faiss_index = None
    faiss_metadata = []

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
        return jsonify({'status': 'ok', 'model': 'all-MiniLM-L6-v2'}), 200
    return jsonify({'status': 'error', 'model': 'not loaded'}), 500


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
        
        # Create results with spec-compliant field names (text, score)
        results = []
        for idx, similarity_score in enumerate(similarities):
            if similarity_score >= threshold:
                results.append({
                    'index': idx,
                    'text': documents[idx],
                    'score': float(similarity_score)
                })
        
        # Sort by score descending
        results.sort(key=lambda x: x['score'], reverse=True)
        
        return jsonify({
            'query': query,
            'threshold': threshold,
            'total_matches': len(results),
            'results': results,
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


@app.route('/faiss/add', methods=['POST'])
def faiss_add():
    """Add a vector and metadata to the local FAISS index"""
    try:
        if faiss_index is None:
            return jsonify({'error': 'FAISS not initialized'}), 500
        
        data = request.get_json()
        if not data or 'id' not in data or 'vector' not in data:
            return jsonify({'error': 'Missing id or vector field'}), 400
        
        vector = np.array([data['vector']], dtype=np.float32)
        
        # Add to FAISS index
        faiss_index.add(vector)
        
        # Add to metadata store
        faiss_metadata.append({
            'id': data['id'],
            'metadata': data.get('metadata', {})
        })
        
        return jsonify({'success': True, 'indexed_count': faiss_index.ntotal}), 200
    except Exception as e:
        logger.error(f"Error in faiss_add: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/faiss/search', methods=['POST'])
def faiss_search():
    """Search for similar vectors in the local FAISS index"""
    try:
        if faiss_index is None:
            return jsonify({'error': 'FAISS not initialized'}), 500
            
        if faiss_index.ntotal == 0:
            return jsonify({'matches': []}), 200
        
        data = request.get_json()
        if not data or 'vector' not in data:
            return jsonify({'error': 'Missing vector field'}), 400
            
        vector = np.array([data['vector']], dtype=np.float32)
        top_k = data.get('top_k', 5)
        
        # Make sure we don't request more than we have
        k = min(top_k, faiss_index.ntotal)
        
        # Search FAISS (distances are squared L2 distances)
        distances, indices = faiss_index.search(vector, k)
        
        matches = []
        for i, idx in enumerate(indices[0]):
            if idx != -1 and idx < len(faiss_metadata):
                # Convert L2 distance to an approximate similarity score (0 to 1)
                # This is a rough heuristic: cosine similarity is monotonically related to L2 distance for normalized vectors
                # all-MiniLM-L6-v2 outputs are normalized, so distance ranges from 0 to 4
                similarity = max(0.0, 1.0 - (distances[0][i] / 4.0)) 
                
                meta_record = faiss_metadata[idx]
                matches.append({
                    'id': meta_record['id'],
                    'score': float(similarity),
                    'metadata': meta_record['metadata']
                })
                
        return jsonify({'matches': matches}), 200
    except Exception as e:
        logger.error(f"Error in faiss_search: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/career-advice', methods=['POST'])
def career_advice():
    """Generate personalized career advice based on user query and context"""
    try:
        if model is None:
            return jsonify({'error': 'Model not loaded'}), 500
        
        data = request.get_json()
        if not data or 'query' not in data:
            return jsonify({'error': 'Missing query field'}), 400

        query = data.get('query', '')
        context = data.get('context', [])  # Optional list of context strings

        # Build combined input from query + context
        context_text = ' '.join(context) if context else ''
        profile_text = f"{query} {context_text}".strip()
        
        # Predefined career advice pool with embeddings
        advice_pool = [
            {"text": "Focus on building end-to-end projects that demonstrate your full-stack capabilities.", "skills": ["full-stack", "project management"]},
            {"text": "Contribute to open source projects to build your portfolio and network with professionals.", "skills": ["open source", "networking", "git"]},
            {"text": "Master one cloud platform (AWS/GCP/Azure) - cloud skills are in high demand.", "skills": ["AWS", "cloud", "DevOps"]},
            {"text": "Practice system design interviews - it's the key differentiator for senior roles.", "skills": ["system design", "architecture", "scalability"]},
            {"text": "Build your personal brand on LinkedIn and write technical articles to stand out.", "skills": ["communication", "branding", "LinkedIn"]},
            {"text": "Learn data structures and algorithms deeply - they form the foundation of technical interviews.", "skills": ["algorithms", "data structures", "problem solving"]},
            {"text": "Seek internships early - practical experience significantly outweighs academic projects.", "skills": ["internship", "practical experience"]},
            {"text": "Network actively with alumni in your target industry before you need a job.", "skills": ["networking", "communication", "alumni relations"]},
            {"text": "Specialize in a niche area (ML, security, mobile) rather than being a generalist early in your career.", "skills": ["machine learning", "specialization", "mobile development"]},
            {"text": "Build soft skills: communication and leadership are what promote you beyond senior engineer.", "skills": ["communication", "leadership", "teamwork"]},
        ]
        
        advice_texts = [a["text"] for a in advice_pool]
        
        profile_embedding = model.encode(profile_text)
        advice_embeddings = model.encode(advice_texts)
        
        similarities = cosine_similarity([profile_embedding], advice_embeddings)[0]
        
        # Get top 3 most relevant pieces of advice
        top_indices = similarities.argsort()[-3:][::-1]
        top_advice = advice_pool[int(top_indices[0])]
        
        # Collect unique skills from top-3 advice items
        all_skills = []
        for i in top_indices:
            all_skills.extend(advice_pool[int(i)]["skills"])
        unique_skills = list(dict.fromkeys(all_skills))  # dedup preserving order
        
        return jsonify({
            'advice': top_advice["text"],
            'skills': unique_skills,
            'all_advice': [advice_pool[int(i)]["text"] for i in top_indices]
        }), 200
        
    except Exception as e:
        logger.error(f"Error in career_advice: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/cluster', methods=['POST'])
def cluster_texts():
    """Cluster texts into groups using K-means on embeddings"""
    try:
        if model is None:
            return jsonify({'error': 'Model not loaded'}), 500
        
        data = request.get_json()
        texts = data.get('texts', [])
        n_clusters = data.get('n_clusters', 3)
        
        if not texts or len(texts) < 2:
            return jsonify({'error': 'Need at least 2 texts'}), 400
        
        n_clusters = min(n_clusters, len(texts))
        
        embeddings = model.encode(texts)
        
        from sklearn.cluster import KMeans
        kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        labels = kmeans.fit_predict(embeddings)
        
        clusters = {}
        for i, label in enumerate(labels):
            key = int(label)
            if key not in clusters:
                clusters[key] = []
            clusters[key].append({'index': i, 'text': texts[i]})
        
        return jsonify({
            'n_clusters': n_clusters,
            'clusters': clusters
        }), 200
        
    except Exception as e:
        logger.error(f"Error in cluster: {e}")
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=False)
