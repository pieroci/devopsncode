import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useGameStore } from './gameStore';
import { roomsApi } from '@/services/api/roomsApi';
import type { GameSession } from '@/types';

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
});
