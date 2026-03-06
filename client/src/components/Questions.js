import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { questionAPI } from '../services/api';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Skeleton } from './ui/Skeleton';
import toast from 'react-hot-toast';

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
        toast.success(`Similar answer found! Similarity score: ${(response.data.data.similarityScore * 100).toFixed(1)}%`);
      } else {
        toast.success("Question submitted successfully");
      }
    } catch (error) {
      toast.error('Error submitting question: ' + (error.response?.data?.message || error.message));
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <>
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Questions & Answers</h1>
        </div>

        {/* Ask Question Form */}
        {!showForm ? (
          <Button
            onClick={() => setShowForm(true)}
            className="mb-6"
          >
            + Ask a Question
          </Button>
        ) : (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <h2 className="text-2xl font-bold mb-4 text-foreground">Ask a Question</h2>
              <form onSubmit={handleAskQuestion} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Your Question *</label>
                  <textarea
                    value={newQuestion.question_text}
                    onChange={(e) => setNewQuestion({ ...newQuestion, question_text: e.target.value })}
                    className="flex min-h-[80px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    rows="4"
                    placeholder="Ask your question here..."
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Category</label>
                    <select
                      value={newQuestion.category}
                      onChange={(e) => setNewQuestion({ ...newQuestion, category: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    >
                      <option value="">Select category</option>
                      <option value="Career Path">Career Path</option>
                      <option value="Skills">Skills</option>
                      <option value="Job Search">Job Search</option>
                      <option value="Interview">Interview</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Domain</label>
                    <Input
                      type="text"
                      value={newQuestion.domain}
                      onChange={(e) => setNewQuestion({ ...newQuestion, domain: e.target.value })}
                      placeholder="e.g., Software Engineering"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    type="submit"
                    isLoading={submitLoading}
                  >
                    Submit Question
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4 flex flex-col sm:flex-row gap-4">
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
              className="flex h-10 w-full sm:w-auto rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="assigned">Assigned</option>
              <option value="answered">Answered</option>
            </select>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value, page: 1 })}
              className="flex h-10 w-full sm:w-auto rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <option value="">All Categories</option>
              <option value="Career Path">Career Path</option>
              <option value="Skills">Skills</option>
              <option value="Job Search">Job Search</option>
              <option value="Interview">Interview</option>
            </select>
          </CardContent>
        </Card>

        {error && (
          <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-md mb-6 text-center text-sm">
            {error}
          </div>
        )}

        {/* Questions List */}
        {loading ? (
          <div className="space-y-4">
             {[1, 2, 3].map(i => (
                <Card key={i}><CardContent className="p-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
             ))}
          </div>
        ) : !questions || questions?.length === 0 ? (
          <div className="text-center text-muted-foreground py-10">No questions found</div>
        ) : (
          <div className="space-y-4">
            {questions?.map((q) => (
              <Link key={q._id} to={`/question/${q._id}`} className="block focus:outline-none">
                <Card className="hover:border-primary/50 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-foreground mb-3">{q.question_text}</h3>
                        <div className="flex flex-wrap gap-2 text-xs font-medium">
                          <span className="bg-primary/10 text-primary px-2.5 py-1 rounded-md capitalize">{q.status}</span>
                          {q.category && <span className="bg-secondary text-secondary-foreground px-2.5 py-1 rounded-md">{q.category}</span>}
                          {q.domain && <span className="bg-secondary text-secondary-foreground px-2.5 py-1 rounded-md">{q.domain}</span>}
                        </div>
                        <p className="text-muted-foreground mt-4 text-sm">Asked by: <span className="text-foreground">{q.student_id?.name}</span></p>
                      </div>
                      <div className="text-right flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto mt-4 md:mt-0">
                        <div className="text-sm text-muted-foreground flex items-center gap-1.5 bg-secondary px-2 py-1 rounded-md">
                          <span className="text-lg">👁️</span> {q.views}
                        </div>
                        {q.isAnswered && <span className="text-success font-semibold text-sm mt-0 md:mt-4 flex items-center gap-1"><span className="text-lg">✓</span> Answered</span>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination justify-between mt-6 */}
        {total > filters.limit && (
          <div className="mt-8 flex justify-center gap-2">
            {Array.from({ length: Math.ceil(total / filters.limit) }).map((_, i) => (
              <Button
                key={i + 1}
                onClick={() => setFilters({ ...filters, page: i + 1 })}
                variant={filters.page === i + 1 ? 'primary' : 'outline'}
                className="w-10 h-10 p-0"
              >
                {i + 1}
              </Button>
            ))}
          </div>
        )}
    </>
  );
};

export default Questions;
