import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { questionAPI } from '../services/api';

const Questions = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ status: '', category: '', page: 1, limit: 10 });
  const [showForm, setShowForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState({ question_text: '', category: '', domain: '' });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await questionAPI.getAllQuestions(filters);
      setQuestions(response.data.data || []);
      setTotal(response.data.pagination?.total || 0);
    } catch (error) {
      console.error('Error fetching questions:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAskQuestion = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      const response = await questionAPI.ask(newQuestion);
      setNewQuestion({ question_text: '', category: '', domain: '' });
      setShowForm(false);
      fetchQuestions();
      
      // Show notification
      if (response.data.data?.matched) {
        alert(`Similar answer found! Similarity score: ${(response.data.data.similarityScore * 100).toFixed(1)}%`);
      }
    } catch (error) {
      alert('Error submitting question: ' + (error.response?.data?.message || error.message));
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <>
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Questions & Answers</h1>
          <Link to="/dashboard" className="text-blue-500 hover:text-blue-700">Back</Link>
        </div>

        {/* Ask Question Form */}
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="mb-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition font-semibold"
          >
            + Ask a Question
          </button>
        ) : (
          <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">Ask a Question</h2>
            <form onSubmit={handleAskQuestion} className="space-y-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Your Question *</label>
                <textarea
                  value={newQuestion.question_text}
                  onChange={(e) => setNewQuestion({ ...newQuestion, question_text: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  rows="4"
                  placeholder="Ask your question here..."
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Category</label>
                  <select
                    value={newQuestion.category}
                    onChange={(e) => setNewQuestion({ ...newQuestion, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select category</option>
                    <option value="Career Path">Career Path</option>
                    <option value="Skills">Skills</option>
                    <option value="Job Search">Job Search</option>
                    <option value="Interview">Interview</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Domain</label>
                  <input
                    type="text"
                    value={newQuestion.domain}
                    onChange={(e) => setNewQuestion({ ...newQuestion, domain: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="e.g., Software Engineering"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-lg disabled:opacity-50"
                >
                  {submitLoading ? 'Submitting...' : 'Submit Question'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6 flex gap-4">
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="assigned">Assigned</option>
            <option value="answered">Answered</option>
          </select>
          <select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value, page: 1 })}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">All Categories</option>
            <option value="Career Path">Career Path</option>
            <option value="Skills">Skills</option>
            <option value="Job Search">Job Search</option>
            <option value="Interview">Interview</option>
          </select>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 text-center">
            {error}
          </div>
        )}

        {/* Questions List */}
        {loading ? (
          <div className="text-center text-gray-500">Loading...</div>
        ) : !questions || questions?.length === 0 ? (
          <div className="text-center text-gray-500">No questions found</div>
        ) : (
          <div className="space-y-4">
            {questions?.map((q) => (
              <Link key={q._id} to={`/question/${q._id}`}>
                <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-800 mb-2">{q.question_text}</h3>
                      <div className="flex gap-3 text-sm text-gray-600">
                        <span className="bg-blue-100 px-2 py-1 rounded">{q.status}</span>
                        {q.category && <span className="bg-green-100 px-2 py-1 rounded">{q.category}</span>}
                        {q.domain && <span className="bg-purple-100 px-2 py-1 rounded">{q.domain}</span>}
                      </div>
                      <p className="text-gray-600 mt-2">Asked by: <strong>{q.student_id?.name}</strong></p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl text-gray-400">{q.views} 👁️</div>
                      {q.isAnswered && <span className="text-green-600 font-semibold">✓ Answered</span>}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {total > filters.limit && (
          <div className="mt-6 flex justify-center gap-2">
            {Array.from({ length: Math.ceil(total / filters.limit) }).map((_, i) => (
              <button
                key={i + 1}
                onClick={() => setFilters({ ...filters, page: i + 1 })}
                className={`px-3 py-1 rounded ${
                  filters.page === i + 1 ? 'bg-blue-500 text-white' : 'bg-white border border-gray-300'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
    </>
  );
};

export default Questions;
