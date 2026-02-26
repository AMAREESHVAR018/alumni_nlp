import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from './Layout';

/**
 * ProtectedRoute Component
 * 
 * Prevents unauthorized access to protected resources
 * Features:
 * ✓ Authentication check (redirects to login if not authenticated)
 * ✓ Role-based access control (student, alumni, admin)
 * ✓ Admin override (admins can access all routes)
 * ✓ Loading state handling (shows spinner while checking auth)
 * ✓ Graceful fallback (redirects to dashboard instead of error)
 * 
 * Usage:
 * <ProtectedRoute requiredRole="alumni">
 *   <AdminPanel />
 * </ProtectedRoute>
 * 
 * @param {React.ReactNode} children - Component to protect
 * @param {string} requiredRole - Required role: "student", "alumni", or "admin"
 * @returns {React.ReactNode} Protected route or redirect
 */
const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { user, loading, token } = useAuth();

  // While authentication is being verified, show loading spinner
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // User not authenticated - redirect to login
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  /**
   * ROLE-BASED ACCESS CONTROL
   * 
   * Security model:
   * - All roles start with their permitted routes
   * - Admins can access all routes (admin override)
   * - Everyone else stays in their own area or dashboard
   * 
   * Roles:
   * - student: Can see questions, alumni, jobs, apply for jobs
   * - alumni: Can answer questions, post jobs, view applications
   * - admin: Can access everything + analytics dashboard
   * 
   * Future enhancement: Role-based route metadata
   * Define routes with required roles in a config file:
   * const routeConfig = {
   *   '/admin/analytics': ['admin'],
   *   '/questions': ['student', 'alumni'],
   *   '/jobs': ['student', 'alumni'],
   * }
   */
  
  if (requiredRole && user.role !== requiredRole && user.role !== 'admin') {
    // User doesn't have required role - redirect to dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return <Layout>{children}</Layout>;
};

export default ProtectedRoute;
