import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { GamePage } from './GamePage';
import { useGameStore } from '@/store/gameStore';
import { PhaserGame } from '@/game/PhaserGame';

// Mock PhaserGame
vi.mock('@/game/PhaserGame', () => ({
  PhaserGame: vi.fn(() => <div data-testid="phaser-game">Phaser Game</div>),
}));

// Mock GameHUD
vi.mock('@/components/GameHUD', () => ({
  GameHUD: vi.fn(() => <div data-testid="game-hud">Game HUD</div>),
}));

// Mock game scenes
vi.mock('@/game/scenes/BootScene', () => ({
  BootScene: class {},
}));

vi.mock('@/game/scenes/MenuScene', () => ({
  MenuScene: class {},
}));

vi.mock('@/game/scenes/GameScene', () => ({
  GameScene: class {},
}));

// Mock useGameStore
vi.mock('@/store/gameStore', () => ({
  useGameStore: vi.fn(),
}));

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('GamePage', () => {
  let mockGameStore: any;

  beforeEach(() => {
    mockGameStore = {
      joinRoomWithHub: vi.fn().mockResolvedValue(undefined),
      leaveRoomWithHub: vi.fn().mockResolvedValue(undefined),
      currentRoom: { id: 'room-1', name: 'Test Room', maxPlayers: 4, currentPlayers: 2 },
      isLoading: false,
      error: null,
    };

    vi.mocked(useGameStore).mockReturnValue(mockGameStore as any);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderWithRouter = (roomId: string = 'room-1') => {
    return render(
      <MemoryRouter initialEntries={[`/game/${roomId}`]}>
        <Routes>
          <Route path="/game/:roomId" element={<GamePage />} />
          <Route path="/lobby" element={<div>Lobby Page</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  describe('Rendering', () => {
    it('should render game page', () => {
      renderWithRouter();

      expect(screen.getByTestId('game-page')).toBeInTheDocument();
    });

    it('should render PhaserGame component', () => {
      renderWithRouter();

      expect(screen.getByTestId('phaser-game')).toBeInTheDocument();
    });

    it('should render GameHUD component', () => {
      renderWithRouter();

      expect(screen.getByTestId('game-hud')).toBeInTheDocument();
    });

    it('should pass correct scenes to PhaserGame', () => {
      renderWithRouter();

      expect(PhaserGame).toHaveBeenCalled();
      const call = vi.mocked(PhaserGame).mock.calls[0][0];
      expect(call.scenes).toHaveLength(3);
      expect(call.onReady).toBeInstanceOf(Function);
      expect(call.onDestroy).toBeInstanceOf(Function);
    });

    it('should have game-container class', () => {
      renderWithRouter();

      const container = screen.getByTestId('game-page').querySelector('.game-container');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Room Joining', () => {
    it('should join room on mount', async () => {
      renderWithRouter('room-123');

      await waitFor(() => {
        expect(mockGameStore.joinRoomWithHub).toHaveBeenCalledWith('room-123');
      });
    });

    it('should navigate to lobby if no roomId', async () => {
      render(
        <MemoryRouter initialEntries={['/game/']}>
          <Routes>
            <Route path="/game/" element={<GamePage />} />
            <Route path="/lobby" element={<div>Lobby Page</div>} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/lobby');
      });
    });

    it('should navigate to lobby if join fails', async () => {
      mockGameStore.joinRoomWithHub = vi.fn().mockRejectedValue(new Error('Join failed'));

      renderWithRouter('room-error');

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/lobby');
      });
    });

    it('should log error when join fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockGameStore.joinRoomWithHub = vi.fn().mockRejectedValue(new Error('Join failed'));

      renderWithRouter('room-error');

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Room Leaving', () => {
    it('should leave room on unmount', async () => {
      const { unmount } = renderWithRouter('room-1');

      await waitFor(() => {
        expect(mockGameStore.joinRoomWithHub).toHaveBeenCalled();
      });

      unmount();

      await waitFor(() => {
        expect(mockGameStore.leaveRoomWithHub).toHaveBeenCalledWith('room-1');
      });
    });

    it('should not leave if no current room', async () => {
      mockGameStore.currentRoom = null;

      const { unmount } = renderWithRouter('room-1');

      await waitFor(() => {
        expect(mockGameStore.joinRoomWithHub).toHaveBeenCalled();
      });

      unmount();

      expect(mockGameStore.leaveRoomWithHub).not.toHaveBeenCalled();
    });

    it('should log error when leave fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockGameStore.leaveRoomWithHub = vi.fn().mockRejectedValue(new Error('Leave failed'));

      const { unmount } = renderWithRouter('room-1');

      await waitFor(() => {
        expect(mockGameStore.joinRoomWithHub).toHaveBeenCalled();
      });

      unmount();

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner when loading', () => {
      mockGameStore.isLoading = true;

      renderWithRouter();

      expect(screen.getByText('Loading game...')).toBeInTheDocument();
      expect(screen.getByTestId('game-page')).toHaveClass('loading');
    });

    it('should show spinner element when loading', () => {
      mockGameStore.isLoading = true;

      renderWithRouter();

      const spinner = document.querySelector('.spinner');
      expect(spinner).toBeInTheDocument();
    });

    it('should not show PhaserGame when loading', () => {
      mockGameStore.isLoading = true;

      renderWithRouter();

      expect(screen.queryByTestId('phaser-game')).not.toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should show error message when error exists', () => {
      mockGameStore.error = 'Failed to connect to server';

      renderWithRouter();

      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Failed to connect to server')).toBeInTheDocument();
      expect(screen.getByTestId('game-page')).toHaveClass('error');
    });

    it('should show back to lobby button on error', () => {
      mockGameStore.error = 'Connection error';

      renderWithRouter();

      const button = screen.getByRole('button', { name: /back to lobby/i });
      expect(button).toBeInTheDocument();
    });

    it('should navigate to lobby when clicking back button', () => {
      mockGameStore.error = 'Connection error';

      renderWithRouter();

      const button = screen.getByRole('button', { name: /back to lobby/i });
      button.click();

      expect(mockNavigate).toHaveBeenCalledWith('/lobby');
    });

    it('should not show PhaserGame when error exists', () => {
      mockGameStore.error = 'Some error';

      renderWithRouter();

      expect(screen.queryByTestId('phaser-game')).not.toBeInTheDocument();
    });
  });

  describe('No Room State', () => {
    it('should show no room message when no current room', () => {
      mockGameStore.currentRoom = null;
      mockGameStore.isLoading = false;

      renderWithRouter();

      expect(screen.getByText('Room not found')).toBeInTheDocument();
      expect(screen.getByTestId('game-page')).toHaveClass('no-room');
    });

    it('should show back to lobby button when no room', () => {
      mockGameStore.currentRoom = null;

      renderWithRouter();

      const button = screen.getByRole('button', { name: /back to lobby/i });
      expect(button).toBeInTheDocument();
    });

    it('should navigate to lobby when clicking back button (no room)', () => {
      mockGameStore.currentRoom = null;

      renderWithRouter();

      const button = screen.getByRole('button', { name: /back to lobby/i });
      button.click();

      expect(mockNavigate).toHaveBeenCalledWith('/lobby');
    });

    it('should not show PhaserGame when no room', () => {
      mockGameStore.currentRoom = null;

      renderWithRouter();

      expect(screen.queryByTestId('phaser-game')).not.toBeInTheDocument();
    });
  });

  describe('Phaser Game Callbacks', () => {
    it('should handle onReady callback', () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      renderWithRouter();

      const phaserProps = vi.mocked(PhaserGame).mock.calls[0][0];
      phaserProps.onReady?.();

      expect(consoleLogSpy).toHaveBeenCalledWith('Game ready!');

      consoleLogSpy.mockRestore();
    });

    it('should handle onDestroy callback', () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      renderWithRouter();

      const phaserProps = vi.mocked(PhaserGame).mock.calls[0][0];
      phaserProps.onDestroy?.();

      expect(consoleLogSpy).toHaveBeenCalledWith('Game destroyed');

      consoleLogSpy.mockRestore();
    });
  });
});
