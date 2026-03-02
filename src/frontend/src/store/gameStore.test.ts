import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useGameStore } from './gameStore';
import { roomsApi } from '@/services/api/roomsApi';
import { GameHubService } from '@/services/signalR';
import type { GameSession, GamePlayer } from '@/types';

// Mock roomsApi
vi.mock('@/services/api/roomsApi', () => ({
  roomsApi: {
    listRooms: vi.fn(),
    createRoom: vi.fn(),
    joinRoom: vi.fn(),
    leaveRoom: vi.fn(),
    getRoomDetails: vi.fn(),
  },
}));

// Mock GameHubService
const mockGameHubInstance = {
  connect: vi.fn().mockResolvedValue(undefined),
  disconnect: vi.fn().mockResolvedValue(undefined),
  joinRoom: vi.fn().mockResolvedValue(undefined),
  leaveRoom: vi.fn().mockResolvedValue(undefined),
  sendPosition: vi.fn().mockResolvedValue(undefined),
  setReady: vi.fn().mockResolvedValue(undefined),
  onPlayerJoined: vi.fn(),
  onPlayerLeft: vi.fn(),
  onPlayerMoved: vi.fn(),
  onPlayerReady: vi.fn(),
  onGameStarting: vi.fn(),
  onGameStarted: vi.fn(),
  onGameEnded: vi.fn(),
  offPlayerJoined: vi.fn(),
  offPlayerLeft: vi.fn(),
  offPlayerMoved: vi.fn(),
  isConnected: vi.fn().mockReturnValue(true),
};

vi.mock('@/services/signalR', () => ({
  GameHubService: vi.fn().mockImplementation(() => mockGameHubInstance),
}));

const mockRoom: GameSession = {
  id: '123',
  worldId: 'world-1',
  hostPlayerId: 'host-123',
  status: 'waiting',
  maxPlayers: 8,
  currentPlayers: 3,
  players: [
    {
      playerId: 'host-123',
      username: 'HostPlayer',
      isReady: true,
      x: 0,
      y: 0,
      rotation: 0,
      speed: 0,
      lap: 0,
      position: 1,
    },
  ],
};

