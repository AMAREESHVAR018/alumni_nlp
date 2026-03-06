import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { questionAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Skeleton } from './ui/Skeleton';
import toast from 'react-hot-toast';

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
      toast.success('Answer submitted successfully');
      fetchQuestion();
    } catch (error) {
      toast.error('Error submitting answer: ' + (error.response?.data?.message || error.message));
    } finally {
      setAnswerLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!question) {
    return <div className="min-h-screen flex items-center justify-center">Question not found</div>;
  }

  return (
    <>
        <Link to="/questions" className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center text-sm font-medium transition-colors">
          <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Questions
        </Link>

        {error && (
          <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-md mb-6 text-center text-sm">
            {error}
          </div>
        )}

        {/* Question */}
        <Card className="mb-6">
          <CardContent className="p-6 md:p-8">
            <h1 className="text-3xl font-bold text-foreground tracking-tight mb-6">{question.question_text}</h1>
            
            <div className="flex flex-wrap gap-2 text-sm font-medium mb-6">
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-md capitalize">{question.status}</span>
              {question.category && <span className="bg-secondary text-secondary-foreground px-3 py-1 rounded-md">{question.category}</span>}
              {question.domain && <span className="bg-secondary text-secondary-foreground px-3 py-1 rounded-md">{question.domain}</span>}
            </div>

            <div className="border-t border-border pt-6 flex flex-col sm:flex-row justify-between text-muted-foreground text-sm gap-4">
              <p>Requested by <strong className="text-foreground">{question.student_id?.name}</strong> <span className="mx-2">•</span> {new Date(question.createdAt).toLocaleDateString()}</p>
              <p className="flex items-center gap-3">
                <span className="bg-secondary px-2 py-1 rounded-md flex items-center gap-1.5"><span className="text-lg">👁️</span> {question.views} </span>
                <span className="bg-secondary px-2 py-1 rounded-md flex items-center gap-1.5"><span className="text-lg">👍</span> {question.helpful_count} </span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Similar Answer Notification */}
        {question.matched_question_id && (
          <div className="bg-success/10 border border-success/20 rounded-lg p-5 mb-6">
            <p className="text-success-foreground font-semibold mb-2 flex items-center gap-2">
              <span className="text-xl">💡</span> Similar Answer Found
            </p>
            <p className="text-success-foreground/80 mb-2">Similarity Score: {(question.similarity_score * 100).toFixed(1)}%</p>
            <p className="text-success-foreground/80">Original Question: {question.matched_question_id?.question_text}</p>
          </div>
        )}

        {/* Answer Section */}
        {question.isAnswered && question.answer_text && (
          <Card className="mb-6 border-l-4 border-l-success">
            <CardContent className="p-6 md:p-8">
              <h2 className="text-2xl font-bold text-foreground tracking-tight mb-6 flex items-center gap-2">
                <span className="text-success">✓</span> Approved Answer
              </h2>
              <p className="text-muted-foreground whitespace-pre-wrap mb-8 text-base leading-relaxed">{question.answer_text}</p>
              
              <div className="border-t border-border pt-6 text-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="text-muted-foreground">
                  <p>Answered by <strong className="text-foreground">{question.answered_by?.name}</strong> <span className="mx-2">•</span> {question.answered_by?.company}</p>
                  <p className="mt-1">{new Date(question.updatedAt).toLocaleDateString()}</p>
                </div>
                <Button
                  onClick={() => questionAPI.markHelpful(id)}
                  variant="outline"
                  className="gap-2"
                >
                  <span className="text-lg">👍</span> Mark as Helpful
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Answer Form (for assigned alumni) */}
        {!question.isAnswered && question.assigned_to?._id === user?.id && (
          <Card>
            <CardContent className="p-6 md:p-8">
              <h2 className="text-2xl font-bold text-foreground tracking-tight mb-6">Provide Answer</h2>
              <form onSubmit={handleSubmitAnswer} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Your Answer</label>
                  <textarea
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    className="flex min-h-[160px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    rows="6"
                    placeholder="Provide your detailed answer here..."
                    required
                  />
                </div>
                <Button
                  type="submit"
                  isLoading={answerLoading}
                  className="py-6 text-lg w-full sm:w-auto px-8"
                >
                  Submit Answer
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {!question.isAnswered && question.status === 'pending' && (
          <div className="bg-warning/10 border border-warning/20 rounded-lg p-5">
            <p className="text-warning-foreground flex items-center gap-2">
              <svg className="h-5 w-5 text-warning" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              This question is pending. An alumnus will be assigned to answer it soon.
            </p>
          </div>
        )}
    </>
  );
};

export default QuestionDetail;
