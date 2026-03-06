import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { jobAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Skeleton } from './ui/Skeleton';
import toast from 'react-hot-toast';

const JobDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [resumeLink, setResumeLink] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [applyLoading, setApplyLoading] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  useEffect(() => {
    fetchJob();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchJob = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await jobAPI.getJob(id);
      setJob(response.data.data);
    } catch (error) {
      console.error('Error fetching job:', error);
      setError('Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (e) => {
    e.preventDefault();
    setApplyLoading(true);
    try {
      await jobAPI.applyJob(id, { resume_link: resumeLink, cover_letter: coverLetter });
      setResumeLink('');
      setCoverLetter('');
      setShowApplyForm(false);
      setHasApplied(true);
      toast.success('Application submitted successfully!');
    } catch (error) {
      toast.error('Error applying: ' + (error.response?.data?.message || error.message));
    } finally {
      setApplyLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!job) {
    return <div className="min-h-screen flex items-center justify-center">Job not found</div>;
  }

  const isExpired = new Date(job.deadline) < new Date();

  return (
    <>
        <Link to="/jobs" className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center text-sm font-medium transition-colors">
          <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Jobs
        </Link>

        {error && (
          <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-md mb-6 text-center text-sm">
            {error}
          </div>
        )}

        {/* Job Header */}
        <Card className="mb-6">
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-6 gap-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2">{job.title}</h1>
                <p className="text-xl text-muted-foreground font-medium">{job.company}</p>
              </div>
              <span className="bg-primary/10 text-primary px-4 py-1.5 rounded-md text-sm font-semibold capitalize self-start md:self-auto">
                {job.employment_type}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-border">
              {job.location && (
                <div>
                  <p className="text-muted-foreground text-sm font-medium mb-1">Location</p>
                  <p className="font-semibold text-foreground">{job.location}</p>
                </div>
              )}
              {job.experience_level && (
                <div>
                  <p className="text-muted-foreground text-sm font-medium mb-1">Experience Level</p>
                  <p className="font-semibold text-foreground capitalize">{job.experience_level}</p>
                </div>
              )}
              {job.salary_range && (
                <div>
                  <p className="text-muted-foreground text-sm font-medium mb-1">Salary</p>
                  <p className="font-semibold text-foreground">{job.salary_range}</p>
                </div>
              )}
              <div>
                <p className="text-muted-foreground text-sm font-medium mb-1">Deadline</p>
                <p className={`font-semibold ${isExpired ? 'text-danger' : 'text-success'}`}>
                  {new Date(job.deadline).toLocaleDateString()}
                </p>
              </div>
            </div>

            {isExpired && (
              <div className="mt-6 bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-md text-sm font-medium">
                This job posting has expired.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Job Description */}
        <Card className="mb-6">
          <CardContent className="p-6 md:p-8">
            <h2 className="text-2xl font-bold text-foreground tracking-tight mb-4">Job Description</h2>
            <p className="text-muted-foreground whitespace-pre-wrap mb-8 text-base leading-relaxed">{job.description}</p>

            {job.about_company && (
              <div className="mb-8">
                <h3 className="text-xl font-bold text-foreground mb-3 tracking-tight">About Company</h3>
                <p className="text-muted-foreground text-base leading-relaxed">{job.about_company}</p>
              </div>
            )}

            {job.skills_required && job.skills_required?.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-bold text-foreground mb-4 tracking-tight">Required Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {job.skills_required?.map((skill, idx) => (
                    <span key={idx} className="bg-secondary text-secondary-foreground border border-border px-3 py-1.5 rounded-md text-sm font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {job.benefits && job.benefits?.length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-foreground mb-4 tracking-tight">Benefits</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 text-base">
                  {job.benefits?.map((benefit, idx) => (
                    <li key={idx} className="pl-2">{benefit}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Posted By */}
        <Card className="mb-6">
          <CardContent className="p-6 md:p-8">
            <h2 className="text-2xl font-bold text-foreground tracking-tight mb-6">Posted By</h2>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl uppercase">
                {job.alumni_id?.name?.charAt(0) || 'A'}
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">{job.alumni_id?.name}</p>
                {job.alumni_id?.jobTitle && (
                  <p className="text-muted-foreground text-sm">{job.alumni_id.jobTitle} at {job.alumni_id?.company}</p>
                )}
                <Button variant="link" className="p-0 h-auto mt-1">View Profile</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Apply Section */}
        {user?.role === 'student' && !isExpired && (
          <>
            {!showApplyForm ? (
              <Button
                onClick={() => setShowApplyForm(true)}
                disabled={hasApplied}
                className="w-full py-6 text-lg"
              >
                {hasApplied ? '✓ Already Applied' : 'Apply for This Job'}
              </Button>
            ) : (
              <Card>
                <CardContent className="p-6 md:p-8">
                  <h2 className="text-2xl font-bold text-foreground tracking-tight mb-6">Apply for {job.title}</h2>
                  <form onSubmit={handleApply} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Resume/CV Link *</label>
                      <Input
                        type="url"
                        value={resumeLink}
                        onChange={(e) => setResumeLink(e.target.value)}
                        placeholder="Link to your resume (Google Drive, Dropbox, etc.)"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Cover Letter</label>
                      <textarea
                        value={coverLetter}
                        onChange={(e) => setCoverLetter(e.target.value)}
                        className="flex min-h-[120px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                        rows="5"
                        placeholder="Tell them why you're a great fit for this role..."
                      />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <Button
                        type="submit"
                        isLoading={applyLoading}
                        className="flex-1"
                      >
                        Submit Application
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowApplyForm(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {user?.role === 'alumni' && (
          <Link to={`/job/${id}/applications`} className="block mt-6">
            <Button className="w-full py-6 text-lg">
              View Applications
            </Button>
          </Link>
        )}
    </>
  );
};

export default JobDetail;
