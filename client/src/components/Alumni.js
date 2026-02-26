import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../services/api';

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

  useEffect(() => {
    fetchAlumni();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const fetchAlumni = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await authAPI.searchAlumni(filters);
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
          <h1 className="text-3xl font-bold">Alumni Directory</h1>
          <Link to="/dashboard" className="text-blue-500 hover:text-blue-700">Back</Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Filter Alumni</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Domain</label>
              <input
                type="text"
                value={filters.domain}
                onChange={(e) => setFilters({ ...filters, domain: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="e.g., Software Engineering"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Company</label>
              <input
                type="text"
                value={filters.company}
                onChange={(e) => setFilters({ ...filters, company: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="e.g., Google, Microsoft"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Skills</label>
              <input
                type="text"
                value={filters.skills}
                onChange={(e) => setFilters({ ...filters, skills: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="e.g., Python, React"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Min Experience</label>
              <input
                type="number"
                value={filters.min_experience}
                onChange={(e) => setFilters({ ...filters, min_experience: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="Years"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 text-center">
            {error}
          </div>
        )}

        {/* Alumni List */}
        {loading ? (
          <div className="text-center text-gray-500">Loading...</div>
        ) : !alumni || alumni?.length === 0 ? (
          <div className="text-center text-gray-500">No alumni found</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {alumni?.map((alum) => (
              <Link key={alum._id} to={`/alumni/${alum._id}`}>
                <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{alum.name}</h3>
                  
                  <div className="space-y-2 text-gray-700">
                    {alum.company && (
                      <p><strong>Company:</strong> {alum.company}</p>
                    )}
                    {alum.jobTitle && (
                      <p><strong>Title:</strong> {alum.jobTitle}</p>
                    )}
                    {alum.domain && (
                      <p><strong>Domain:</strong> {alum.domain}</p>
                    )}
                    {alum.yearsOfExperience && (
                      <p><strong>Experience:</strong> {alum.yearsOfExperience}+ years</p>
                    )}
                    {alum.graduationYear && (
                      <p><strong>Graduated:</strong> {alum.graduationYear}</p>
                    )}
                  </div>

                  {alum.skills && alum.skills?.length > 0 && (
                    <div className="mt-4">
                      <p className="font-semibold mb-2">Skills:</p>
                      <div className="flex flex-wrap gap-2">
                        {alum.skills.slice(0, 3).map((skill, idx) => (
                          <span key={idx} className="bg-blue-100 text-blue-800 px-3 py-1 rounded text-sm">
                            {skill}
                          </span>
                        ))}
                        {alum.skills?.length > 3 && (
                          <span className="text-gray-600 text-sm">+{alum.skills.length - 3} more</span>
                        )}
                      </div>
                    </div>
                  )}

                  <button className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition">
                    View Profile
                  </button>
                </div>
              </Link>
            ))}
          </div>
        )}
    </>
  );
};

export default Alumni;
