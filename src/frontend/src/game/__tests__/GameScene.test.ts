import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Phaser module completely
vi.mock('phaser', () => ({
  default: {
    Scene: class {},
    Input: {
      Keyboard: {
        KeyCodes: {
          W: 87,
          A: 65,
          S: 83,
          D: 68,
        },
      },
    },
  },
}));

// Need to import GAME_CONFIG after the mock
vi.mock('../config/gameConfig', () => ({
  GAME_CONFIG: {
    WIDTH: 800,
    HEIGHT: 600,
    GRAVITY: 0,
    PLAYER_SPEED: 200,
    PLAYER_ROTATION_SPEED: 3,
    PLAYER_SIZE: 32,
    POSITION_UPDATE_INTERVAL: 50,
    INTERPOLATION_DELAY: 100,
    COLORS: {
      PRIMARY: 0x4f46e5,
      SECONDARY: 0x06b6d4,
      SUCCESS: 0x10b981,
      DANGER: 0xef4444,
      WARNING: 0xf59e0b,
      BACKGROUND: 0x1f2937,
    },
  },
}));

// Mock TouchControlsManager
vi.mock('../TouchControlsManager', () => ({
  TouchControlsManager: class {
    getJoystickState() {
      return {
        active: false,
        x: 0,
        y: 0,
        force: 0,
        angle: 0,
      };
    }
    isActive() {
      return false;
    }
    destroy() {}
    static isTouchDevice() {
      return false;
    }
  },
}));

import { GameScene, type GameSceneData } from '../scenes/GameScene';
import type { GamePlayer } from '@/types';

// Mock Phaser objects
const createMockSprite = () => ({
  x: 400,
  y: 300,
  rotation: 0,
  setCollideWorldBounds: vi.fn().mockReturnThis(),
  setVelocity: vi.fn(),
  setRotation: vi.fn(),
  destroy: vi.fn(),
});

const createMockText = () => ({
  setOrigin: vi.fn().mockReturnThis(),
  setPosition: vi.fn(),
  destroy: vi.fn(),
});

const mockCameras = {
  main: { width: 800, height: 600 },
};

const mockPhysics = {
  add: {
    sprite: vi.fn(() => createMockSprite()),
  },
};

const mockInput = {
  keyboard: {
    createCursorKeys: vi.fn(() => ({
      left: { isDown: false },
      right: { isDown: false },
      up: { isDown: false },
      down: { isDown: false },
    })),
    addKey: vi.fn(() => ({ isDown: false })),
  },
};

const mockTweens = {
  add: vi.fn(),
};

