import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { LoginPage } from './LoginPage';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/services/api/authApi';

// Mock dependencies
vi.mock('@/store/authStore');
vi.mock('@/services/api/authApi');
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
}));

describe('LoginPage', () => {
  const mockSetAuth = vi.fn();
  const mockSetLoading = vi.fn();
  const mockSetError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock useAuthStore
    vi.mocked(useAuthStore).mockReturnValue({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      setAuth: mockSetAuth,
      setUser: vi.fn(),
      logout: vi.fn(),
      setLoading: mockSetLoading,
      setError: mockSetError,
      loadFromStorage: vi.fn(),
    });
  });

  describe('Rendering', () => {
    it('should render login form', () => {
      render(<LoginPage />);
      
      expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
    });

    it('should render link to register page', () => {
      render(<LoginPage />);
      expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /sign up/i })).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should show error when email is invalid', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);
      
      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'invalid-email');
      await user.tab();
      
      await waitFor(() => {
        expect(screen.getByText(/valid email/i)).toBeInTheDocument();
      });
    });

    it('should show error when password is empty', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);
      
      const passwordInput = screen.getByLabelText(/password/i);
      await user.click(passwordInput);
      await user.tab();
      
      await waitFor(() => {
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });
    });

    it('should not submit with invalid fields', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);
      
      const submitButton = screen.getByRole('button', { name: /log in/i });
      await user.click(submitButton);
      
      expect(authApi.login).not.toHaveBeenCalled();
    });
  });

  describe('Form Submission', () => {
    it('should call login API with form data', async () => {
      const user = userEvent.setup();
      const mockAuthResponse = {
        token: 'test-token',
        refreshToken: 'test-refresh-token',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        user: {
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
          createdAt: new Date().toISOString(),
        },
      };

      vi.mocked(authApi.login).mockResolvedValue(mockAuthResponse);
      
      render(<LoginPage />);
      
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /log in/i }));
      
      await waitFor(() => {
        expect(authApi.login).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
      });
    });

    it('should update auth store on successful login', async () => {
      const user = userEvent.setup();
      const mockAuthResponse = {
        token: 'test-token',
        refreshToken: 'test-refresh-token',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        user: {
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
          createdAt: new Date().toISOString(),
        },
      };

      vi.mocked(authApi.login).mockResolvedValue(mockAuthResponse);
      
      render(<LoginPage />);
      
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /log in/i }));
      
      await waitFor(() => {
        expect(mockSetAuth).toHaveBeenCalledWith(mockAuthResponse);
      });
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      vi.mocked(authApi.login).mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );
      
      render(<LoginPage />);
      
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      
      const submitButton = screen.getByRole('button', { name: /log in/i });
      await user.click(submitButton);
      
      expect(mockSetLoading).toHaveBeenCalledWith(true);
    });
  });

  describe('Error Handling', () => {
    it('should display error message on login failure', async () => {
      const user = userEvent.setup();
      vi.mocked(authApi.login).mockRejectedValue(new Error('Invalid credentials'));
      
      render(<LoginPage />);
      
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
      await user.click(screen.getByRole('button', { name: /log in/i }));
      
      await waitFor(() => {
        expect(mockSetError).toHaveBeenCalledWith('Invalid credentials');
      });
    });

    it('should clear error when user starts typing', async () => {
      const user = userEvent.setup();
      vi.mocked(useAuthStore).mockReturnValue({
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Previous error',
        setAuth: mockSetAuth,
        setUser: vi.fn(),
        logout: vi.fn(),
        setLoading: mockSetLoading,
        setError: mockSetError,
        loadFromStorage: vi.fn(),
      });
      
      render(<LoginPage />);
      
      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'a');
      
      expect(mockSetError).toHaveBeenCalledWith(null);
    });
  });

  describe('Loading State', () => {
    it('should disable form during loading', () => {
      vi.mocked(useAuthStore).mockReturnValue({
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: true,
        error: null,
        setAuth: mockSetAuth,
        setUser: vi.fn(),
        logout: vi.fn(),
        setLoading: mockSetLoading,
        setError: mockSetError,
        loadFromStorage: vi.fn(),
      });
      
      render(<LoginPage />);
      
      expect(screen.getByLabelText(/email/i)).toBeDisabled();
      expect(screen.getByLabelText(/password/i)).toBeDisabled();
      expect(screen.getByRole('button', { name: /logging in/i })).toBeDisabled();
    });
  });
});
