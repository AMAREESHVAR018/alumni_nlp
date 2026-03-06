import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Skeleton } from './ui/Skeleton';

const Alumni = () => {
  const [alumni, setAlumni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    domain: '',
    company: '',
    skills: '',
    min_experience: '',
  });
  // Debounced copy of filters — prevents an API call on every keystroke
  const [debouncedFilters, setDebouncedFilters] = useState(filters);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedFilters(filters), 400);
    return () => clearTimeout(timer);
  }, [filters]);

  useEffect(() => {
    fetchAlumni();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedFilters]);

  const fetchAlumni = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await authAPI.searchAlumni(debouncedFilters);
      setAlumni(response.data.data || []);
    } catch (error) {
      console.error('Error fetching alumni:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Alumni Directory</h1>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Filter Alumni</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Domain</label>
                <Input
                  type="text"
                  value={filters.domain}
                  onChange={(e) => setFilters({ ...filters, domain: e.target.value })}
                  placeholder="e.g., Software Engineering"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Company</label>
                <Input
                  type="text"
                  value={filters.company}
                  onChange={(e) => setFilters({ ...filters, company: e.target.value })}
                  placeholder="e.g., Google, Microsoft"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Skills</label>
                <Input
                  type="text"
                  value={filters.skills}
                  onChange={(e) => setFilters({ ...filters, skills: e.target.value })}
                  placeholder="e.g., Python, React"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Min Experience</label>
                <Input
                  type="number"
                  value={filters.min_experience}
                  onChange={(e) => setFilters({ ...filters, min_experience: e.target.value })}
                  placeholder="Years"
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

        {/* Alumni List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {[1, 2, 3, 4, 5, 6].map(i => (
                <Card key={i}><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>
             ))}
          </div>
        ) : !alumni || alumni?.length === 0 ? (
          <div className="text-center text-muted-foreground py-10">No alumni found</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {alumni?.map((alum) => (
              <Link key={alum._id} to={`/alumni/${alum._id}`} className="block focus:outline-none h-full">
                <Card className="h-full flex flex-col hover:border-primary/50 transition-colors">
                  <CardContent className="p-6 flex flex-col h-full">
                    <h3 className="text-xl font-bold text-foreground mb-4">{alum.name}</h3>
                    
                    <div className="space-y-2 text-sm text-muted-foreground flex-grow mb-4">
                      {alum.company && (
                        <p><strong className="text-foreground">Company:</strong> {alum.company}</p>
                      )}
                      {alum.jobTitle && (
                        <p><strong className="text-foreground">Title:</strong> {alum.jobTitle}</p>
                      )}
                      {alum.domain && (
                        <p><strong className="text-foreground">Domain:</strong> {alum.domain}</p>
                      )}
                      {alum.yearsOfExperience && (
                        <p><strong className="text-foreground">Experience:</strong> {alum.yearsOfExperience}+ years</p>
                      )}
                      {alum.graduationYear && (
                        <p><strong className="text-foreground">Graduated:</strong> {alum.graduationYear}</p>
                      )}
                    </div>

                    {alum.skills && alum.skills?.length > 0 && (
                      <div className="mt-auto mb-4">
                        <p className="font-semibold text-sm text-foreground mb-2">Skills:</p>
                        <div className="flex flex-wrap gap-2">
                          {alum.skills?.slice(0, 3).map((skill, idx) => (
                            <span key={idx} className="bg-secondary text-secondary-foreground border border-border px-2.5 py-1 rounded-md text-xs font-medium">
                              {skill}
                            </span>
                          ))}
                          {alum.skills?.length > 3 && (
                            <span className="text-muted-foreground text-xs flex items-center px-1">+{alum.skills.length - 3} more</span>
                          )}
                        </div>
                      </div>
                    )}

                    <Button variant="outline" className="w-full mt-4">
                      View Profile
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
    </>
  );
};

export default Alumni;
