import { create } from 'zustand';
import type { GameSession } from '@/types';
import { roomsApi, type CreateRoomData } from '@/services/api/roomsApi';

interface GameState {
  rooms: GameSession[];
  currentRoom: GameSession | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchRooms: () => Promise<void>;
  createRoom: (data: CreateRoomData) => Promise<void>;
  joinRoom: (roomId: string) => Promise<void>;
  leaveRoom: (roomId: string) => Promise<void>;
  setCurrentRoom: (room: GameSession | null) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  rooms: [],
  currentRoom: null,
  isLoading: false,
  error: null,
};

export const useGameStore = create<GameState>((set) => ({
  ...initialState,

  fetchRooms: async () => {
    set({ isLoading: true, error: null });
    try {
      const rooms = await roomsApi.listRooms();
      set({ rooms, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  createRoom: async (data: CreateRoomData) => {
    set({ isLoading: true, error: null });
    try {
      const room = await roomsApi.createRoom(data);
      set({ currentRoom: room, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  joinRoom: async (roomId: string) => {
    set({ isLoading: true, error: null });
    try {
      const room = await roomsApi.joinRoom(roomId);
      set({ currentRoom: room, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  leaveRoom: async (roomId: string) => {
    set({ isLoading: true, error: null });
    try {
      await roomsApi.leaveRoom(roomId);
      set({ currentRoom: null, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  setCurrentRoom: (room: GameSession | null) => {
    set({ currentRoom: room });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  clearError: () => {
    set({ error: null });
  },

  reset: () => {
    set(initialState);
  },
}));
