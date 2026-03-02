import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SignalRClient } from './signalRClient';
import * as signalR from '@microsoft/signalr';

const mockConnection = {
  start: vi.fn(),
  stop: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  invoke: vi.fn(),
  state: 'Disconnected',
  onclose: vi.fn(),
  onreconnecting: vi.fn(),
  onreconnected: vi.fn(),
};

const mockBuilder = {
  withUrl: vi.fn().mockReturnThis(),
  withAutomaticReconnect: vi.fn().mockReturnThis(),
  configureLogging: vi.fn().mockReturnThis(),
  build: vi.fn(() => mockConnection),
};

// Mock @microsoft/signalr
vi.mock('@microsoft/signalr', () => ({
  HubConnectionBuilder: vi.fn(() => mockBuilder),
  HubConnectionState: {
    Disconnected: 'Disconnected',
    Connecting: 'Connecting',
    Connected: 'Connected',
    Disconnecting: 'Disconnecting',
    Reconnecting: 'Reconnecting',
  },
  LogLevel: {
    Information: 1,
    Warning: 2,
    Error: 3,
  },
}));

describe('SignalRClient', () => {
  let client: SignalRClient;
  const hubUrl = 'http://localhost:5000/gameHub';
  const token = 'test-token';

  beforeEach(() => {
    vi.clearAllMocks();
    mockConnection.state = 'Disconnected';
    // Reset mock functions
    mockConnection.start.mockClear();
    mockConnection.stop.mockClear();
    mockConnection.on.mockClear();
    mockConnection.off.mockClear();
    mockConnection.invoke.mockClear();
    mockConnection.onclose.mockClear();
    mockConnection.onreconnecting.mockClear();
    mockConnection.onreconnected.mockClear();
    
    // Reset builder mocks
    mockBuilder.withUrl.mockClear().mockReturnThis();
    mockBuilder.withAutomaticReconnect.mockClear().mockReturnThis();
    mockBuilder.configureLogging.mockClear().mockReturnThis();
    mockBuilder.build.mockClear().mockReturnValue(mockConnection);
    
    client = new SignalRClient(hubUrl, token);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Constructor', () => {
    it('should create SignalR connection with correct configuration', () => {
      expect(signalR.HubConnectionBuilder).toHaveBeenCalled();
    });

    it('should configure connection with URL and token', () => {
      expect(mockBuilder.withUrl).toHaveBeenCalledWith(
        hubUrl,
        expect.objectContaining({
          accessTokenFactory: expect.any(Function),
        })
      );
    });

    it('should enable automatic reconnection', () => {
      expect(mockBuilder.withAutomaticReconnect).toHaveBeenCalled();
    });
  });

  describe('connect', () => {
    it('should start the connection successfully', async () => {
      mockConnection.start.mockResolvedValue(undefined);
      
      await client.connect();

      expect(mockConnection.start).toHaveBeenCalled();
    });

    it('should handle connection errors', async () => {
      const error = new Error('Connection failed');
      mockConnection.start.mockRejectedValue(error);

      await expect(client.connect()).rejects.toThrow('Connection failed');
    });

    it('should not connect if already connected', async () => {
      mockConnection.state = 'Connected';
      mockConnection.start.mockResolvedValue(undefined);

      await client.connect();

      expect(mockConnection.start).not.toHaveBeenCalled();
    });
  });

  describe('disconnect', () => {
    it('should stop the connection successfully', async () => {
      mockConnection.state = 'Connected';
      mockConnection.stop.mockResolvedValue(undefined);

      await client.disconnect();

      expect(mockConnection.stop).toHaveBeenCalled();
    });

    it('should handle disconnection errors', async () => {
      mockConnection.state = 'Connected';
      const error = new Error('Disconnection failed');
      mockConnection.stop.mockRejectedValue(error);

      await expect(client.disconnect()).rejects.toThrow('Disconnection failed');
    });

    it('should not disconnect if already disconnected', async () => {
      mockConnection.state = 'Disconnected';
      mockConnection.stop.mockResolvedValue(undefined);

      await client.disconnect();

      expect(mockConnection.stop).not.toHaveBeenCalled();
    });
  });

  describe('on (event subscription)', () => {
    it('should subscribe to an event', () => {
      const callback = vi.fn();
      client.on('PlayerJoined', callback);

      expect(mockConnection.on).toHaveBeenCalledWith('PlayerJoined', callback);
    });

    it('should allow multiple subscriptions to same event', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      client.on('PlayerJoined', callback1);
      client.on('PlayerJoined', callback2);

      expect(mockConnection.on).toHaveBeenCalledTimes(2);
    });
  });

  describe('off (event unsubscription)', () => {
    it('should unsubscribe from an event', () => {
      const callback = vi.fn();
      client.off('PlayerJoined', callback);

      expect(mockConnection.off).toHaveBeenCalledWith('PlayerJoined', callback);
    });

    it('should unsubscribe all handlers if no callback provided', () => {
      client.off('PlayerJoined');

      expect(mockConnection.off).toHaveBeenCalledWith('PlayerJoined');
    });
  });

  describe('invoke (method invocation)', () => {
    it('should invoke a method without arguments', async () => {
      mockConnection.invoke.mockResolvedValue(undefined);

      await client.invoke('GetPlayers');

      expect(mockConnection.invoke).toHaveBeenCalledWith('GetPlayers');
    });

    it('should invoke a method with arguments', async () => {
      mockConnection.invoke.mockResolvedValue(undefined);

      await client.invoke('JoinRoom', 'room-123');

      expect(mockConnection.invoke).toHaveBeenCalledWith('JoinRoom', 'room-123');
    });

    it('should invoke a method with multiple arguments', async () => {
      mockConnection.invoke.mockResolvedValue(undefined);

      await client.invoke('SendPosition', 100, 200, 45);

      expect(mockConnection.invoke).toHaveBeenCalledWith('SendPosition', 100, 200, 45);
    });

    it('should return the result from invocation', async () => {
      const mockResult = { success: true, data: 'test' };
      mockConnection.invoke.mockResolvedValue(mockResult);

      const result = await client.invoke('GetData');

      expect(result).toEqual(mockResult);
    });

    it('should handle invocation errors', async () => {
      const error = new Error('Method invocation failed');
      mockConnection.invoke.mockRejectedValue(error);

      await expect(client.invoke('FailingMethod')).rejects.toThrow('Method invocation failed');
    });
  });

  describe('getConnectionState', () => {
    it('should return current connection state', () => {
      mockConnection.state = 'Connected';
      expect(client.getConnectionState()).toBe('Connected');
    });

    it('should return Disconnected when not connected', () => {
      mockConnection.state = 'Disconnected';
      expect(client.getConnectionState()).toBe('Disconnected');
    });

    it('should return Reconnecting state', () => {
      mockConnection.state = 'Reconnecting';
      expect(client.getConnectionState()).toBe('Reconnecting');
    });
  });

  describe('isConnected', () => {
    it('should return true when connected', () => {
      mockConnection.state = 'Connected';
      expect(client.isConnected()).toBe(true);
    });

    it('should return false when disconnected', () => {
      mockConnection.state = 'Disconnected';
      expect(client.isConnected()).toBe(false);
    });

    it('should return false when connecting', () => {
      mockConnection.state = 'Connecting';
      expect(client.isConnected()).toBe(false);
    });
  });

  describe('Connection Lifecycle Events', () => {
    it('should handle onclose event', () => {
      const callback = vi.fn();
      client.onConnectionClosed(callback);

      expect(mockConnection.onclose).toHaveBeenCalledWith(callback);
    });

    it('should handle onreconnecting event', () => {
      const callback = vi.fn();
      client.onReconnecting(callback);

      expect(mockConnection.onreconnecting).toHaveBeenCalledWith(callback);
    });

    it('should handle onreconnected event', () => {
      const callback = vi.fn();
      client.onReconnected(callback);

      expect(mockConnection.onreconnected).toHaveBeenCalledWith(callback);
    });
  });
});
