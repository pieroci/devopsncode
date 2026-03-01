import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { RegisterPage } from './RegisterPage';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/services/api/authApi';

// Mock dependencies
vi.mock('@/store/authStore');
vi.mock('@/services/api/authApi');
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
}));

describe('RegisterPage', () => {
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
    it('should render register form', () => {
      const { container } = render(<RegisterPage />);
      
      expect(screen.getByRole('heading', { name: /sign up/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^email/i)).toBeInTheDocument();
      
      const passwordInputs = container.querySelectorAll('input[type="password"]');
      expect(passwordInputs).toHaveLength(2);
      
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
    });

    it('should render link to login page', () => {
      render(<RegisterPage />);
      expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /log in/i })).toBeInTheDocument();
    });
  });

  describe('Username Validation', () => {
    it('should show error when username is too short', async () => {
      const user = userEvent.setup();
      render(<RegisterPage />);
      
      const usernameInput = screen.getByLabelText(/username/i);
      await user.type(usernameInput, 'ab');
      await user.tab();
      
      await waitFor(() => {
        expect(screen.getByText(/username must be at least 3 characters/i)).toBeInTheDocument();
      });
    });

    it('should show error when username is empty', async () => {
      const user = userEvent.setup();
      render(<RegisterPage />);
      
      const usernameInput = screen.getByLabelText(/username/i);
      await user.click(usernameInput);
      await user.tab();
      
      await waitFor(() => {
        expect(screen.getByText(/username is required/i)).toBeInTheDocument();
      });
    });
  });

  describe('Email Validation', () => {
    it('should show error when email is invalid', async () => {
      const user = userEvent.setup();
      render(<RegisterPage />);
      
      const emailInput = screen.getByLabelText(/^email/i);
      await user.type(emailInput, 'invalid-email');
      await user.tab();
      
      await waitFor(() => {
        expect(screen.getByText(/valid email/i)).toBeInTheDocument();
      });
    });
  });

  describe('Password Validation', () => {
    it('should show error when password is too short', async () => {
      const user = userEvent.setup();
      const { container } = render(<RegisterPage />);
      
      const passwordInput = container.querySelectorAll('input[type="password"]')[0] as HTMLInputElement;
      await user.type(passwordInput, '12345');
      await user.tab();
      
      await waitFor(() => {
        expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
      });
    });

    it('should show error when password is empty', async () => {
      const user = userEvent.setup();
      const { container } = render(<RegisterPage />);
      
      const passwordInput = container.querySelectorAll('input[type="password"]')[0] as HTMLInputElement;
      await user.click(passwordInput);
      await user.tab();
      
      await waitFor(() => {
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });
    });
  });

  describe('Password Confirmation', () => {
    it('should show error when passwords do not match', async () => {
      const user = userEvent.setup();
      const { container } = render(<RegisterPage />);
      
      const passwordInputs = container.querySelectorAll('input[type="password"]') as NodeListOf<HTMLInputElement>;
      await user.type(passwordInputs[0], 'password123');
      await user.type(passwordInputs[1], 'password456');
      await user.tab();
      
      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      });
    });

    it('should not show error when passwords match', async () => {
      const user = userEvent.setup();
      const { container } = render(<RegisterPage />);
      
      const passwordInputs = container.querySelectorAll('input[type="password"]') as NodeListOf<HTMLInputElement>;
      await user.type(passwordInputs[0], 'password123');
      await user.type(passwordInputs[1], 'password123');
      await user.tab();
      
      await waitFor(() => {
        expect(screen.queryByText(/passwords do not match/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should not submit with invalid fields', async () => {
      const user = userEvent.setup();
      render(<RegisterPage />);
      
      const submitButton = screen.getByRole('button', { name: /sign up/i });
      await user.click(submitButton);
      
      expect(authApi.register).not.toHaveBeenCalled();
    });

    it('should call register API with form data', async () => {
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

      vi.mocked(authApi.register).mockResolvedValue(mockAuthResponse);
      
      const { container } = render(<RegisterPage />);
      const passwordInputs = container.querySelectorAll('input[type="password"]') as NodeListOf<HTMLInputElement>;
      
      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/^email/i), 'test@example.com');
      await user.type(passwordInputs[0], 'password123');
      await user.type(passwordInputs[1], 'password123');
      await user.click(screen.getByRole('button', { name: /sign up/i }));
      
      await waitFor(() => {
        // Should be called with all fields including confirmPassword
        expect(authApi.register).toHaveBeenCalledWith({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
          confirmPassword: 'password123',
        });
      });
    });

    it('should update auth store on successful registration', async () => {
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

      vi.mocked(authApi.register).mockResolvedValue(mockAuthResponse);
      
      const { container } = render(<RegisterPage />);
      const passwordInputs = container.querySelectorAll('input[type="password"]') as NodeListOf<HTMLInputElement>;
      
      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/^email/i), 'test@example.com');
      await user.type(passwordInputs[0], 'password123');
      await user.type(passwordInputs[1], 'password123');
      await user.click(screen.getByRole('button', { name: /sign up/i }));
      
      await waitFor(() => {
        expect(mockSetAuth).toHaveBeenCalledWith(mockAuthResponse);
      });
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      vi.mocked(authApi.register).mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );
      
      const { container } = render(<RegisterPage />);
      const passwordInputs = container.querySelectorAll('input[type="password"]') as NodeListOf<HTMLInputElement>;
      
      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/^email/i), 'test@example.com');
      await user.type(passwordInputs[0], 'password123');
      await user.type(passwordInputs[1], 'password123');
      
      const submitButton = screen.getByRole('button', { name: /sign up/i });
      await user.click(submitButton);
      
      expect(mockSetLoading).toHaveBeenCalledWith(true);
    });
  });

  describe('Error Handling', () => {
    it('should display error message on registration failure', async () => {
      const user = userEvent.setup();
      vi.mocked(authApi.register).mockRejectedValue(new Error('Email already exists'));
      
      const { container } = render(<RegisterPage />);
      const passwordInputs = container.querySelectorAll('input[type="password"]') as NodeListOf<HTMLInputElement>;
      
      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/^email/i), 'test@example.com');
      await user.type(passwordInputs[0], 'password123');
      await user.type(passwordInputs[1], 'password123');
      await user.click(screen.getByRole('button', { name: /sign up/i }));
      
      await waitFor(() => {
        expect(mockSetError).toHaveBeenCalledWith('Email already exists');
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
      
      render(<RegisterPage />);
      
      const usernameInput = screen.getByLabelText(/username/i);
      await user.type(usernameInput, 'a');
      
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
      
      const { container } = render(<RegisterPage />);
      const passwordInputs = container.querySelectorAll('input[type="password"]') as NodeListOf<HTMLInputElement>;
      
      expect(screen.getByLabelText(/username/i)).toBeDisabled();
      expect(screen.getByLabelText(/^email/i)).toBeDisabled();
      expect(passwordInputs[0]).toBeDisabled();
      expect(passwordInputs[1]).toBeDisabled();
      expect(screen.getByRole('button', { name: /signing up/i })).toBeDisabled();
    });
  });
});
