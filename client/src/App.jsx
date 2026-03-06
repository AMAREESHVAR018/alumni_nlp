import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import { Toaster } from 'react-hot-toast';

// Components (Eager load critical components)
import ErrorBoundary from './components/ErrorBoundary';
import Login from './components/Login';
import Register from './components/Register';

// Lazy loaded components
const Dashboard = lazy(() => import('./components/Dashboard'));
const Questions = lazy(() => import('./components/Questions'));
const QuestionDetail = lazy(() => import('./components/QuestionDetail'));
const Alumni = lazy(() => import('./components/Alumni'));
const AlumniProfile = lazy(() => import('./components/AlumniProfile'));
const Jobs = lazy(() => import('./components/Jobs'));
const JobDetail = lazy(() => import('./components/JobDetail'));
const Chat = lazy(() => import('./components/Chat'));
const ResumeAnalyzer = lazy(() => import('./components/ResumeAnalyzer'));
const Profile = lazy(() => import('./components/Profile'));
const Leaderboard = lazy(() => import('./components/Leaderboard'));
const MentorBooking = lazy(() => import('./components/MentorBooking'));

function AppContent() {
  const { loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>}>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/questions"
          element={
            <ProtectedRoute>
              <Layout>
                <Questions />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/question/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <QuestionDetail />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/alumni"
          element={
            <ProtectedRoute>
              <Layout>
                <Alumni />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/alumni/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <AlumniProfile />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/jobs"
          element={
            <ProtectedRoute>
              <Layout>
                <Jobs />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/job/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <JobDetail />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <Layout>
                <Chat />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/resume"
          element={
            <ProtectedRoute>
              <Layout>
                <ResumeAnalyzer />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Layout>
                <Profile />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/leaderboard"
          element={
            <ProtectedRoute>
              <Layout>
                <Leaderboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/mentors"
          element={
            <ProtectedRoute>
              <Layout>
                <MentorBooking />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Redirect root to dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <Router>
          <AuthProvider>
            <Toaster position="top-right"
              toastOptions={{
                duration: 3000,
                style: {
                  background: 'var(--card)',
                  color: 'var(--foreground)',
                  border: '1px solid var(--border)',
                },
              }} 
            />
            <AppContent />
          </AuthProvider>
        </Router>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
