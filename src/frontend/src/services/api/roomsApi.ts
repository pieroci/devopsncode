import { apiClient } from '@/services/apiClient';
import type { GameSession } from '@/types';
import { API_ENDPOINTS } from '@/utils/constants';

export interface CreateRoomData {
  name: string;
  maxPlayers: number;
  worldId?: string;
}

/**
 * Game Rooms API service
 */
export const roomsApi = {
  /**
   * List all available game rooms
   */
  async listRooms(): Promise<GameSession[]> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.game.sessions);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Failed to fetch rooms');
    }
  },

  /**
   * Create a new game room
   */
  async createRoom(data: CreateRoomData): Promise<GameSession> {
    try {
      const response = await apiClient.post(API_ENDPOINTS.game.sessions, data);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Failed to create room');
    }
  },

  /**
   * Join an existing game room
   */
  async joinRoom(roomId: string): Promise<GameSession> {
    try {
      const response = await apiClient.post(`${API_ENDPOINTS.game.sessions}/${roomId}/join`);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Failed to join room');
    }
  },

  /**
   * Leave a game room
   */
  async leaveRoom(roomId: string): Promise<void> {
    try {
      await apiClient.post(`${API_ENDPOINTS.game.sessions}/${roomId}/leave`);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Failed to leave room');
    }
  },

  /**
   * Get details of a specific game room
   */
  async getRoomDetails(roomId: string): Promise<GameSession> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.game.getSession(roomId));
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Failed to fetch room details');
    }
  },
};