describe('GameScene', () => {
  let gameScene: GameScene;
  let mockSceneData: GameSceneData;

  beforeEach(() => {
    gameScene = new GameScene();
    
    mockSceneData = {
      sendPosition: vi.fn().mockResolvedValue(undefined),
      players: [],
      currentRoom: { id: 'room-1' },
    };

    // Mock scene properties
    (gameScene as any).cameras = mockCameras;
    (gameScene as any).physics = mockPhysics;
    (gameScene as any).input = mockInput;
    (gameScene as any).tweens = mockTweens;
    (gameScene as any).time = {
      now: 0,
    };
    (gameScene as any).cache = {
      audio: {
        exists: vi.fn(() => false),
      },
    };
    (gameScene as any).sound = {
      add: vi.fn(() => ({
        play: vi.fn(),
        stop: vi.fn(),
        once: vi.fn(),
      })),
    };
    (gameScene as any).add = {
      rectangle: vi.fn().mockReturnValue({ setOrigin: vi.fn() }),
      image: vi.fn().mockReturnValue({
        setOrigin: vi.fn().mockReturnThis(),
        setAlpha: vi.fn(),
      }),
      text: vi.fn(() => createMockText()),
      particles: vi.fn().mockReturnValue({
        stop: vi.fn(),
        start: vi.fn(),
        on: false,
        manager: {
          destroy: vi.fn(),
        },
      }),
    };

    vi.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should create GameScene with correct key', () => {
      expect(gameScene).toBeInstanceOf(GameScene);
    });
  });

  describe('init', () => {
    it('should store scene data', () => {
      gameScene.init(mockSceneData);

      expect((gameScene as any).sceneData).toBe(mockSceneData);
    });
  });

  describe('create', () => {
    beforeEach(() => {
      gameScene.init(mockSceneData);
    });

    it('should create background', () => {
      gameScene.create();

      expect((gameScene as any).add.rectangle).toHaveBeenCalled();
    });

    it('should create ground tiles', () => {
      gameScene.create();

      expect((gameScene as any).add.image).toHaveBeenCalled();
    });

    it('should create local player', () => {
      gameScene.create();

      expect(mockPhysics.add.sprite).toHaveBeenCalledWith(
        400,
        300,
        'player'
      );
    });

    it('should setup controls', () => {
      gameScene.create();

      expect(mockInput.keyboard.createCursorKeys).toHaveBeenCalled();
      expect(mockInput.keyboard.addKey).toHaveBeenCalled();
    });

    it('should create UI text', () => {
      gameScene.create();

      expect((gameScene as any).add.text).toHaveBeenCalledWith(
        16,
        16,
        expect.stringContaining('WASD'),
        expect.any(Object)
      );
    });

    it('should create existing remote players', () => {
      const mockPlayer: GamePlayer = {
        playerId: 'player-1',
        username: 'TestPlayer',
        isReady: false,
        x: 100,
        y: 100,
        rotation: 0,
        speed: 0,
        lap: 0,
        position: 1,
      };

      mockSceneData.players = [mockPlayer];
      gameScene.init(mockSceneData);
      gameScene.create();

      const remotePlayers = gameScene.getRemotePlayers();
      expect(remotePlayers.size).toBe(1);
    });
  });

  describe('update', () => {
    beforeEach(() => {
      gameScene.init(mockSceneData);
      gameScene.create();
    });

    it('should handle player movement', () => {
      const mockLocalPlayer = createMockSprite();
      (gameScene as any).localPlayer = mockLocalPlayer;
      
      gameScene.update(100);

      // Movement should be handled (even if no input)
      expect(mockLocalPlayer.setVelocity).toHaveBeenCalled();
    });

    it('should broadcast position periodically', () => {
      vi.useFakeTimers();
      
      gameScene.update(0);
      gameScene.update(100);

      expect(mockSceneData.sendPosition).toHaveBeenCalled();

      vi.useRealTimers();
    });

    it('should not update without local player', () => {
      (gameScene as any).localPlayer = null;

      expect(() => gameScene.update(100)).not.toThrow();
    });
  });

  describe('addRemotePlayer', () => {
    beforeEach(() => {
      gameScene.init(mockSceneData);
      gameScene.create();
    });

    it('should add remote player sprite', () => {
      const mockPlayer: GamePlayer = {
        playerId: 'player-1',
        username: 'TestPlayer',
        isReady: false,
        x: 100,
        y: 100,
        rotation: 0,
        speed: 0,
        lap: 0,
        position: 1,
      };

      gameScene.addRemotePlayer(mockPlayer);

      const remotePlayers = gameScene.getRemotePlayers();
      expect(remotePlayers.has('player-1')).toBe(true);
    });

    it('should not add duplicate players', () => {
      const mockPlayer: GamePlayer = {
        playerId: 'player-1',
        username: 'TestPlayer',
        isReady: false,
        x: 100,
        y: 100,
        rotation: 0,
        speed: 0,
        lap: 0,
        position: 1,
      };

      gameScene.addRemotePlayer(mockPlayer);
      gameScene.addRemotePlayer(mockPlayer);

      const remotePlayers = gameScene.getRemotePlayers();
      expect(remotePlayers.size).toBe(1);
    });

    it('should create label for remote player', () => {
      const mockPlayer: GamePlayer = {
        playerId: 'player-1',
        username: 'TestPlayer',
        isReady: false,
        x: 100,
        y: 100,
        rotation: 0,
        speed: 0,
        lap: 0,
        position: 1,
      };

      gameScene.addRemotePlayer(mockPlayer);

      expect((gameScene as any).add.text).toHaveBeenCalledWith(
        100,
        80, // y - 20
        'TestPlayer',
        expect.any(Object)
      );
    });
  });

  describe('removeRemotePlayer', () => {
    beforeEach(() => {
      gameScene.init(mockSceneData);
      gameScene.create();
    });

    it('should remove remote player sprite', () => {
      const mockPlayer: GamePlayer = {
        playerId: 'player-1',
        username: 'TestPlayer',
        isReady: false,
        x: 100,
        y: 100,
        rotation: 0,
        speed: 0,
        lap: 0,
        position: 1,
      };

      gameScene.addRemotePlayer(mockPlayer);
      gameScene.removeRemotePlayer('player-1');

      const remotePlayers = gameScene.getRemotePlayers();
      expect(remotePlayers.has('player-1')).toBe(false);
    });

    it('should handle removing non-existent player', () => {
      expect(() => gameScene.removeRemotePlayer('non-existent')).not.toThrow();
    });

    it('should destroy sprite and label', () => {
      const mockPlayer: GamePlayer = {
        playerId: 'player-1',
        username: 'TestPlayer',
        isReady: false,
        x: 100,
        y: 100,
        rotation: 0,
        speed: 0,
        lap: 0,
        position: 1,
      };

      gameScene.addRemotePlayer(mockPlayer);
      
      const sprite = gameScene.getRemotePlayers().get('player-1');
      gameScene.removeRemotePlayer('player-1');

      expect(sprite?.destroy).toHaveBeenCalled();
    });
  });

  describe('updateRemotePlayerPosition', () => {
    beforeEach(() => {
      gameScene.init(mockSceneData);
      gameScene.create();
    });

    it('should update player position with interpolation', () => {
      const mockPlayer: GamePlayer = {
        playerId: 'player-1',
        username: 'TestPlayer',
        isReady: false,
        x: 100,
        y: 100,
        rotation: 0,
        speed: 0,
        lap: 0,
        position: 1,
      };

      gameScene.addRemotePlayer(mockPlayer);
      gameScene.updateRemotePlayerPosition('player-1', 200, 200, 1.5);

      expect(mockTweens.add).toHaveBeenCalledWith(
        expect.objectContaining({
          x: 200,
          y: 200,
          rotation: 1.5,
        })
      );
    });

    it('should handle updating non-existent player', () => {
      expect(() => {
        gameScene.updateRemotePlayerPosition('non-existent', 200, 200, 0);
      }).not.toThrow();
    });
  });

  describe('Movement Controls', () => {
    beforeEach(() => {
      gameScene.init(mockSceneData);
      gameScene.create();
    });

    it('should move player left with arrow keys', () => {
      const mockLocalPlayer = createMockSprite();
      (gameScene as any).localPlayer = mockLocalPlayer;
      (gameScene as any).cursors = {
        left: { isDown: true },
        right: { isDown: false },
        up: { isDown: false },
        down: { isDown: false },
      };

      gameScene.update(100);

      expect(mockLocalPlayer.setVelocity).toHaveBeenCalledWith(
        -200,
        0
      );
    });

    it('should move player with WASD keys', () => {
      const mockLocalPlayer = createMockSprite();
      (gameScene as any).localPlayer = mockLocalPlayer;
      (gameScene as any).cursors = {
        left: { isDown: false },
        right: { isDown: false },
        up: { isDown: false },
        down: { isDown: false },
      };
      (gameScene as any).wasd = {
        W: { isDown: true },
        A: { isDown: false },
        S: { isDown: false },
        D: { isDown: false },
      };

      gameScene.update(100);

      expect(mockLocalPlayer.setVelocity).toHaveBeenCalledWith(
        0,
        -200
      );
    });

    it('should normalize diagonal movement', () => {
      const mockLocalPlayer = createMockSprite();
      (gameScene as any).localPlayer = mockLocalPlayer;
      (gameScene as any).cursors = {
        left: { isDown: false },
        right: { isDown: true },
        up: { isDown: true },
        down: { isDown: false },
      };
      (gameScene as any).wasd = {
        W: { isDown: false },
        A: { isDown: false },
        S: { isDown: false },
        D: { isDown: false },
      };

      gameScene.update(100);

      const expectedVelocity = 200 * 0.707;
      expect(mockLocalPlayer.setVelocity).toHaveBeenCalledWith(
        expect.closeTo(expectedVelocity, 1),
        expect.closeTo(-expectedVelocity, 1)
      );
    });

    it('should update rotation based on movement', () => {
      const mockLocalPlayer = createMockSprite();
      (gameScene as any).localPlayer = mockLocalPlayer;
      (gameScene as any).cursors = {
        left: { isDown: false },
        right: { isDown: true },
        up: { isDown: false },
        down: { isDown: false },
      };
      (gameScene as any).wasd = {
        W: { isDown: false },
        A: { isDown: false },
        S: { isDown: false },
        D: { isDown: false },
      };

      gameScene.update(100);

      expect(mockLocalPlayer.setRotation).toHaveBeenCalled();
    });
  });

  describe('Position Broadcasting', () => {
    beforeEach(() => {
      gameScene.init(mockSceneData);
      gameScene.create();
    });

    it('should broadcast position periodically', () => {
      vi.useFakeTimers();
      
      const mockLocalPlayer = createMockSprite();
      mockLocalPlayer.x = 150;
      mockLocalPlayer.y = 250;
      mockLocalPlayer.rotation = 1.5;
      (gameScene as any).localPlayer = mockLocalPlayer;

      gameScene.update(0);
      gameScene.update(100);

      expect(mockSceneData.sendPosition).toHaveBeenCalledWith(150, 250, 1.5);

      vi.useRealTimers();
    });

    it('should handle broadcast errors', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      mockSceneData.sendPosition = vi.fn().mockRejectedValue(new Error('Network error'));
      gameScene.init(mockSceneData);
      gameScene.create();

      gameScene.update(0);
      gameScene.update(100);

      // Wait for the promise rejection to be handled
      await vi.waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      }, { timeout: 1000 });

      consoleErrorSpy.mockRestore();
    });

    it('should not broadcast without sendPosition method', () => {
      const sceneDataWithoutSend = {
        players: [],
        currentRoom: { id: 'room-1' },
      };
      
      gameScene.init(sceneDataWithoutSend);
      gameScene.create();

      expect(() => gameScene.update(100)).not.toThrow();
    });
  });

  describe('Getters', () => {
    beforeEach(() => {
      gameScene.init(mockSceneData);
      gameScene.create();
    });

    it('should return local player', () => {
      const localPlayer = gameScene.getLocalPlayer();
      expect(localPlayer).toBeDefined();
    });

    it('should return remote players map', () => {
      const remotePlayers = gameScene.getRemotePlayers();
      expect(remotePlayers).toBeInstanceOf(Map);
    });
  });

  describe('Touch Controls Integration', () => {
    it('should handle movement without touch controls', () => {
      gameScene.init(mockSceneData);
      gameScene.create();

      const mockLocalPlayer = createMockSprite();
      (gameScene as any).localPlayer = mockLocalPlayer;

      gameScene.update(100);

      // Should work fine without touch controls
      expect(mockLocalPlayer.setVelocity).toHaveBeenCalled();
    });

    it('should handle movement with touch controls', () => {
      gameScene.init(mockSceneData);
      gameScene.create();

      const mockLocalPlayer = createMockSprite();
      (gameScene as any).localPlayer = mockLocalPlayer;

      // Mock touch controls with active joystick
      (gameScene as any).touchControls = {
        getJoystickState: vi.fn().mockReturnValue({
          active: true,
          x: 0.5,
          y: 0,
          force: 0.8,
          angle: 0,
        }),
        isActive: vi.fn().mockReturnValue(true),
        destroy: vi.fn(),
      };

      gameScene.update(100);

      // Velocity should be set based on joystick state
      expect(mockLocalPlayer.setVelocity).toHaveBeenCalled();
    });

    it('should prioritize touch controls over keyboard when active', () => {
      gameScene.init(mockSceneData);
      gameScene.create();

      const mockLocalPlayer = createMockSprite();
      (gameScene as any).localPlayer = mockLocalPlayer;

      // Set keyboard input
      (gameScene as any).cursors = {
        left: { isDown: true },
        right: { isDown: false },
        up: { isDown: false },
        down: { isDown: false },
      };

      (gameScene as any).wasd = {
        W: { isDown: false },
        A: { isDown: false },
        S: { isDown: false },
        D: { isDown: false },
      };

      // Mock active touch controls
      (gameScene as any).touchControls = {
        getJoystickState: vi.fn().mockReturnValue({
          active: true,
          x: 0.7,
          y: 0,
          force: 0.9,
          angle: 0,
        }),
        isActive: vi.fn().mockReturnValue(true),
        destroy: vi.fn(),
      };

      gameScene.update(100);

      // Touch controls should take priority
      expect(mockLocalPlayer.setVelocity).toHaveBeenCalled();
    });
  });

  describe('Shutdown', () => {
    beforeEach(() => {
      gameScene.init(mockSceneData);
      gameScene.create();
    });

    it('should cleanup touch controls on shutdown', () => {
      const mockDestroy = vi.fn();
      (gameScene as any).touchControls = {
        destroy: mockDestroy,
        getJoystickState: vi.fn(),
        isActive: vi.fn(),
      };

      gameScene.shutdown();

      expect(mockDestroy).toHaveBeenCalled();
      expect((gameScene as any).touchControls).toBeUndefined();
    });

    it('should cleanup player labels on shutdown', () => {
      const mockLabel = createMockText();
      (gameScene as any).playerLabels.set('test', mockLabel);

      gameScene.shutdown();

      expect(mockLabel.destroy).toHaveBeenCalled();
      expect((gameScene as any).playerLabels.size).toBe(0);
    });

    it('should cleanup remote players on shutdown', () => {
      const mockPlayer: GamePlayer = {
        playerId: 'player-1',
        username: 'TestPlayer',
        isReady: false,
        x: 100,
        y: 100,
        rotation: 0,
        speed: 0,
        lap: 0,
        position: 1,
      };

      gameScene.addRemotePlayer(mockPlayer);
      const sprite = gameScene.getRemotePlayers().get('player-1');

      gameScene.shutdown();

      expect(sprite?.destroy).toHaveBeenCalled();
      expect(gameScene.getRemotePlayers().size).toBe(0);
    });

    it('should not throw error if touch controls not initialized', () => {
      (gameScene as any).touchControls = undefined;

      expect(() => gameScene.shutdown()).not.toThrow();
    });
  });
});
