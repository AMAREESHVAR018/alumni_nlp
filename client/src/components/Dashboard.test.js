/**
 * Dashboard Component Tests
 * Uses @testing-library/react; mocks AuthContext, axios, and framer-motion.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import Dashboard from './Dashboard';
import { useAuth } from '../context/AuthContext';

// ─── Mocks ──────────────────────────────────────────────────────────────────

jest.mock('../context/AuthContext', () => ({
  useAuth: jest.fn()
}));

jest.mock('axios');

jest.mock('framer-motion', () => {
  const React = require('react');
  return {
    motion: {
      div:    ({ children, initial, animate, variants, ...props }) =>
                React.createElement('div', props, children),
      button: ({ children, whileTap, ...props }) =>
                React.createElement('button', props, children)
    }
  };
});

// ─── Helpers ────────────────────────────────────────────────────────────────

const mockStudent = {
  _id:   'student-001',
  name:  'Jane Doe',
  role:  'student',
  email: 'jane@university.edu'
};

const mockAlumni = {
  _id:   'alumni-001',
  name:  'Bob Alumni',
  role:  'alumni',
  email: 'bob@company.com'
};

const setupAxiosMocks = (overrides = {}) => {
  const defaults = {
    aiAdvice:    { data: { data: 'Focus on mastering one core language.' } },
    activity:    { data: { data: [{ id: 1, type: 'job', title: 'Alice posted a role.', createdAt: new Date() }] } },
    trending:    { data: { data: { trendingQuestions: [], leaderboard: [] } } },
    recommendations: { data: { recommendedMentors: [] } }
  };
  const merged = { ...defaults, ...overrides };

  axios.get.mockImplementation((url) => {
    if (url.includes('/ai-advice'))    return Promise.resolve(merged.aiAdvice);
    if (url.includes('/activity'))     return Promise.resolve(merged.activity);
    if (url.includes('/trending'))     return Promise.resolve(merged.trending);
    if (url.includes('/recommendations')) return Promise.resolve(merged.recommendations);
    return Promise.resolve({ data: { data: [] } });
  });
};

const renderDashboard = (user = mockStudent, token = 'mock-jwt') => {
  useAuth.mockReturnValue({ user, token });
  return render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>
  );
};

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('Dashboard component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupAxiosMocks();
  });

  // ── Rendering ─────────────────────────────────────────────────────────────

  describe('Rendering', () => {
    it('renders without crashing when a student user is provided', () => {
      const { container } = renderDashboard();
      expect(container).toBeDefined();
      expect(container.firstChild).not.toBeNull();
    });

    it('renders without crashing when an alumni user is provided', () => {
      const { container } = renderDashboard(mockAlumni);
      expect(container).toBeDefined();
    });

    it('shows welcome message with the user\'s first name', () => {
      renderDashboard();
      expect(screen.getByText(/welcome back, jane/i)).toBeInTheDocument();
    });

    it('shows correct welcome name for alumni user', () => {
      renderDashboard(mockAlumni);
      expect(screen.getByText(/welcome back, bob/i)).toBeInTheDocument();
    });

    it('renders the Ask Questions card link', () => {
      renderDashboard();
      expect(screen.getByText(/ask questions/i)).toBeInTheDocument();
    });

    it('renders the Alumni Directory card link', () => {
      renderDashboard();
      expect(screen.getByText(/alumni directory/i)).toBeInTheDocument();
    });

    it('renders "Job Board" label for students', () => {
      renderDashboard(mockStudent);
      expect(screen.getByText(/job board/i)).toBeInTheDocument();
    });

    it('renders "Post a Job" label for alumni', () => {
      renderDashboard(mockAlumni);
      expect(screen.getByText(/post a job/i)).toBeInTheDocument();
    });
  });

  // ── Loading / Initial State ────────────────────────────────────────────────

  describe('Initial / loading state', () => {
    it('shows "No trending questions yet." before API resolves', () => {
      // Keep the API calls pending to simulate loading.
      axios.get.mockReturnValue(new Promise(() => {}));
      renderDashboard();
      expect(screen.getByText(/no trending questions yet/i)).toBeInTheDocument();
    });

    it('does not show AI advice before the API responds', () => {
      axios.get.mockReturnValue(new Promise(() => {}));
      renderDashboard();
      // The AI advice banner is only shown when aiAdvice has a value.
      expect(screen.queryByText(/ai career insight/i)).not.toBeInTheDocument();
    });
  });

  // ── API Integration ────────────────────────────────────────────────────────

  describe('API integration', () => {
    it('makes API calls with the Authorization header when token is set', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalled();
      });

      const calls = axios.get.mock.calls;
      calls.forEach(([_url, config]) => {
        expect(config?.headers?.Authorization).toMatch(/^Bearer /);
      });
    });

    it('shows the AI career advice once the API resolves', async () => {
      setupAxiosMocks({
        aiAdvice: { data: { data: 'Contribute to open source projects.' } }
      });
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/contribute to open source projects/i)).toBeInTheDocument();
      });
    });

    it('does not fetch mentor recommendations for alumni users', async () => {
      renderDashboard(mockAlumni);

      await waitFor(() => expect(axios.get).toHaveBeenCalled());

      const calls = axios.get.mock.calls.map(([url]) => url);
      const hasRecommendations = calls.some(url => url.includes('recommendations'));
      expect(hasRecommendations).toBe(false);
    });

    it('fetches mentor recommendations for student users with an _id', async () => {
      renderDashboard(mockStudent);

      await waitFor(() => expect(axios.get).toHaveBeenCalled());

      const calls = axios.get.mock.calls.map(([url]) => url);
      const hasRecommendations = calls.some(url => url.includes('recommendations'));
      expect(hasRecommendations).toBe(true);
    });
  });
});
