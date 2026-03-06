import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { jobAPI } from '../services/api';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Skeleton } from './ui/Skeleton';

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await jobAPI.getAllJobs(filters);
      setJobs(response.data.data || []);
      setTotal(response.data.pagination?.total || 0);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Job Opportunities</h1>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Filter Jobs</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Company</label>
                <Input
                  type="text"
                  value={filters.company}
                  onChange={(e) => setFilters({ ...filters, company: e.target.value, page: 1 })}
                  placeholder="Company name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Domain</label>
                <Input
                  type="text"
                  value={filters.domain}
                  onChange={(e) => setFilters({ ...filters, domain: e.target.value, page: 1 })}
                  placeholder="e.g., Software Engineering"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Type</label>
                <select
                  value={filters.employment_type}
                  onChange={(e) => setFilters({ ...filters, employment_type: e.target.value, page: 1 })}
                  className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  <option value="">All Types</option>
                  <option value="internship">Internship</option>
                  <option value="full-time">Full-time</option>
                  <option value="contract">Contract</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Location</label>
                <Input
                  type="text"
                  value={filters.location}
                  onChange={(e) => setFilters({ ...filters, location: e.target.value, page: 1 })}
                  placeholder="City/Country"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-md mb-6 text-center text-sm">
            {error}
          </div>
        )}

        {/* Jobs List */}
        {loading ? (
          <div className="space-y-4">
             {[1, 2, 3].map(i => (
                <Card key={i}><CardContent className="p-6"><Skeleton className="h-32 w-full" /></CardContent></Card>
             ))}
          </div>
        ) : !jobs || jobs?.length === 0 ? (
          <div className="text-center text-muted-foreground py-10">No jobs found</div>
        ) : (
          <div className="space-y-4">
            {jobs?.map((job) => (
              <Link key={job._id} to={`/job/${job._id}`} className="block focus:outline-none">
                <Card className="hover:border-primary/50 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-2xl font-bold text-foreground">{job.title}</h3>
                      <span className="bg-primary/10 text-primary px-3 py-1 rounded-md text-sm font-semibold capitalize">
                        {job.employment_type}
                      </span>
                    </div>

                    <p className="text-card-foreground font-semibold mb-4 text-lg">{job.company}</p>

                    <p className="text-muted-foreground mb-4 line-clamp-2 text-sm">{job.description}</p>

                    <div className="flex justify-between items-center mb-4">
                      <div className="flex gap-4">
                        {job.location && <p className="text-sm text-foreground flex items-center gap-1">📍 <span className="text-muted-foreground">{job.location}</span></p>}
                        {job.domain && <p className="text-sm text-foreground flex items-center gap-1">🎯 <span className="text-muted-foreground">{job.domain}</span></p>}
                      </div>
                      <div className="text-right flex gap-3 text-sm text-muted-foreground bg-secondary px-3 py-1.5 rounded-md">
                        <p>👁️ {job.views_count}</p>
                        <p>📋 {job.applications_count}</p>
                      </div>
                    </div>

                    {job.skills_required && job.skills_required.length > 0 && (
                      <div className="mb-6">
                        <div className="flex flex-wrap gap-2">
                          {job.skills_required?.slice(0, 4).map((skill, idx) => (
                            <span key={idx} className="bg-secondary text-secondary-foreground border border-border px-2.5 py-1 rounded-md text-xs font-medium">
                              {skill}
                            </span>
                          ))}
                          {job.skills_required.length > 4 && (
                            <span className="text-muted-foreground text-xs flex items-center px-1">+{job.skills_required.length - 4} more</span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-4 border-t border-border">
                      <p className="text-sm text-muted-foreground">
                        Posted by <strong className="text-foreground">{job.alumni_id?.name}</strong>
                      </p>
                      <Button variant="secondary">
                        View & Apply
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
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

export default Jobs;
