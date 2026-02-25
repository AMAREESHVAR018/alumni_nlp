import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { jobAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [resumeLink, setResumeLink] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [applyLoading, setApplyLoading] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  useEffect(() => {
    fetchJob();
  }, [id]);

  const fetchJob = async () => {
    try {
      setLoading(true);
      const response = await jobAPI.getJob(id);
      setJob(response.data);
    } catch (error) {
      console.error('Error fetching job:', error);
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
      alert('Application submitted successfully!');
    } catch (error) {
      alert('Error applying: ' + (error.response?.data?.message || error.message));
    } finally {
      setApplyLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!job) {
    return <div className="min-h-screen flex items-center justify-center">Job not found</div>;
  }

  const isExpired = new Date(job.deadline) < new Date();

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto">
        <Link to="/jobs" className="text-blue-500 hover:text-blue-700 mb-4 block">← Back to Jobs</Link>

        {/* Job Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{job.title}</h1>
              <p className="text-2xl text-gray-600">{job.company}</p>
            </div>
            <span className={`px-4 py-2 rounded text-white font-semibold ${
              job.employment_type === 'internship' ? 'bg-blue-500' :
              job.employment_type === 'full-time' ? 'bg-green-500' : 'bg-purple-500'
            }`}>
              {job.employment_type}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {job.location && (
              <div>
                <p className="text-gray-600 text-sm">Location</p>
                <p className="font-semibold">{job.location}</p>
              </div>
            )}
            {job.experience_level && (
              <div>
                <p className="text-gray-600 text-sm">Experience Level</p>
                <p className="font-semibold capitalize">{job.experience_level}</p>
              </div>
            )}
            {job.salary_range && (
              <div>
                <p className="text-gray-600 text-sm">Salary</p>
                <p className="font-semibold">{job.salary_range}</p>
              </div>
            )}
            <div>
              <p className="text-gray-600 text-sm">Deadline</p>
              <p className={`font-semibold ${isExpired ? 'text-red-500' : 'text-green-500'}`}>
                {new Date(job.deadline).toLocaleDateString()}
              </p>
            </div>
          </div>

          {isExpired && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              This job posting has expired.
            </div>
          )}
        </div>

        {/* Job Description */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Job Description</h2>
          <p className="text-gray-700 whitespace-pre-wrap mb-6">{job.description}</p>

          {job.about_company && (
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-2">About Company</h3>
              <p className="text-gray-700">{job.about_company}</p>
            </div>
          )}

          {job.skills_required && job.skills_required.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-3">Required Skills</h3>
              <div className="flex flex-wrap gap-2">
                {job.skills_required.map((skill, idx) => (
                  <span key={idx} className="bg-blue-100 text-blue-800 px-3 py-1 rounded">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {job.benefits && job.benefits.length > 0 && (
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Benefits</h3>
              <ul className="list-disc list-inside text-gray-700">
                {job.benefits.map((benefit, idx) => (
                  <li key={idx}>{benefit}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Posted By */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Posted By</h2>
          <div className="flex items-center gap-4">
            <div>
              <p className="text-lg font-semibold text-gray-800">{job.alumni_id?.name}</p>
              {job.alumni_id?.jobTitle && (
                <p className="text-gray-600">{job.alumni_id.jobTitle} at {job.alumni_id?.company}</p>
              )}
              <button className="mt-2 text-blue-500 hover:text-blue-700">View Profile</button>
            </div>
          </div>
        </div>

        {/* Apply Section */}
        {user?.role === 'student' && !isExpired && (
          <>
            {!showApplyForm ? (
              <button
                onClick={() => setShowApplyForm(true)}
                disabled={hasApplied}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {hasApplied ? '✓ Already Applied' : 'Apply for This Job'}
              </button>
            ) : (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Apply for {job.title}</h2>
                <form onSubmit={handleApply} className="space-y-4">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">Resume/CV Link *</label>
                    <input
                      type="url"
                      value={resumeLink}
                      onChange={(e) => setResumeLink(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                      placeholder="Link to your resume (Google Drive, Dropbox, etc.)"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">Cover Letter</label>
                    <textarea
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                      rows="5"
                      placeholder="Tell them why you're a great fit for this role..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={applyLoading}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg disabled:opacity-50"
                    >
                      {applyLoading ? 'Submitting...' : 'Submit Application'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowApplyForm(false)}
                      className="flex-1 bg-gray-400 hover:bg-gray-500 text-white px-6 py-2 rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </>
        )}

        {user?.role === 'alumni' && (
          <Link to={`/job/${id}/applications`} className="block">
            <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-lg">
              View Applications
            </button>
          </Link>
        )}
      </div>
    </div>
  );
};

export default JobDetail;
