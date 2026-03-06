/**
 * Login Component Tests
 * Uses @testing-library/react; mocks AuthContext and framer-motion.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Login from './Login';
import { useAuth } from '../context/AuthContext';

// ─── Mocks ──────────────────────────────────────────────────────────────────

jest.mock('../context/AuthContext', () => ({
  useAuth: jest.fn()
}));

jest.mock('framer-motion', () => {
  const React = require('react');
  return {
    motion: {
      div:    ({ children, ...props }) => React.createElement('div', props, children),
      button: ({ children, whileTap, ...props }) => React.createElement('button', props, children)
    }
  };
});

// react-router-dom is provided by wrapping with MemoryRouter.

// ─── Helpers ────────────────────────────────────────────────────────────────

const mockLogin = jest.fn();

const renderLogin = () =>
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('Login component', () => {
  beforeEach(() => {
    mockLogin.mockReset();
    useAuth.mockReturnValue({ login: mockLogin });
  });

  // ── Rendering ─────────────────────────────────────────────────────────────

  describe('Rendering', () => {
    it('renders the email input field', () => {
      renderLogin();
      expect(screen.getByPlaceholderText(/your@email\.com/i)).toBeInTheDocument();
    });

    it('renders the password input field', () => {
      renderLogin();
      expect(screen.getByPlaceholderText(/enter your password/i)).toBeInTheDocument();
    });

    it('renders the submit button with "Login" text', () => {
      renderLogin();
      expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    });

    it('renders the AlumniNet heading', () => {
      renderLogin();
      expect(screen.getByText(/alumniNet/i)).toBeInTheDocument();
    });

    it('renders a link to the registration page', () => {
      renderLogin();
      expect(screen.getByText(/create an account/i)).toBeInTheDocument();
    });
  });

  // ── Validation / Error Handling ───────────────────────────────────────────

  describe('Validation and error handling', () => {
    it('shows an error message when login fails', async () => {
      mockLogin.mockResolvedValueOnce({ success: false, message: 'Invalid credentials' });
      renderLogin();

      await userEvent.type(screen.getByPlaceholderText(/your@email\.com/i), 'user@test.com');
      await userEvent.type(screen.getByPlaceholderText(/enter your password/i), 'wrongpass');
      fireEvent.submit(screen.getByRole('button', { name: /login/i }));

      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });
    });

    it('does not show an error message on initial render', () => {
      renderLogin();
      // No error banner should be present before any interaction.
      expect(screen.queryByText(/invalid/i)).not.toBeInTheDocument();
    });
  });

  // ── Form Submission ───────────────────────────────────────────────────────

  describe('Form submission', () => {
    it('calls login with the entered email and password', async () => {
      mockLogin.mockResolvedValueOnce({ success: true });
      renderLogin();

      await userEvent.type(screen.getByPlaceholderText(/your@email\.com/i), 'alice@test.com');
      await userEvent.type(screen.getByPlaceholderText(/enter your password/i), 'SecurePass1!');
      fireEvent.submit(screen.getByRole('button', { name: /login/i }));

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledTimes(1);
        expect(mockLogin).toHaveBeenCalledWith('alice@test.com', 'SecurePass1!');
      });
    });

    it('disables the submit button while loading', async () => {
      // Keep login pending so loading remains true.
      mockLogin.mockReturnValueOnce(new Promise(() => {}));
      renderLogin();

      await userEvent.type(screen.getByPlaceholderText(/your@email\.com/i), 'bob@test.com');
      await userEvent.type(screen.getByPlaceholderText(/enter your password/i), 'Pass1234!');
      fireEvent.submit(screen.getByRole('button', { name: /login/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /login/i })).toBeDisabled();
      });
    });
  });
});