describe('gameStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    const { result } = renderHook(() => useGameStore());
    act(() => {
      result.current.reset();
    });
    vi.clearAllMocks();

    // Reset mock functions
    mockGameHubInstance.connect.mockClear().mockResolvedValue(undefined);
    mockGameHubInstance.disconnect.mockClear().mockResolvedValue(undefined);
    mockGameHubInstance.joinRoom.mockClear().mockResolvedValue(undefined);
    mockGameHubInstance.leaveRoom.mockClear().mockResolvedValue(undefined);
    mockGameHubInstance.sendPosition.mockClear().mockResolvedValue(undefined);
    mockGameHubInstance.setReady.mockClear().mockResolvedValue(undefined);
    mockGameHubInstance.isConnected.mockReturnValue(true);
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useGameStore());

      expect(result.current.rooms).toEqual([]);
      expect(result.current.currentRoom).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('fetchRooms', () => {
    it('should fetch rooms successfully', async () => {
      const mockRooms = [mockRoom, { ...mockRoom, id: '456' }];
      vi.mocked(roomsApi.listRooms).mockResolvedValue(mockRooms);

      const { result } = renderHook(() => useGameStore());

      await act(async () => {
        await result.current.fetchRooms();
      });

      expect(result.current.rooms).toEqual(mockRooms);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should set loading state while fetching', async () => {
      vi.mocked(roomsApi.listRooms).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve([]), 100))
      );

      const { result } = renderHook(() => useGameStore());

      act(() => {
        result.current.fetchRooms();
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should handle error when fetching rooms fails', async () => {
      const errorMessage = 'Failed to fetch rooms';
      vi.mocked(roomsApi.listRooms).mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useGameStore());

      await act(async () => {
        await result.current.fetchRooms();
      });

      expect(result.current.rooms).toEqual([]);
      expect(result.current.error).toBe(errorMessage);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('createRoom', () => {
    it('should create room successfully', async () => {
      const createData = { name: 'My Room', maxPlayers: 4 };
      vi.mocked(roomsApi.createRoom).mockResolvedValue(mockRoom);

      const { result } = renderHook(() => useGameStore());

      await act(async () => {
        await result.current.createRoom(createData);
      });

      expect(roomsApi.createRoom).toHaveBeenCalledWith(createData);
      expect(result.current.currentRoom).toEqual(mockRoom);
      expect(result.current.error).toBeNull();
    });

    it('should set loading state while creating room', async () => {
      const createData = { name: 'My Room', maxPlayers: 4 };
      vi.mocked(roomsApi.createRoom).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockRoom), 100))
      );

      const { result } = renderHook(() => useGameStore());

      act(() => {
        result.current.createRoom(createData);
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should handle error when creating room fails', async () => {
      const createData = { name: 'My Room', maxPlayers: 4 };
      const errorMessage = 'Failed to create room';
      vi.mocked(roomsApi.createRoom).mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useGameStore());

      await act(async () => {
        await result.current.createRoom(createData);
      });

      expect(result.current.currentRoom).toBeNull();
      expect(result.current.error).toBe(errorMessage);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('joinRoom', () => {
    it('should join room successfully', async () => {
      const roomId = '123';
      vi.mocked(roomsApi.joinRoom).mockResolvedValue(mockRoom);

      const { result } = renderHook(() => useGameStore());

      await act(async () => {
        await result.current.joinRoom(roomId);
      });

      expect(roomsApi.joinRoom).toHaveBeenCalledWith(roomId);
      expect(result.current.currentRoom).toEqual(mockRoom);
      expect(result.current.error).toBeNull();
    });

    it('should set loading state while joining room', async () => {
      const roomId = '123';
      vi.mocked(roomsApi.joinRoom).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockRoom), 100))
      );

      const { result } = renderHook(() => useGameStore());

      act(() => {
        result.current.joinRoom(roomId);
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should handle error when joining room fails', async () => {
      const roomId = '123';
      const errorMessage = 'Room is full';
      vi.mocked(roomsApi.joinRoom).mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useGameStore());

      await act(async () => {
        await result.current.joinRoom(roomId);
      });

      expect(result.current.currentRoom).toBeNull();
      expect(result.current.error).toBe(errorMessage);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('leaveRoom', () => {
    it('should leave room successfully', async () => {
      const roomId = '123';
      vi.mocked(roomsApi.leaveRoom).mockResolvedValue(undefined);

      const { result } = renderHook(() => useGameStore());

      // Set current room first
      act(() => {
        result.current.setCurrentRoom(mockRoom);
      });

      await act(async () => {
        await result.current.leaveRoom(roomId);
      });

      expect(roomsApi.leaveRoom).toHaveBeenCalledWith(roomId);
      expect(result.current.currentRoom).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('should set loading state while leaving room', async () => {
      const roomId = '123';
      vi.mocked(roomsApi.leaveRoom).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(undefined), 100))
      );

      const { result } = renderHook(() => useGameStore());

      act(() => {
        result.current.leaveRoom(roomId);
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should handle error when leaving room fails', async () => {
      const roomId = '123';
      const errorMessage = 'Failed to leave room';
      vi.mocked(roomsApi.leaveRoom).mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useGameStore());

      // Set current room first
      act(() => {
        result.current.setCurrentRoom(mockRoom);
      });

      await act(async () => {
        await result.current.leaveRoom(roomId);
      });

      expect(result.current.currentRoom).toEqual(mockRoom); // Should not clear on error
      expect(result.current.error).toBe(errorMessage);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('State Setters', () => {
    it('should set current room', () => {
      const { result } = renderHook(() => useGameStore());

      act(() => {
        result.current.setCurrentRoom(mockRoom);
      });

      expect(result.current.currentRoom).toEqual(mockRoom);
    });

    it('should clear error', () => {
      const { result } = renderHook(() => useGameStore());

      // Set error first
      act(() => {
        result.current.setError('Some error');
      });

      expect(result.current.error).toBe('Some error');

      // Clear error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });

    it('should reset store to initial state', () => {
      const { result } = renderHook(() => useGameStore());

      // Set some state
      act(() => {
        result.current.setCurrentRoom(mockRoom);
        result.current.setError('Some error');
      });

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.rooms).toEqual([]);
      expect(result.current.currentRoom).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('SignalR Integration', () => {
    describe('Initial SignalR State', () => {
      it('should have null gameHub initially', () => {
        const { result } = renderHook(() => useGameStore());

        expect(result.current.gameHub).toBeNull();
        expect(result.current.isConnected).toBe(false);
        expect(result.current.players).toEqual([]);
      });
    });

    describe('connectToGameHub', () => {
      it('should create and connect to game hub successfully', async () => {
        const { result } = renderHook(() => useGameStore());

        await act(async () => {
          await result.current.connectToGameHub();
        });

        expect(result.current.gameHub).not.toBeNull();
        expect(result.current.isConnected).toBe(true);
        expect(result.current.error).toBeNull();
      });

      it('should handle connection error', async () => {
        const errorMessage = 'Connection failed';
        mockGameHubInstance.connect.mockRejectedValue(new Error(errorMessage));

        const { result } = renderHook(() => useGameStore());

        await act(async () => {
          await result.current.connectToGameHub();
        });

        expect(result.current.error).toBe(errorMessage);
        expect(result.current.isConnected).toBe(false);
      });

      it('should not reconnect if already connected', async () => {
        const { result } = renderHook(() => useGameStore());

        // Connect first time
        await act(async () => {
          await result.current.connectToGameHub();
        });

        const firstHub = result.current.gameHub;

        // Try to connect again
        await act(async () => {
          await result.current.connectToGameHub();
        });

        // Should be the same instance
        expect(result.current.gameHub).toBe(firstHub);
      });
    });

    describe('disconnectFromGameHub', () => {
      it('should disconnect from game hub successfully', async () => {
        const { result } = renderHook(() => useGameStore());

        // Connect first
        await act(async () => {
          await result.current.connectToGameHub();
        });

        expect(result.current.isConnected).toBe(true);

        // Disconnect
        await act(async () => {
          await result.current.disconnectFromGameHub();
        });

        expect(result.current.isConnected).toBe(false);
        expect(result.current.gameHub).toBeNull();
        expect(result.current.players).toEqual([]);
      });

      it('should handle disconnection errors', async () => {
        const { result } = renderHook(() => useGameStore());

        // Connect first
        await act(async () => {
          await result.current.connectToGameHub();
        });

        const errorMessage = 'Disconnect failed';
        mockGameHubInstance.disconnect.mockRejectedValue(new Error(errorMessage));

        await act(async () => {
          await result.current.disconnectFromGameHub();
        });

        expect(result.current.error).toBe(errorMessage);
      });

      it('should do nothing if not connected', async () => {
        const { result } = renderHook(() => useGameStore());

        await act(async () => {
          await result.current.disconnectFromGameHub();
        });

        expect(result.current.gameHub).toBeNull();
        expect(result.current.error).toBeNull();
      });
    });

    describe('updatePlayerPosition', () => {
      const mockPlayer: GamePlayer = {
        playerId: 'player-1',
        username: 'TestPlayer',
        isReady: false,
        x: 0,
        y: 0,
        rotation: 0,
        speed: 0,
        lap: 0,
        position: 1,
      };

      it('should update existing player position', () => {
        const { result } = renderHook(() => useGameStore());

        // Add player first
        act(() => {
          result.current.addPlayer(mockPlayer);
        });

        // Update position
        act(() => {
          result.current.updatePlayerPosition('player-1', 100, 200, 45);
        });

        const updatedPlayer = result.current.players.find(
          (p) => p.playerId === 'player-1'
        );
        expect(updatedPlayer?.x).toBe(100);
        expect(updatedPlayer?.y).toBe(200);
        expect(updatedPlayer?.rotation).toBe(45);
      });

      it('should not error if player does not exist', () => {
        const { result } = renderHook(() => useGameStore());

        act(() => {
          result.current.updatePlayerPosition('non-existent', 100, 200, 45);
        });

        expect(result.current.players).toEqual([]);
      });
    });

    describe('sendPosition', () => {
      it('should send position update through game hub', async () => {
        const { result } = renderHook(() => useGameStore());

        // Connect first
        await act(async () => {
          await result.current.connectToGameHub();
        });

        await act(async () => {
          await result.current.sendPosition(100, 200, 45);
        });

        expect(result.current.gameHub?.sendPosition).toHaveBeenCalledWith(100, 200, 45);
      });

      it('should handle error if not connected', async () => {
        const { result } = renderHook(() => useGameStore());

        await act(async () => {
          await result.current.sendPosition(100, 200, 45);
        });

        expect(result.current.error).toBe('Not connected to game hub');
      });

      it('should handle send position errors', async () => {
        const { result } = renderHook(() => useGameStore());

        await act(async () => {
          await result.current.connectToGameHub();
        });

        const errorMessage = 'Failed to send position';
        mockGameHubInstance.sendPosition.mockRejectedValue(new Error(errorMessage));

        await act(async () => {
          await result.current.sendPosition(100, 200, 45);
        });

        expect(result.current.error).toBe(errorMessage);
      });
    });

    describe('setLocalPlayerReady', () => {
      it('should set local player ready status', async () => {
        const { result } = renderHook(() => useGameStore());

        await act(async () => {
          await result.current.connectToGameHub();
        });

        await act(async () => {
          await result.current.setLocalPlayerReady(true);
        });

        expect(result.current.gameHub?.setReady).toHaveBeenCalledWith(true);
      });

      it('should handle error if not connected', async () => {
        const { result } = renderHook(() => useGameStore());

        await act(async () => {
          await result.current.setLocalPlayerReady(true);
        });

        expect(result.current.error).toBe('Not connected to game hub');
      });
    });

    describe('updatePlayerReady', () => {
      const mockPlayer: GamePlayer = {
        playerId: 'player-1',
        username: 'TestPlayer',
        isReady: false,
        x: 0,
        y: 0,
        rotation: 0,
        speed: 0,
        lap: 0,
        position: 1,
      };

      it('should update player ready status', () => {
        const { result } = renderHook(() => useGameStore());

        // Add player first
        act(() => {
          result.current.addPlayer(mockPlayer);
        });

        // Update ready status
        act(() => {
          result.current.updatePlayerReady('player-1', true);
        });

        const updatedPlayer = result.current.players.find(
          (p) => p.playerId === 'player-1'
        );
        expect(updatedPlayer?.isReady).toBe(true);
      });
    });

    describe('addPlayer', () => {
      const mockPlayer: GamePlayer = {
        playerId: 'player-1',
        username: 'TestPlayer',
        isReady: false,
        x: 0,
        y: 0,
        rotation: 0,
        speed: 0,
        lap: 0,
        position: 1,
      };

      it('should add a new player', () => {
        const { result } = renderHook(() => useGameStore());

        act(() => {
          result.current.addPlayer(mockPlayer);
        });

        expect(result.current.players).toHaveLength(1);
        expect(result.current.players[0]).toEqual(mockPlayer);
      });

      it('should not add duplicate player', () => {
        const { result } = renderHook(() => useGameStore());

        act(() => {
          result.current.addPlayer(mockPlayer);
          result.current.addPlayer(mockPlayer);
        });

        expect(result.current.players).toHaveLength(1);
      });
    });

    describe('removePlayer', () => {
      const mockPlayer: GamePlayer = {
        playerId: 'player-1',
        username: 'TestPlayer',
        isReady: false,
        x: 0,
        y: 0,
        rotation: 0,
        speed: 0,
        lap: 0,
        position: 1,
      };

      it('should remove a player', () => {
        const { result } = renderHook(() => useGameStore());

        // Add player first
        act(() => {
          result.current.addPlayer(mockPlayer);
        });

        expect(result.current.players).toHaveLength(1);

        // Remove player
        act(() => {
          result.current.removePlayer('player-1');
        });

        expect(result.current.players).toHaveLength(0);
      });

      it('should not error when removing non-existent player', () => {
        const { result } = renderHook(() => useGameStore());

        act(() => {
          result.current.removePlayer('non-existent');
        });

        expect(result.current.players).toEqual([]);
      });
    });

    describe('Integrated join/leave with SignalR', () => {
      it('should connect to hub when joining room', async () => {
        const roomId = '123';
        vi.mocked(roomsApi.joinRoom).mockResolvedValue(mockRoom);

        const { result } = renderHook(() => useGameStore());

        await act(async () => {
          await result.current.joinRoomWithHub(roomId);
        });

        expect(result.current.currentRoom).toEqual(mockRoom);
        expect(result.current.isConnected).toBe(true);
        expect(result.current.gameHub).not.toBeNull();
      });

      it('should disconnect from hub when leaving room', async () => {
        const roomId = '123';
        vi.mocked(roomsApi.joinRoom).mockResolvedValue(mockRoom);
        vi.mocked(roomsApi.leaveRoom).mockResolvedValue(undefined);

        const { result } = renderHook(() => useGameStore());

        // Join first
        await act(async () => {
          await result.current.joinRoomWithHub(roomId);
        });

        expect(result.current.isConnected).toBe(true);

        // Leave
        await act(async () => {
          await result.current.leaveRoomWithHub(roomId);
        });

        expect(result.current.currentRoom).toBeNull();
        expect(result.current.isConnected).toBe(false);
        expect(result.current.players).toEqual([]);
      });

      it('should handle error during hub join', async () => {
        const roomId = '123';
        vi.mocked(roomsApi.joinRoom).mockResolvedValue(mockRoom);

        const errorMessage = 'Hub join failed';
        mockGameHubInstance.joinRoom.mockRejectedValue(new Error(errorMessage));

        const { result } = renderHook(() => useGameStore());

        await act(async () => {
          await result.current.joinRoomWithHub(roomId);
        });

        expect(result.current.error).toBe(errorMessage);
      });
    });
  });
});
