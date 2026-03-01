import { vi } from 'vitest';

/**
 * Mock SignalR HubConnection
 */
export const createMockHubConnection = () => ({
  start: vi.fn().mockResolvedValue(undefined),
  stop: vi.fn().mockResolvedValue(undefined),
  on: vi.fn(),
  off: vi.fn(),
  invoke: vi.fn().mockResolvedValue(undefined),
  send: vi.fn().mockResolvedValue(undefined),
  state: 'Connected',
  connectionId: 'mock-connection-id',
  baseUrl: 'http://localhost:5000/hubs/game',
  onclose: vi.fn(),
  onreconnecting: vi.fn(),
  onreconnected: vi.fn(),
});

/**
 * Mock HubConnectionBuilder
 */
export const MockHubConnectionBuilder = vi.fn().mockImplementation(() => ({
  withUrl: vi.fn().mockReturnThis(),
  withAutomaticReconnect: vi.fn().mockReturnThis(),
  configureLogging: vi.fn().mockReturnThis(),
  build: vi.fn().mockReturnValue(createMockHubConnection()),
}));

// Mock the @microsoft/signalr module
vi.mock('@microsoft/signalr', () => ({
  HubConnectionBuilder: MockHubConnectionBuilder,
  HubConnectionState: {
    Connecting: 'Connecting',
    Connected: 'Connected',
    Reconnecting: 'Reconnecting',
    Disconnected: 'Disconnected',
    Disconnecting: 'Disconnecting',
  },
  LogLevel: {
    Trace: 0,
    Debug: 1,
    Information: 2,
    Warning: 3,
    Error: 4,
    Critical: 5,
    None: 6,
  },
}));

export const mockGameHubEvents = {
  PlayerMoved: vi.fn(),
  PowerUpCollected: vi.fn(),
  PlayerCollision: vi.fn(),
  RaceStarted: vi.fn(),
  RaceFinished: vi.fn(),
  PlayerJoined: vi.fn(),
  PlayerLeft: vi.fn(),
};

export const mockNotificationHubEvents = {
  MatchFound: vi.fn(),
  GameStarted: vi.fn(),
  AchievementUnlocked: vi.fn(),
  FriendRequest: vi.fn(),
  SystemNotification: vi.fn(),
};
