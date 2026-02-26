import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { questionAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const QuestionDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [answerText, setAnswerText] = useState('');
  const [answerLoading, setAnswerLoading] = useState(false);

  useEffect(() => {
    fetchQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchQuestion = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await questionAPI.getQuestion(id);
      setQuestion(response.data.data);
    } catch (error) {
      console.error('Error fetching question:', error);
      setError('Failed to load question details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    setAnswerLoading(true);
    try {
      await questionAPI.answer(id, { answer_text: answerText });
      setAnswerText('');
      fetchQuestion();
    } catch (error) {
      alert('Error submitting answer: ' + (error.response?.data?.message || error.message));
    } finally {
      setAnswerLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!question) {
    return <div className="min-h-screen flex items-center justify-center">Question not found</div>;
  }

  return (
    <>
        <Link to="/questions" className="text-blue-500 hover:text-blue-700 mb-4 block">← Back to Questions</Link>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 text-center">
            {error}
          </div>
        )}

        {/* Question */}
        <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">{question.question_text}</h1>
          
          <div className="flex gap-3 mb-4">
            <span className="bg-blue-100 px-3 py-1 rounded">{question.status}</span>
            {question.category && <span className="bg-green-100 px-3 py-1 rounded">{question.category}</span>}
            {question.domain && <span className="bg-purple-100 px-3 py-1 rounded">{question.domain}</span>}
          </div>

          <div className="border-t pt-4 text-gray-600">
            <p className="text-sm">Asked by <strong>{question.student_id?.name}</strong> ({new Date(question.createdAt).toLocaleDateString()})</p>
            <p className="text-sm mt-2">Views: {question.views} | Helpful: {question.helpful_count}</p>
          </div>
        </div>

        {/* Similar Answer Notification */}
        {question.matched_question_id && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-800 font-semibold mb-2">💡 Similar Answer Found</p>
            <p className="text-green-700 mb-2">Similarity Score: {(question.similarity_score * 100).toFixed(1)}%</p>
            <p className="text-green-700">Original Question: {question.matched_question_id?.question_text}</p>
          </div>
        )}

        {/* Answer Section */}
        {question.isAnswered && question.answer_text && (
          <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition p-6 mb-6 border-l-4 border-green-500">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">✓ Answer</h2>
            <p className="text-gray-700 mb-4 whitespace-pre-wrap">{question.answer_text}</p>
            <div className="border-t pt-4 text-gray-600 text-sm">
              <p>Answered by <strong>{question.answered_by?.name}</strong> ({question.answered_by?.company})</p>
              <p>Answered on {new Date(question.updatedAt).toLocaleDateString()}</p>
            </div>
            <div className="mt-4">
              <button
                onClick={() => questionAPI.markHelpful(id)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
              >
                👍 Mark as Helpful
              </button>
            </div>
          </div>
        )}

        {/* Answer Form (for assigned alumni) */}
        {!question.isAnswered && question.assigned_to?._id === user?.id && (
          <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Provide Answer</h2>
            <form onSubmit={handleSubmitAnswer} className="space-y-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Your Answer</label>
                <textarea
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  rows="6"
                  placeholder="Provide your detailed answer here..."
                  required
                />
              </div>
              <button
                type="submit"
                disabled={answerLoading}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-lg disabled:opacity-50"
              >
                {answerLoading ? 'Submitting...' : 'Submit Answer'}
              </button>
            </form>
          </div>
        )}

        {!question.isAnswered && question.status === 'pending' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">This question is pending. An alumnus will be assigned to answer it soon.</p>
          </div>
        )}
    </>
  );
};

export default QuestionDetail;
