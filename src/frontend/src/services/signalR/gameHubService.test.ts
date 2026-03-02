import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GameHubService } from './gameHubService';
import { SignalRClient } from './signalRClient';
import type { GamePlayer } from '@/types';

// Mock SignalR Client
vi.mock('./signalRClient');

const mockSignalRClient = {
  connect: vi.fn(),
  disconnect: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  invoke: vi.fn(),
  isConnected: vi.fn(),
  getConnectionState: vi.fn(),
  onConnectionClosed: vi.fn(),
  onReconnecting: vi.fn(),
  onReconnected: vi.fn(),
};

describe('GameHubService', () => {
  let service: GameHubService;
  const hubUrl = 'http://localhost:5000/gameHub';
  const token = 'test-token';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(SignalRClient).mockImplementation(() => mockSignalRClient as any);
    mockSignalRClient.isConnected.mockReturnValue(false);
    service = new GameHubService(hubUrl, token);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Constructor', () => {
    it('should create SignalR client with hub URL and token', () => {
      expect(SignalRClient).toHaveBeenCalledWith(hubUrl, token);
    });

    it('should register connection lifecycle handlers', () => {
      expect(mockSignalRClient.onConnectionClosed).toHaveBeenCalled();
      expect(mockSignalRClient.onReconnecting).toHaveBeenCalled();
      expect(mockSignalRClient.onReconnected).toHaveBeenCalled();
    });
  });

  describe('connect', () => {
    it('should connect the SignalR client', async () => {
      mockSignalRClient.connect.mockResolvedValue(undefined);

      await service.connect();

      expect(mockSignalRClient.connect).toHaveBeenCalled();
    });

    it('should handle connection errors', async () => {
      const error = new Error('Connection failed');
      mockSignalRClient.connect.mockRejectedValue(error);

      await expect(service.connect()).rejects.toThrow('Connection failed');
    });
  });

  describe('disconnect', () => {
    it('should disconnect the SignalR client', async () => {
      mockSignalRClient.disconnect.mockResolvedValue(undefined);

      await service.disconnect();

      expect(mockSignalRClient.disconnect).toHaveBeenCalled();
    });

    it('should handle disconnection errors', async () => {
      const error = new Error('Disconnection failed');
      mockSignalRClient.disconnect.mockRejectedValue(error);

      await expect(service.disconnect()).rejects.toThrow('Disconnection failed');
    });
  });

  describe('joinRoom', () => {
    it('should invoke JoinRoom hub method', async () => {
      const roomId = 'room-123';
      mockSignalRClient.invoke.mockResolvedValue(undefined);

      await service.joinRoom(roomId);

      expect(mockSignalRClient.invoke).toHaveBeenCalledWith('JoinRoom', roomId);
    });

    it('should return result from hub method', async () => {
      const roomId = 'room-123';
      const mockResponse = { success: true, roomId };
      mockSignalRClient.invoke.mockResolvedValue(mockResponse);

      const result = await service.joinRoom(roomId);

      expect(result).toEqual(mockResponse);
    });

    it('should handle join room errors', async () => {
      const roomId = 'room-123';
      const error = new Error('Room is full');
      mockSignalRClient.invoke.mockRejectedValue(error);

      await expect(service.joinRoom(roomId)).rejects.toThrow('Room is full');
    });
  });

  describe('leaveRoom', () => {
    it('should invoke LeaveRoom hub method', async () => {
      const roomId = 'room-123';
      mockSignalRClient.invoke.mockResolvedValue(undefined);

      await service.leaveRoom(roomId);

      expect(mockSignalRClient.invoke).toHaveBeenCalledWith('LeaveRoom', roomId);
    });

    it('should handle leave room errors', async () => {
      const roomId = 'room-123';
      const error = new Error('Not in room');
      mockSignalRClient.invoke.mockRejectedValue(error);

      await expect(service.leaveRoom(roomId)).rejects.toThrow('Not in room');
    });
  });

  describe('sendPosition', () => {
    it('should invoke SendPosition hub method with position data', async () => {
      const position = { x: 100, y: 200, rotation: 45 };
      mockSignalRClient.invoke.mockResolvedValue(undefined);

      await service.sendPosition(position.x, position.y, position.rotation);

      expect(mockSignalRClient.invoke).toHaveBeenCalledWith(
        'SendPosition',
        position.x,
        position.y,
        position.rotation
      );
    });

    it('should handle send position errors', async () => {
      const error = new Error('Not in game');
      mockSignalRClient.invoke.mockRejectedValue(error);

      await expect(service.sendPosition(100, 200, 45)).rejects.toThrow('Not in game');
    });
  });

  describe('setReady', () => {
    it('should invoke SetReady hub method', async () => {
      const isReady = true;
      mockSignalRClient.invoke.mockResolvedValue(undefined);

      await service.setReady(isReady);

      expect(mockSignalRClient.invoke).toHaveBeenCalledWith('SetReady', isReady);
    });

    it('should handle set ready errors', async () => {
      const error = new Error('Not in room');
      mockSignalRClient.invoke.mockRejectedValue(error);

      await expect(service.setReady(true)).rejects.toThrow('Not in room');
    });
  });

  describe('Event Subscriptions', () => {
    describe('onPlayerJoined', () => {
      it('should subscribe to PlayerJoined event', () => {
        const callback = vi.fn();
        service.onPlayerJoined(callback);

        expect(mockSignalRClient.on).toHaveBeenCalledWith('PlayerJoined', callback);
      });
    });

    describe('onPlayerLeft', () => {
      it('should subscribe to PlayerLeft event', () => {
        const callback = vi.fn();
        service.onPlayerLeft(callback);

        expect(mockSignalRClient.on).toHaveBeenCalledWith('PlayerLeft', callback);
      });
    });

    describe('onPlayerMoved', () => {
      it('should subscribe to PlayerMoved event', () => {
        const callback = vi.fn();
        service.onPlayerMoved(callback);

        expect(mockSignalRClient.on).toHaveBeenCalledWith('PlayerMoved', callback);
      });
    });

    describe('onPlayerReady', () => {
      it('should subscribe to PlayerReady event', () => {
        const callback = vi.fn();
        service.onPlayerReady(callback);

        expect(mockSignalRClient.on).toHaveBeenCalledWith('PlayerReady', callback);
      });
    });

    describe('onGameStarting', () => {
      it('should subscribe to GameStarting event', () => {
        const callback = vi.fn();
        service.onGameStarting(callback);

        expect(mockSignalRClient.on).toHaveBeenCalledWith('GameStarting', callback);
      });
    });

    describe('onGameStarted', () => {
      it('should subscribe to GameStarted event', () => {
        const callback = vi.fn();
        service.onGameStarted(callback);

        expect(mockSignalRClient.on).toHaveBeenCalledWith('GameStarted', callback);
      });
    });

    describe('onGameEnded', () => {
      it('should subscribe to GameEnded event', () => {
        const callback = vi.fn();
        service.onGameEnded(callback);

        expect(mockSignalRClient.on).toHaveBeenCalledWith('GameEnded', callback);
      });
    });
  });

  describe('Event Unsubscriptions', () => {
    it('should unsubscribe from PlayerJoined event', () => {
      const callback = vi.fn();
      service.offPlayerJoined(callback);

      expect(mockSignalRClient.off).toHaveBeenCalledWith('PlayerJoined', callback);
    });

    it('should unsubscribe from PlayerLeft event', () => {
      const callback = vi.fn();
      service.offPlayerLeft(callback);

      expect(mockSignalRClient.off).toHaveBeenCalledWith('PlayerLeft', callback);
    });

    it('should unsubscribe from PlayerMoved event', () => {
      const callback = vi.fn();
      service.offPlayerMoved(callback);

      expect(mockSignalRClient.off).toHaveBeenCalledWith('PlayerMoved', callback);
    });
  });

  describe('isConnected', () => {
    it('should return true when connected', () => {
      mockSignalRClient.isConnected.mockReturnValue(true);
      expect(service.isConnected()).toBe(true);
    });

    it('should return false when disconnected', () => {
      mockSignalRClient.isConnected.mockReturnValue(false);
      expect(service.isConnected()).toBe(false);
    });
  });
});
