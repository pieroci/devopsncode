import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { PhaserGame } from '../PhaserGame';
import { useGameStore } from '@/store/gameStore';
import { GameManager } from '../GameManager';

// Mock GameManager
vi.mock('../GameManager', () => ({
  GameManager: vi.fn().mockImplementation(() => ({
    initialize: vi.fn(),
    destroy: vi.fn(),
    isInitialized: vi.fn().mockReturnValue(true),
    getGame: vi.fn().mockReturnValue({}),
  })),
}));

// Mock useGameStore
vi.mock('@/store/gameStore', () => ({
  useGameStore: vi.fn(),
}));

describe('PhaserGame', () => {
  let mockGameStore: any;

  beforeEach(() => {
    mockGameStore = {
      sendPosition: vi.fn().mockResolvedValue(undefined),
      players: [],
      currentRoom: { id: 'room-1', name: 'Test Room' },
    };

    vi.mocked(useGameStore).mockReturnValue(mockGameStore as any);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render game container', () => {
      render(<PhaserGame />);

      const container = screen.getByTestId('phaser-game-container');
      expect(container).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<PhaserGame className="custom-class" />);

      const container = screen.getByTestId('phaser-game-container');
      expect(container).toHaveClass('custom-class');
      expect(container).toHaveClass('phaser-game-container');
    });

    it('should have default className', () => {
      render(<PhaserGame />);

      const container = screen.getByTestId('phaser-game-container');
      expect(container).toHaveClass('phaser-game-container');
    });
  });

  describe('Initialization', () => {
    it('should create GameManager on mount', () => {
      render(<PhaserGame />);

      expect(GameManager).toHaveBeenCalledWith(
        expect.objectContaining({
          sendPosition: mockGameStore.sendPosition,
          players: mockGameStore.players,
          currentRoom: mockGameStore.currentRoom,
        }),
        expect.objectContaining({
          onReady: expect.any(Function),
          onDestroy: expect.any(Function),
        })
      );
    });

    it('should initialize game with container', () => {
      render(<PhaserGame />);

      const mockManager = vi.mocked(GameManager).mock.results[0].value;
      expect(mockManager.initialize).toHaveBeenCalled();
    });

    it('should pass scenes to initialize', () => {
      const mockScenes = ['scene1', 'scene2'];
      render(<PhaserGame scenes={mockScenes as any} />);

      const mockManager = vi.mocked(GameManager).mock.results[0].value;
      expect(mockManager.initialize).toHaveBeenCalledWith(
        expect.any(HTMLDivElement),
        mockScenes
      );
    });

    it('should handle empty scenes array', () => {
      render(<PhaserGame scenes={[]} />);

      const mockManager = vi.mocked(GameManager).mock.results[0].value;
      expect(mockManager.initialize).toHaveBeenCalledWith(
        expect.any(HTMLDivElement),
        []
      );
    });
  });

  describe('Lifecycle', () => {
    it('should destroy game on unmount', () => {
      const { unmount } = render(<PhaserGame />);

      const mockManager = vi.mocked(GameManager).mock.results[0].value;

      unmount();

      expect(mockManager.destroy).toHaveBeenCalled();
    });

    it('should call onReady callback', async () => {
      const onReady = vi.fn();

      // Mock GameManager to immediately call onReady
      vi.mocked(GameManager).mockImplementation((gameState, events) => {
        setTimeout(() => events.onReady?.(), 0);
        return {
          initialize: vi.fn(),
          destroy: vi.fn(),
          isInitialized: vi.fn().mockReturnValue(true),
          getGame: vi.fn().mockReturnValue({}),
        } as any;
      });

      render(<PhaserGame onReady={onReady} />);

      await waitFor(() => {
        expect(onReady).toHaveBeenCalled();
      });
    });

    it('should call onDestroy callback', async () => {
      const onDestroy = vi.fn();

      // Mock GameManager to call onDestroy when destroyed
      vi.mocked(GameManager).mockImplementation((gameState, events) => ({
        initialize: vi.fn(),
        destroy: vi.fn(() => events.onDestroy?.()),
        isInitialized: vi.fn().mockReturnValue(true),
        getGame: vi.fn().mockReturnValue({}),
      } as any));

      const { unmount } = render(<PhaserGame onDestroy={onDestroy} />);

      unmount();

      await waitFor(() => {
        expect(onDestroy).toHaveBeenCalled();
      });
    });

    it('should update data-ready attribute', async () => {
      // Mock GameManager to call onReady
      vi.mocked(GameManager).mockImplementation((gameState, events) => {
        setTimeout(() => events.onReady?.(), 0);
        return {
          initialize: vi.fn(),
          destroy: vi.fn(),
          isInitialized: vi.fn().mockReturnValue(true),
          getGame: vi.fn().mockReturnValue({}),
        } as any;
      });

      render(<PhaserGame />);

      const container = screen.getByTestId('phaser-game-container');

      await waitFor(() => {
        expect(container).toHaveAttribute('data-ready', 'true');
      });
    });
  });

  describe('Integration with GameStore', () => {
    it('should use sendPosition from store', () => {
      render(<PhaserGame />);

      expect(useGameStore).toHaveBeenCalled();
      
      const mockManager = vi.mocked(GameManager).mock.calls[0][0];
      expect(mockManager.sendPosition).toBe(mockGameStore.sendPosition);
    });

    it('should use players from store', () => {
      const mockPlayers = [
        { playerId: '1', username: 'Player1', x: 0, y: 0 },
      ];
      mockGameStore.players = mockPlayers;

      render(<PhaserGame />);

      const mockManager = vi.mocked(GameManager).mock.calls[0][0];
      expect(mockManager.players).toBe(mockPlayers);
    });

    it('should use currentRoom from store', () => {
      const mockRoom = { id: 'room-2', name: 'Another Room' };
      mockGameStore.currentRoom = mockRoom;

      render(<PhaserGame />);

      const mockManager = vi.mocked(GameManager).mock.calls[0][0];
      expect(mockManager.currentRoom).toBe(mockRoom);
    });
  });
});
