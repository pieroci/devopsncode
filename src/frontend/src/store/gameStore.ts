import { create } from 'zustand';
import type { GameSession, GamePlayer } from '@/types';
import { roomsApi, type CreateRoomData } from '@/services/api/roomsApi';
import { GameHubService } from '@/services/signalR';

export interface GameState {
  rooms: GameSession[];
  currentRoom: GameSession | null;
  isLoading: boolean;
  error: string | null;

  // SignalR
  gameHub: GameHubService | null;
  isConnected: boolean;
  players: GamePlayer[];

  // REST API Actions
  fetchRooms: () => Promise<void>;
  createRoom: (data: CreateRoomData) => Promise<void>;
  joinRoom: (roomId: string) => Promise<void>;
  leaveRoom: (roomId: string) => Promise<void>;
  setCurrentRoom: (room: GameSession | null) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;

  // SignalR Actions
  connectToGameHub: () => Promise<void>;
  disconnectFromGameHub: () => Promise<void>;
  updatePlayerPosition: (playerId: string, x: number, y: number, rotation: number) => void;
  sendPosition: (x: number, y: number, rotation: number) => Promise<void>;
  setLocalPlayerReady: (isReady: boolean) => Promise<void>;
  updatePlayerReady: (playerId: string, isReady: boolean) => void;
  addPlayer: (player: GamePlayer) => void;
  removePlayer: (playerId: string) => void;

  // Integrated Actions
  joinRoomWithHub: (roomId: string) => Promise<void>;
  leaveRoomWithHub: (roomId: string) => Promise<void>;
}

const initialState = {
  rooms: [],
  currentRoom: null,
  isLoading: false,
  error: null,
  gameHub: null,
  isConnected: false,
  players: [],
};

// Get API URL from environment or use default
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const HUB_URL = `${API_URL}/gameHub`;

export const useGameStore = create<GameState>((set, get) => ({
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

  // SignalR Actions

  connectToGameHub: async () => {
    const { gameHub, isConnected } = get();

    // Don't reconnect if already connected
    if (gameHub && isConnected) {
      return;
    }

    try {
      // Get auth token from auth store or session storage
      const token = sessionStorage.getItem('token') || '';

      const hub = new GameHubService(HUB_URL, token);

      // Set up event handlers
      hub.onPlayerJoined((player: GamePlayer) => {
        get().addPlayer(player);
      });

      hub.onPlayerLeft((playerId: string) => {
        get().removePlayer(playerId);
      });

      hub.onPlayerMoved((position: any) => {
        get().updatePlayerPosition(
          position.playerId,
          position.x,
          position.y,
          position.rotation
        );
      });

      hub.onPlayerReady((playerId: string, isReady: boolean) => {
        get().updatePlayerReady(playerId, isReady);
      });

      // Connect to hub
      await hub.connect();

      set({
        gameHub: hub,
        isConnected: true,
        error: null,
      });
    } catch (error: any) {
      set({
        error: error.message,
        isConnected: false,
      });
    }
  },

  disconnectFromGameHub: async () => {
    const { gameHub } = get();

    if (!gameHub) {
      return;
    }

    try {
      await gameHub.disconnect();
      set({
        gameHub: null,
        isConnected: false,
        players: [],
      });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  updatePlayerPosition: (playerId: string, x: number, y: number, rotation: number) => {
    set((state) => ({
      players: state.players.map((player) =>
        player.playerId === playerId
          ? { ...player, x, y, rotation }
          : player
      ),
    }));
  },

  sendPosition: async (x: number, y: number, rotation: number) => {
    const { gameHub, isConnected } = get();

    if (!gameHub || !isConnected) {
      set({ error: 'Not connected to game hub' });
      return;
    }

    try {
      await gameHub.sendPosition(x, y, rotation);
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  setLocalPlayerReady: async (isReady: boolean) => {
    const { gameHub, isConnected } = get();

    if (!gameHub || !isConnected) {
      set({ error: 'Not connected to game hub' });
      return;
    }

    try {
      await gameHub.setReady(isReady);
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  updatePlayerReady: (playerId: string, isReady: boolean) => {
    set((state) => ({
      players: state.players.map((player) =>
        player.playerId === playerId
          ? { ...player, isReady }
          : player
      ),
    }));
  },

  addPlayer: (player: GamePlayer) => {
    set((state) => {
      // Don't add if player already exists
      if (state.players.some((p) => p.playerId === player.playerId)) {
        return state;
      }
      return {
        players: [...state.players, player],
      };
    });
  },

  removePlayer: (playerId: string) => {
    set((state) => ({
      players: state.players.filter((player) => player.playerId !== playerId),
    }));
  },

  // Integrated Actions

  joinRoomWithHub: async (roomId: string) => {
    set({ isLoading: true, error: null });

    try {
      // First join the room via REST API
      const room = await roomsApi.joinRoom(roomId);
      set({ currentRoom: room });

      // Then connect to SignalR hub
      await get().connectToGameHub();

      // Join the room in the hub
      const { gameHub } = get();
      if (gameHub) {
        await gameHub.joinRoom(roomId);
      }

      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error.message,
        isLoading: false,
      });
    }
  },

  leaveRoomWithHub: async (roomId: string) => {
    set({ isLoading: true, error: null });

    try {
      // First leave room in hub
      const { gameHub } = get();
      if (gameHub) {
        await gameHub.leaveRoom(roomId);
      }

      // Disconnect from hub
      await get().disconnectFromGameHub();

      // Then leave room via REST API
      await roomsApi.leaveRoom(roomId);

      set({
        currentRoom: null,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.message,
        isLoading: false,
      });
    }
  },
}));
