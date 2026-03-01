import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { GameLobbyPage } from './GameLobbyPage';
import { BrowserRouter } from 'react-router-dom';

// Mock dependencies
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

describe('GameLobbyPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render game lobby title', () => {
      renderWithRouter(<GameLobbyPage />);
      expect(screen.getByRole('heading', { name: /game lobby/i })).toBeInTheDocument();
    });

    it('should render create room button', () => {
      renderWithRouter(<GameLobbyPage />);
      expect(screen.getByRole('button', { name: /create room/i })).toBeInTheDocument();
    });

    it('should render refresh button', () => {
      renderWithRouter(<GameLobbyPage />);
      expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
    });

    it('should render back to dashboard button', () => {
      renderWithRouter(<GameLobbyPage />);
      expect(screen.getByRole('button', { name: /back to dashboard/i })).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no rooms available', () => {
      renderWithRouter(<GameLobbyPage />);
      expect(screen.getByText(/no game rooms available/i)).toBeInTheDocument();
    });

    it('should show create room message in empty state', () => {
      renderWithRouter(<GameLobbyPage />);
      expect(screen.getByText(/create a new room to start playing/i)).toBeInTheDocument();
    });
  });

  describe('Room List', () => {
    it('should show placeholder for room list section', () => {
      renderWithRouter(<GameLobbyPage />);
      expect(screen.getByText(/available rooms/i)).toBeInTheDocument();
    });
  });

  describe('Create Room Button', () => {
    it('should be clickable', async () => {
      const user = userEvent.setup();
      renderWithRouter(<GameLobbyPage />);
      
      const createButton = screen.getByRole('button', { name: /create room/i });
      await user.click(createButton);
      
      // Button should remain in the document after click
      expect(createButton).toBeInTheDocument();
    });
  });

  describe('Refresh Button', () => {
    it('should be clickable', async () => {
      const user = userEvent.setup();
      renderWithRouter(<GameLobbyPage />);
      
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      await user.click(refreshButton);
      
      expect(refreshButton).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should render back to dashboard button', () => {
      renderWithRouter(<GameLobbyPage />);
      const backButton = screen.getByRole('button', { name: /back to dashboard/i });
      expect(backButton).toBeInTheDocument();
    });

    it('should be able to click back button', async () => {
      const user = userEvent.setup();
      renderWithRouter(<GameLobbyPage />);
      
      const backButton = screen.getByRole('button', { name: /back to dashboard/i });
      await user.click(backButton);
      
      expect(backButton).toBeInTheDocument();
    });
  });

  describe('Room Information', () => {
    it('should display room count section', () => {
      renderWithRouter(<GameLobbyPage />);
      expect(screen.getByText(/available rooms/i)).toBeInTheDocument();
    });
  });

  describe('Page Layout', () => {
    it('should have proper page structure', () => {
      const { container } = renderWithRouter(<GameLobbyPage />);
      expect(container.querySelector('.game-lobby-page')).toBeInTheDocument();
    });

    it('should have header section', () => {
      const { container } = renderWithRouter(<GameLobbyPage />);
      expect(container.querySelector('.lobby-header')).toBeInTheDocument();
    });

    it('should have actions section', () => {
      const { container } = renderWithRouter(<GameLobbyPage />);
      expect(container.querySelector('.lobby-actions')).toBeInTheDocument();
    });

    it('should have rooms section', () => {
      const { container } = renderWithRouter(<GameLobbyPage />);
      expect(container.querySelector('.rooms-section')).toBeInTheDocument();
    });
  });
});
