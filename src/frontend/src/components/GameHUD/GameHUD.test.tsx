import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { GameHUD } from './GameHUD';
import { useGameStore } from '@/store/gameStore';
import type { GamePlayer } from '@/types';

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

describe('GameHUD', () => {
  let mockGameStore: any;
  let mockPlayers: GamePlayer[];

  beforeEach(() => {
    mockPlayers = [
      {
        playerId: '1',
        username: 'Player1',
        isReady: true,
        x: 0,
        y: 0,
        rotation: 0,
        speed: 0,
        lap: 0,
        position: 1,
      },
      {
        playerId: '2',
        username: 'Player2',
        isReady: false,
        x: 0,
        y: 0,
        rotation: 0,
        speed: 0,
        lap: 0,
        position: 2,
      },
    ];

    mockGameStore = {
      players: mockPlayers,
      currentRoom: { id: 'room-1', name: 'Test Room', maxPlayers: 4, currentPlayers: 2 },
      isConnected: true,
      setLocalPlayerReady: vi.fn().mockResolvedValue(undefined),
      leaveRoomWithHub: vi.fn().mockResolvedValue(undefined),
    };

    vi.mocked(useGameStore).mockReturnValue(mockGameStore as any);
    vi.clearAllMocks();
  });

  const renderWithRouter = () => {
    return render(
      <MemoryRouter>
        <GameHUD />
      </MemoryRouter>
    );
  };

  describe('Rendering', () => {
    it('should render GameHUD', () => {
      renderWithRouter();

      expect(screen.getByTestId('game-hud')).toBeInTheDocument();
    });

    it('should render connection status', () => {
      renderWithRouter();

      expect(screen.getByTestId('connection-status')).toBeInTheDocument();
      expect(screen.getByText('Connected')).toBeInTheDocument();
    });

    it('should render room info', () => {
      renderWithRouter();

      expect(screen.getByTestId('room-info')).toBeInTheDocument();
      expect(screen.getByText('Room room-1')).toBeInTheDocument();
    });

    it('should render player list', () => {
      renderWithRouter();

      expect(screen.getByTestId('player-list')).toBeInTheDocument();
      expect(screen.getByText('Players')).toBeInTheDocument();
    });

    it('should render action buttons', () => {
      renderWithRouter();

      expect(screen.getByTestId('action-buttons')).toBeInTheDocument();
      expect(screen.getByTestId('ready-button')).toBeInTheDocument();
      expect(screen.getByTestId('leave-button')).toBeInTheDocument();
    });
  });

  describe('Connection Status', () => {
    it('should show connected status when connected', () => {
      mockGameStore.isConnected = true;

      renderWithRouter();

      expect(screen.getByText('Connected')).toBeInTheDocument();
      const indicator = document.querySelector('.status-indicator.connected');
      expect(indicator).toBeInTheDocument();
    });

    it('should show disconnected status when not connected', () => {
      mockGameStore.isConnected = false;

      renderWithRouter();

      expect(screen.getByText('Disconnected')).toBeInTheDocument();
      const indicator = document.querySelector('.status-indicator.disconnected');
      expect(indicator).toBeInTheDocument();
    });
  });

  describe('Room Info', () => {
    it('should display room ID', () => {
      renderWithRouter();

      expect(screen.getByText('Room room-1')).toBeInTheDocument();
    });

    it('should display player count', () => {
      renderWithRouter();

      expect(screen.getByText('2/4 Players')).toBeInTheDocument();
    });

    it('should not render room info when no current room', () => {
      mockGameStore.currentRoom = null;

      renderWithRouter();

      expect(screen.queryByTestId('room-info')).not.toBeInTheDocument();
    });

    it('should update player count dynamically', () => {
      const { rerender } = renderWithRouter();

      expect(screen.getByText('2/4 Players')).toBeInTheDocument();

      // Add a player
      mockGameStore.players = [
        ...mockPlayers,
        {
          playerId: '3',
          username: 'Player3',
          isReady: false,
          x: 0,
          y: 0,
          rotation: 0,
          speed: 0,
          lap: 0,
          position: 3,
        },
      ];

      rerender(
        <MemoryRouter>
          <GameHUD />
        </MemoryRouter>
      );

      expect(screen.getByText('3/4 Players')).toBeInTheDocument();
    });
  });

  describe('Player List', () => {
    it('should display all players', () => {
      renderWithRouter();

      expect(screen.getByText('Player1')).toBeInTheDocument();
      expect(screen.getByText('Player2')).toBeInTheDocument();
    });

    it('should show ready badge for ready players', () => {
      renderWithRouter();

      expect(screen.getByText('✓ Ready')).toBeInTheDocument();
    });

    it('should not show ready badge for non-ready players', () => {
      renderWithRouter();

      const player2Element = screen.getByText('Player2').closest('li');
      expect(player2Element?.querySelector('.ready-badge')).not.toBeInTheDocument();
    });

    it('should apply ready class to ready players', () => {
      renderWithRouter();

      const player1Element = screen.getByText('Player1').closest('li');
      expect(player1Element).toHaveClass('ready');
    });

    it('should handle empty player list', () => {
      mockGameStore.players = [];

      renderWithRouter();

      expect(screen.getByTestId('player-list')).toBeInTheDocument();
      expect(screen.queryByText('Player1')).not.toBeInTheDocument();
    });

    it('should display multiple players correctly', () => {
      mockGameStore.players = [
        ...mockPlayers,
        {
          playerId: '3',
          username: 'Player3',
          isReady: true,
          x: 0,
          y: 0,
          rotation: 0,
          speed: 0,
          lap: 0,
          position: 3,
        },
      ];

      renderWithRouter();

      expect(screen.getByText('Player1')).toBeInTheDocument();
      expect(screen.getByText('Player2')).toBeInTheDocument();
      expect(screen.getByText('Player3')).toBeInTheDocument();
    });
  });

  describe('Ready Button', () => {
    it('should show "Ready Up" initially', () => {
      renderWithRouter();

      expect(screen.getByTestId('ready-button')).toHaveTextContent('Ready Up');
    });

    it('should call setLocalPlayerReady when clicked', async () => {
      renderWithRouter();

      const readyButton = screen.getByTestId('ready-button');
      fireEvent.click(readyButton);

      await waitFor(() => {
        expect(mockGameStore.setLocalPlayerReady).toHaveBeenCalledWith(true);
      });
    });

    it('should toggle to "✓ Ready" after clicking', async () => {
      renderWithRouter();

      const readyButton = screen.getByTestId('ready-button');
      fireEvent.click(readyButton);

      await waitFor(() => {
        expect(readyButton).toHaveTextContent('✓ Ready');
      });
    });

    it('should toggle back to "Ready Up" when clicked again', async () => {
      renderWithRouter();

      const readyButton = screen.getByTestId('ready-button');
      
      // First click - ready
      fireEvent.click(readyButton);
      await waitFor(() => {
        expect(readyButton).toHaveTextContent('✓ Ready');
      });

      // Second click - not ready
      fireEvent.click(readyButton);
      await waitFor(() => {
        expect(readyButton).toHaveTextContent('Ready Up');
      });

      expect(mockGameStore.setLocalPlayerReady).toHaveBeenCalledWith(false);
    });

    it('should be disabled when not connected', () => {
      mockGameStore.isConnected = false;

      renderWithRouter();

      const readyButton = screen.getByTestId('ready-button');
      expect(readyButton).toBeDisabled();
    });

    it('should handle ready state errors', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockGameStore.setLocalPlayerReady = vi.fn().mockRejectedValue(new Error('Failed'));

      renderWithRouter();

      const readyButton = screen.getByTestId('ready-button');
      fireEvent.click(readyButton);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      consoleErrorSpy.mockRestore();
    });

    it('should apply ready class when ready', async () => {
      renderWithRouter();

      const readyButton = screen.getByTestId('ready-button');
      fireEvent.click(readyButton);

      await waitFor(() => {
        expect(readyButton).toHaveClass('ready');
      });
    });
  });

  describe('Leave Button', () => {
    it('should show "Leave Game" initially', () => {
      renderWithRouter();

      expect(screen.getByTestId('leave-button')).toHaveTextContent('Leave Game');
    });

    it('should call leaveRoomWithHub when clicked', async () => {
      renderWithRouter();

      const leaveButton = screen.getByTestId('leave-button');
      fireEvent.click(leaveButton);

      await waitFor(() => {
        expect(mockGameStore.leaveRoomWithHub).toHaveBeenCalledWith('room-1');
      });
    });

    it('should navigate to lobby after leaving', async () => {
      renderWithRouter();

      const leaveButton = screen.getByTestId('leave-button');
      fireEvent.click(leaveButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/lobby');
      });
    });

    it('should show "Leaving..." while leaving', async () => {
      renderWithRouter();

      const leaveButton = screen.getByTestId('leave-button');
      fireEvent.click(leaveButton);

      // Check immediately after click
      expect(leaveButton).toHaveTextContent('Leaving...');
    });

    it('should be disabled while leaving', async () => {
      renderWithRouter();

      const leaveButton = screen.getByTestId('leave-button');
      fireEvent.click(leaveButton);

      expect(leaveButton).toBeDisabled();
    });

    it('should not trigger leave multiple times', async () => {
      renderWithRouter();

      const leaveButton = screen.getByTestId('leave-button');
      
      // Click multiple times quickly
      fireEvent.click(leaveButton);
      fireEvent.click(leaveButton);
      fireEvent.click(leaveButton);

      await waitFor(() => {
        expect(mockGameStore.leaveRoomWithHub).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle leave errors', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockGameStore.leaveRoomWithHub = vi.fn().mockRejectedValue(new Error('Failed'));

      renderWithRouter();

      const leaveButton = screen.getByTestId('leave-button');
      fireEvent.click(leaveButton);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      consoleErrorSpy.mockRestore();
    });

    it('should reset leaving state after error', async () => {
      mockGameStore.leaveRoomWithHub = vi.fn().mockRejectedValue(new Error('Failed'));

      renderWithRouter();

      const leaveButton = screen.getByTestId('leave-button');
      fireEvent.click(leaveButton);

      await waitFor(() => {
        expect(leaveButton).not.toBeDisabled();
      });
    });

    it('should not leave if no current room', async () => {
      mockGameStore.currentRoom = null;

      renderWithRouter();

      const leaveButton = screen.getByTestId('leave-button');
      fireEvent.click(leaveButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/lobby');
      });

      expect(mockGameStore.leaveRoomWithHub).not.toHaveBeenCalled();
    });
  });
});
