import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-blue-600">Alumni Net</h1>
          <div className="flex items-center gap-6">
            <span className="text-gray-700">Welcome, <strong>{user?.name}</strong></span>
            <Link to="/profile" className="text-blue-500 hover:text-blue-700">Profile</Link>
            <button
              onClick={logout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-4xl font-bold text-gray-800 mb-8">Welcome to Alumni Network</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Questions Card */}
          <Link to="/questions" className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
            <div className="text-4xl mb-4">❓</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Ask Questions</h3>
            <p className="text-gray-600 mb-4">Get answers from experienced alumni in your field</p>
            <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
              Ask Now
            </button>
          </Link>

          {/* Alumni Directory Card */}
          <Link to="/alumni" className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Alumni Directory</h3>
            <p className="text-gray-600 mb-4">Connect with alumni based on skills and experience</p>
            <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">
              Explore
            </button>
          </Link>

          {/* Jobs Card */}
          <Link to="/jobs" className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
            <div className="text-4xl mb-4">💼</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Job Board</h3>
            <p className="text-gray-600 mb-4">Browse internships and job openings from alumni companies</p>
            <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">
              View Jobs
            </button>
          </Link>

          {/* My Questions Card */}
          {user?.role === 'student' && (
            <Link to="/my-questions" className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">My Questions</h3>
              <p className="text-gray-600 mb-4">Track your asked questions and answers</p>
              <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
                View
              </button>
            </Link>
          )}

          {/* My Applications Card */}
          {user?.role === 'student' && (
            <Link to="/my-applications" className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">My Applications</h3>
              <p className="text-gray-600 mb-4">Track your job applications and their status</p>
              <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
                View
              </button>
            </Link>
          )}

          {/* Post Job Card */}
          {user?.role === 'alumni' && (
            <Link to="/post-job" className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
              <div className="text-4xl mb-4">➕</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Post Job</h3>
              <p className="text-gray-600 mb-4">Post internships or job openings from your company</p>
              <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">
                Post Now
              </button>
            </Link>
          )}

          {/* My Jobs Card */}
          {user?.role === 'alumni' && (
            <Link to="/my-jobs" className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
              <div className="text-4xl mb-4">📝</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">My Job Posts</h3>
              <p className="text-gray-600 mb-4">Manage your job postings and applications</p>
              <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
                View
              </button>
            </Link>
          )}

          {/* My Questions (Alumni) Card */}
          {user?.role === 'alumni' && (
            <Link to="/questions-to-answer" className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
              <div className="text-4xl mb-4">💡</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Questions</h3>
              <p className="text-gray-600 mb-4">Answer questions assigned to you</p>
              <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
                View
              </button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
