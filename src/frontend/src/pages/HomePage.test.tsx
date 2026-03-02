import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { HomePage } from './HomePage';
import { useAuthStore } from '@/store/authStore';
import { BrowserRouter } from 'react-router-dom';

// Mock dependencies
vi.mock('@/store/authStore');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('HomePage', () => {
  const mockLogout = vi.fn();
  const mockUser = {
    id: '1',
    username: 'testuser',
    email: 'test@example.com',
    createdAt: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock useAuthStore
    vi.mocked(useAuthStore).mockReturnValue({
      user: mockUser,
      token: 'test-token',
      refreshToken: 'test-refresh-token',
      isAuthenticated: true,
      isLoading: false,
      error: null,
      setAuth: vi.fn(),
      setUser: vi.fn(),
      logout: mockLogout,
      setLoading: vi.fn(),
      setError: vi.fn(),
      loadFromStorage: vi.fn(),
    });
  });

  describe('Rendering', () => {
    it('should render welcome message with username', () => {
      renderWithRouter(<HomePage />);
      
      expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
      expect(screen.getByText(/welcome back, testuser!/i)).toBeInTheDocument();
    });

    it('should render user email', () => {
      renderWithRouter(<HomePage />);
      expect(screen.getByText(mockUser.email)).toBeInTheDocument();
    });

    it('should render dashboard title', () => {
      renderWithRouter(<HomePage />);
      expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
    });
  });

  describe('User Stats', () => {
    it('should render placeholder stats section', () => {
      renderWithRouter(<HomePage />);
      expect(screen.getByRole('heading', { name: /game statistics/i })).toBeInTheDocument();
    });

    it('should show coming soon message for stats', () => {
      renderWithRouter(<HomePage />);
      expect(screen.getByText(/statistics will be available/i)).toBeInTheDocument();
    });
  });

  describe('Quick Actions', () => {
    it('should render quick actions section', () => {
      renderWithRouter(<HomePage />);
      expect(screen.getByText(/quick actions/i)).toBeInTheDocument();
    });

    it('should render play game button', () => {
      renderWithRouter(<HomePage />);
      expect(screen.getByRole('button', { name: /play game/i })).toBeInTheDocument();
    });

    it('should render view profile button', () => {
      renderWithRouter(<HomePage />);
      expect(screen.getByRole('button', { name: /view profile/i })).toBeInTheDocument();
    });

    it('should render logout button', () => {
      renderWithRouter(<HomePage />);
      expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
    });
  });

  describe('Logout Functionality', () => {
    it('should call logout when logout button is clicked', async () => {
      const user = userEvent.setup();
      renderWithRouter(<HomePage />);
      
      const logoutButton = screen.getByRole('button', { name: /logout/i });
      await user.click(logoutButton);
      
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing user gracefully', () => {
      vi.mocked(useAuthStore).mockReturnValue({
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        setAuth: vi.fn(),
        setUser: vi.fn(),
        logout: mockLogout,
        setLoading: vi.fn(),
        setError: vi.fn(),
        loadFromStorage: vi.fn(),
      });

      renderWithRouter(<HomePage />);
      expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
    });

    it('should handle long usernames', () => {
      const longUsernameUser = {
        ...mockUser,
        username: 'verylongusernamethatmightbreakthelayout',
      };
      
      vi.mocked(useAuthStore).mockReturnValue({
        user: longUsernameUser,
        token: 'test-token',
        refreshToken: 'test-refresh-token',
        isAuthenticated: true,
        isLoading: false,
        error: null,
        setAuth: vi.fn(),
        setUser: vi.fn(),
        logout: mockLogout,
        setLoading: vi.fn(),
        setError: vi.fn(),
        loadFromStorage: vi.fn(),
      });

      renderWithRouter(<HomePage />);
      // Check that the username is rendered in the welcome message
      expect(screen.getByText(new RegExp(longUsernameUser.username, 'i'))).toBeInTheDocument();
    });
  });
});
