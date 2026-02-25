import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { jobAPI } from '../services/api';

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    company: '',
    domain: '',
    employment_type: '',
    location: '',
    page: 1,
    limit: 10,
  });
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchJobs();
  }, [filters]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await jobAPI.getAllJobs(filters);
      setJobs(response.data.jobs);
      setTotal(response.data.total);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">Job Opportunities</h1>
          <Link to="/dashboard" className="text-blue-500 hover:text-blue-700">Back</Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Filter Jobs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Company</label>
              <input
                type="text"
                value={filters.company}
                onChange={(e) => setFilters({ ...filters, company: e.target.value, page: 1 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="Company name"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Domain</label>
              <input
                type="text"
                value={filters.domain}
                onChange={(e) => setFilters({ ...filters, domain: e.target.value, page: 1 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="e.g., Software Engineering"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Type</label>
              <select
                value={filters.employment_type}
                onChange={(e) => setFilters({ ...filters, employment_type: e.target.value, page: 1 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">All Types</option>
                <option value="internship">Internship</option>
                <option value="full-time">Full-time</option>
                <option value="contract">Contract</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Location</label>
              <input
                type="text"
                value={filters.location}
                onChange={(e) => setFilters({ ...filters, location: e.target.value, page: 1 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="City/Country"
              />
            </div>
          </div>
        </div>

        {/* Jobs List */}
        {loading ? (
          <div className="text-center text-gray-500">Loading...</div>
        ) : jobs.length === 0 ? (
          <div className="text-center text-gray-500">No jobs found</div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <Link key={job._id} to={`/job/${job._id}`}>
                <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition cursor-pointer">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-2xl font-bold text-gray-800">{job.title}</h3>
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded text-sm font-semibold">
                      {job.employment_type}
                    </span>
                  </div>

                  <p className="text-gray-600 mb-4"><strong>{job.company}</strong></p>

                  <p className="text-gray-700 mb-4 line-clamp-2">{job.description}</p>

                  <div className="flex justify-between items-center mb-4">
                    <div>
                      {job.location && <p className="text-gray-600">📍 {job.location}</p>}
                      {job.domain && <p className="text-gray-600">🎯 {job.domain}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-gray-600">👁️ {job.views_count} views</p>
                      <p className="text-gray-600">📋 {job.applications_count} applications</p>
                    </div>
                  </div>

                  {job.skills_required && job.skills_required.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-semibold mb-2">Required Skills:</p>
                      <div className="flex flex-wrap gap-2">
                        {job.skills_required.slice(0, 4).map((skill, idx) => (
                          <span key={idx} className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                            {skill}
                          </span>
                        ))}
                        {job.skills_required.length > 4 && (
                          <span className="text-gray-600 text-xs">+{job.skills_required.length - 4}</span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600">
                      Posted by <strong>{job.alumni_id?.name}</strong> ({job.alumni_id?.company})
                    </p>
                    <button className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded">
                      View & Apply
                    </button>
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
      </div>
    </div>
  );
};

export default Jobs;
