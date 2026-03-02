import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GameManager } from '../GameManager';
import Phaser from 'phaser';

// Mock Phaser
vi.mock('phaser', () => {
  const mockScene = {
    scene: {
      start: vi.fn(),
      stop: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      getScene: vi.fn(),
      getScenes: vi.fn().mockReturnValue([]),
    },
  };

  const mockGame = {
    destroy: vi.fn(),
    scene: {
      start: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      getScene: vi.fn().mockReturnValue(mockScene),
      getScenes: vi.fn().mockReturnValue([mockScene]),
    },
  };

  return {
    default: {
      Game: vi.fn().mockImplementation(() => mockGame),
      AUTO: 'AUTO',
      Scale: {
        FIT: 'FIT',
        CENTER_BOTH: 'CENTER_BOTH',
      },
    },
  };
});

describe('GameManager', () => {
  let gameManager: GameManager;
  let mockGameState: any;
  let mockEvents: any;

  beforeEach(() => {
    mockGameState = {
      sendPosition: vi.fn().mockResolvedValue(undefined),
      players: [],
      currentRoom: { id: 'room-1', name: 'Test Room' },
    };

    mockEvents = {
      onReady: vi.fn(),
      onDestroy: vi.fn(),
      onSceneChange: vi.fn(),
    };

    gameManager = new GameManager(mockGameState, mockEvents);
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (gameManager.isInitialized()) {
      gameManager.destroy();
    }
  });

  describe('Initialization', () => {
    it('should create GameManager instance', () => {
      expect(gameManager).toBeInstanceOf(GameManager);
      expect(gameManager.isInitialized()).toBe(false);
    });

    it('should initialize game with container', () => {
      const container = document.createElement('div');
      gameManager.initialize(container);

      expect(gameManager.isInitialized()).toBe(true);
      expect(Phaser.Game).toHaveBeenCalled();
      expect(mockEvents.onReady).toHaveBeenCalled();
    });

    it('should initialize game with string container', () => {
      gameManager.initialize('game-container');

      expect(gameManager.isInitialized()).toBe(true);
      expect(Phaser.Game).toHaveBeenCalled();
    });

    it('should not reinitialize if already initialized', () => {
      const container = document.createElement('div');
      gameManager.initialize(container);
      
      const callCount = (Phaser.Game as any).mock.calls.length;
      
      // Try to initialize again
      gameManager.initialize(container);
      
      expect((Phaser.Game as any).mock.calls.length).toBe(callCount);
    });

    it('should initialize without events', () => {
      const gameManagerNoEvents = new GameManager(mockGameState);
      const container = document.createElement('div');

      gameManagerNoEvents.initialize(container);

      expect(gameManagerNoEvents.isInitialized()).toBe(true);
      gameManagerNoEvents.destroy();
    });
  });

  describe('Destruction', () => {
    it('should destroy game instance', () => {
      const container = document.createElement('div');
      gameManager.initialize(container);
      
      const game = gameManager.getGame();
      
      gameManager.destroy();

      expect(game?.destroy).toHaveBeenCalledWith(true);
      expect(gameManager.isInitialized()).toBe(false);
      expect(mockEvents.onDestroy).toHaveBeenCalled();
    });

    it('should handle destroy when not initialized', () => {
      gameManager.destroy();

      expect(gameManager.isInitialized()).toBe(false);
      expect(mockEvents.onDestroy).not.toHaveBeenCalled();
    });

    it('should cleanup intervals on destroy', () => {
      vi.useFakeTimers();
      const container = document.createElement('div');
      gameManager.initialize(container);
      
      gameManager.destroy();

      // Should not throw when timers are cleared
      expect(() => vi.advanceTimersByTime(1000)).not.toThrow();
      
      vi.useRealTimers();
    });
  });

  describe('Scene Management', () => {
    beforeEach(() => {
      const container = document.createElement('div');
      gameManager.initialize(container);
    });

    it('should get current scene', () => {
      const scene = gameManager.getCurrentScene();

      expect(scene).toBeDefined();
    });

    it('should get scene by key', () => {
      const scene = gameManager.getScene('test-scene');

      expect(gameManager.getGame()?.scene.getScene).toHaveBeenCalledWith('test-scene');
    });

    it('should start scene', () => {
      gameManager.startScene('game-scene');

      expect(gameManager.getGame()?.scene.start).toHaveBeenCalledWith('game-scene', undefined);
      expect(mockEvents.onSceneChange).toHaveBeenCalledWith('game-scene');
    });

    it('should start scene with data', () => {
      const sceneData = { level: 1, players: 4 };
      gameManager.startScene('game-scene', sceneData);

      expect(gameManager.getGame()?.scene.start).toHaveBeenCalledWith('game-scene', sceneData);
    });

    it('should throw error when starting scene without initialization', () => {
      const uninitializedManager = new GameManager(mockGameState);

      expect(() => {
        uninitializedManager.startScene('test-scene');
      }).toThrow('Game not initialized');
    });

    it('should return null for getCurrentScene when not initialized', () => {
      const uninitializedManager = new GameManager(mockGameState);

      expect(uninitializedManager.getCurrentScene()).toBeNull();
    });

    it('should return null for getScene when not initialized', () => {
      const uninitializedManager = new GameManager(mockGameState);

      expect(uninitializedManager.getScene('test')).toBeNull();
    });
  });

  describe('Game State', () => {
    it('should return game state', () => {
      const state = gameManager.getGameState();

      expect(state).toBe(mockGameState);
      expect(state.sendPosition).toBe(mockGameState.sendPosition);
      expect(state.players).toBe(mockGameState.players);
      expect(state.currentRoom).toBe(mockGameState.currentRoom);
    });

    it('should return game instance', () => {
      expect(gameManager.getGame()).toBeNull();

      const container = document.createElement('div');
      gameManager.initialize(container);

      expect(gameManager.getGame()).not.toBeNull();
    });
  });

  describe('Pause and Resume', () => {
    beforeEach(() => {
      const container = document.createElement('div');
      gameManager.initialize(container);
    });

    it('should pause game', () => {
      gameManager.pause();

      expect(gameManager.getGame()?.scene.pause).toHaveBeenCalled();
    });

    it('should resume game', () => {
      gameManager.resume();

      expect(gameManager.getGame()?.scene.resume).toHaveBeenCalled();
    });

    it('should handle pause when not initialized', () => {
      const uninitializedManager = new GameManager(mockGameState);

      expect(() => uninitializedManager.pause()).not.toThrow();
    });

    it('should handle resume when not initialized', () => {
      const uninitializedManager = new GameManager(mockGameState);

      expect(() => uninitializedManager.resume()).not.toThrow();
    });
  });
});
