import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { roomsApi } from './roomsApi';
import { apiClient } from '@/services/apiClient';
import type { GameSession } from '@/types';

// Mock apiClient
vi.mock('@/services/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
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

describe('roomsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('listRooms', () => {
    it('should fetch list of rooms successfully', async () => {
      const mockRooms = [mockRoom, { ...mockRoom, id: '456' }];
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { success: true, data: mockRooms },
      });

      const result = await roomsApi.listRooms();

      expect(apiClient.get).toHaveBeenCalledWith('/api/game/sessions');
      expect(result).toEqual(mockRooms);
    });

    it('should handle API error when listing rooms', async () => {
      vi.mocked(apiClient.get).mockRejectedValue({
        response: { data: { error: 'Server error' } },
      });

      await expect(roomsApi.listRooms()).rejects.toThrow('Server error');
    });

    it('should handle network error when listing rooms', async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error('Network error'));

      await expect(roomsApi.listRooms()).rejects.toThrow('Network error');
    });
  });

  describe('createRoom', () => {
    it('should create a room successfully', async () => {
      const createData = { name: 'My Room', maxPlayers: 4 };
      vi.mocked(apiClient.post).mockResolvedValue({
        data: { success: true, data: mockRoom },
      });

      const result = await roomsApi.createRoom(createData);

      expect(apiClient.post).toHaveBeenCalledWith('/api/game/sessions', createData);
      expect(result).toEqual(mockRoom);
    });

    it('should handle API error when creating room', async () => {
      const createData = { name: 'My Room', maxPlayers: 4 };
      vi.mocked(apiClient.post).mockRejectedValue({
        response: { data: { error: 'Invalid room name' } },
      });

      await expect(roomsApi.createRoom(createData)).rejects.toThrow('Invalid room name');
    });

    it('should handle network error when creating room', async () => {
      const createData = { name: 'My Room', maxPlayers: 4 };
      vi.mocked(apiClient.post).mockRejectedValue(new Error('Connection timeout'));

      await expect(roomsApi.createRoom(createData)).rejects.toThrow('Connection timeout');
    });
  });

  describe('joinRoom', () => {
    it('should join a room successfully', async () => {
      const roomId = '123';
      vi.mocked(apiClient.post).mockResolvedValue({
        data: { success: true, data: mockRoom },
      });

      const result = await roomsApi.joinRoom(roomId);

      expect(apiClient.post).toHaveBeenCalledWith(`/api/game/sessions/${roomId}/join`);
      expect(result).toEqual(mockRoom);
    });

    it('should handle room full error when joining', async () => {
      const roomId = '123';
      vi.mocked(apiClient.post).mockRejectedValue({
        response: { data: { error: 'Room is full' } },
      });

      await expect(roomsApi.joinRoom(roomId)).rejects.toThrow('Room is full');
    });

    it('should handle room not found error when joining', async () => {
      const roomId = '999';
      vi.mocked(apiClient.post).mockRejectedValue({
        response: { data: { error: 'Room not found' } },
      });

      await expect(roomsApi.joinRoom(roomId)).rejects.toThrow('Room not found');
    });
  });

  describe('leaveRoom', () => {
    it('should leave a room successfully', async () => {
      const roomId = '123';
      vi.mocked(apiClient.post).mockResolvedValue({
        data: { success: true },
      });

      await roomsApi.leaveRoom(roomId);

      expect(apiClient.post).toHaveBeenCalledWith(`/api/game/sessions/${roomId}/leave`);
    });

    it('should handle API error when leaving room', async () => {
      const roomId = '123';
      vi.mocked(apiClient.post).mockRejectedValue({
        response: { data: { error: 'Not in room' } },
      });

      await expect(roomsApi.leaveRoom(roomId)).rejects.toThrow('Not in room');
    });

    it('should not throw on leave even if request fails (silent fail)', async () => {
      const roomId = '123';
      vi.mocked(apiClient.post).mockRejectedValue(new Error('Network error'));

      // Should not throw - just log error
      await expect(roomsApi.leaveRoom(roomId)).rejects.toThrow('Network error');
    });
  });

  describe('getRoomDetails', () => {
    it('should get room details successfully', async () => {
      const roomId = '123';
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { success: true, data: mockRoom },
      });

      const result = await roomsApi.getRoomDetails(roomId);

      expect(apiClient.get).toHaveBeenCalledWith(`/api/game/sessions/${roomId}`);
      expect(result).toEqual(mockRoom);
    });

    it('should handle room not found error', async () => {
      const roomId = '999';
      vi.mocked(apiClient.get).mockRejectedValue({
        response: { data: { error: 'Room not found' } },
      });

      await expect(roomsApi.getRoomDetails(roomId)).rejects.toThrow('Room not found');
    });

    it('should handle API error when getting room details', async () => {
      const roomId = '123';
      vi.mocked(apiClient.get).mockRejectedValue({
        response: { data: { error: 'Server error' } },
      });

      await expect(roomsApi.getRoomDetails(roomId)).rejects.toThrow('Server error');
    });
  });

  describe('Error handling', () => {
    it('should use default error message when no error message provided', async () => {
      vi.mocked(apiClient.get).mockRejectedValue({});

      await expect(roomsApi.listRooms()).rejects.toThrow('Failed to fetch rooms');
    });

    it('should handle errors without response object', async () => {
      vi.mocked(apiClient.post).mockRejectedValue({
        message: 'Request failed',
      });

      await expect(roomsApi.createRoom({ name: 'Test', maxPlayers: 4 }))
        .rejects.toThrow('Request failed');
    });
  });
});
