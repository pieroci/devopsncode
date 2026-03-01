import { vi } from 'vitest';
import type { Player, User, AuthResponse, GameSession, Match, LeaderboardEntry } from '@/types';

/**
 * Factory functions to create test data
 */

export const createMockUser = (overrides?: Partial<User>): User => ({
  id: '1',
  username: 'testuser',
  email: 'test@example.com',
  createdAt: new Date().toISOString(),
  ...overrides,
});

export const createMockAuthResponse = (overrides?: Partial<AuthResponse>): AuthResponse => ({
  token: 'mock-jwt-token',
  refreshToken: 'mock-refresh-token',
  expiresAt: new Date(Date.now() + 3600000).toISOString(),
  user: createMockUser(),
  ...overrides,
});

export const createMockPlayer = (overrides?: Partial<Player>): Player => ({
  id: '1',
  userId: '1',
  username: 'testplayer',
  level: 1,
  experience: 0,
  currentElo: 1200,
  rank: 'Bronze',
  gamesPlayed: 0,
  wins: 0,
  losses: 0,
  winStreak: 0,
  createdAt: new Date().toISOString(),
  ...overrides,
});

export const createMockGameSession = (overrides?: Partial<GameSession>): GameSession => ({
  id: 'session-1',
  worldId: 'world-1',
  hostPlayerId: 'player-1',
  status: 'waiting',
  maxPlayers: 4,
  currentPlayers: 1,
  players: [],
  ...overrides,
});

export const createMockMatch = (overrides?: Partial<Match>): Match => ({
  id: 'match-1',
  worldId: 'world-1',
  status: 'pending',
  players: [],
  ...overrides,
});

export const createMockLeaderboardEntry = (overrides?: Partial<LeaderboardEntry>): LeaderboardEntry => ({
  rank: 1,
  playerId: 'player-1',
  username: 'testplayer',
  elo: 1500,
  gamesPlayed: 10,
  wins: 7,
  losses: 3,
  winRate: 0.7,
  ...overrides,
});

/**
 * Mock API response helper
 */
export const createMockApiResponse = <T,>(data: T, success = true) => ({
  success,
  data,
  error: success ? undefined : 'Mock error',
  message: success ? 'Success' : 'Error occurred',
});

/**
 * Mock pagination response
 */
export const createMockPaginatedResponse = <T,>(
  items: T[],
  page = 1,
  pageSize = 10
) => ({
  items,
  total: items.length,
  page,
  pageSize,
  totalPages: Math.ceil(items.length / pageSize),
});

/**
 * Delay helper for async tests
 */
export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Mock localStorage
 */
export const mockLocalStorage = () => {
  const store: Record<string, string> = {};
  
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach((key) => delete store[key]);
    }),
  };
};
