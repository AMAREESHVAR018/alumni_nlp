import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link to="/dashboard" className="text-3xl font-bold text-blue-600 hover:text-blue-700 transition">
            Alumni Net
          </Link>
          <div className="flex items-center gap-6">
            <span className="text-gray-700 hidden md:block">
              Welcome, <strong>{user?.name}</strong>
            </span>
            <Link to="/profile" className="text-blue-600 font-medium hover:text-blue-800 transition">
              Profile
            </Link>
            <button
              onClick={logout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Container */}
      <main className="container max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;
