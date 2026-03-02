import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Phaser module completely
vi.mock('phaser', () => ({
  default: {
    Scene: class {},
  },
}));

import { BootScene } from '../scenes/BootScene';

// Mock Phaser objects
const mockScene = {
  start: vi.fn(),
};

const mockGraphics = {
  fillStyle: vi.fn().mockReturnThis(),
  fillRect: vi.fn().mockReturnThis(),
  fillRoundedRect: vi.fn().mockReturnThis(), // Added for new SpriteManager
  fillCircle: vi.fn().mockReturnThis(), // Added for new SpriteManager
  lineStyle: vi.fn().mockReturnThis(), // Added for new SpriteManager
  lineBetween: vi.fn().mockReturnThis(), // Added for new SpriteManager
  beginPath: vi.fn().mockReturnThis(), // Added for particle textures
  moveTo: vi.fn().mockReturnThis(), // Added for particle textures
  lineTo: vi.fn().mockReturnThis(), // Added for particle textures
  closePath: vi.fn().mockReturnThis(), // Added for particle textures
  fillPath: vi.fn().mockReturnThis(), // Added for particle textures
  generateTexture: vi.fn(),
  destroy: vi.fn(),
};

const mockText = {
  setOrigin: vi.fn().mockReturnThis(),
  setText: vi.fn(),
  destroy: vi.fn(),
};

const mockLoad = {
  on: vi.fn(),
};

const mockCameras = {
  main: { width: 800, height: 600 },
};

describe('BootScene', () => {
  let bootScene: BootScene;

  beforeEach(() => {
    bootScene = new BootScene();
    
    // Mock scene properties
    (bootScene as any).scene = mockScene;
    (bootScene as any).add = {
      graphics: vi.fn().mockReturnValue(mockGraphics),
      text: vi.fn().mockReturnValue(mockText),
    };
    (bootScene as any).make = {
      text: vi.fn().mockReturnValue(mockText),
    };
    (bootScene as any).load = mockLoad;
    (bootScene as any).cameras = mockCameras;

    vi.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should create BootScene with correct key', () => {
      expect(bootScene).toBeInstanceOf(BootScene);
    });
  });

  describe('preload', () => {
    it('should call loadAssets and createLoadingBar', () => {
      const loadAssetsSpy = vi.spyOn(bootScene as any, 'loadAssets');
      const createLoadingBarSpy = vi.spyOn(bootScene as any, 'createLoadingBar');

      bootScene.preload();

      expect(loadAssetsSpy).toHaveBeenCalled();
      expect(createLoadingBarSpy).toHaveBeenCalled();
    });

    it('should create player texture', () => {
      bootScene.preload();

      expect((bootScene as any).add.graphics).toHaveBeenCalled();
      expect(mockGraphics.generateTexture).toHaveBeenCalledWith('player', 32, 32);
      expect(mockGraphics.destroy).toHaveBeenCalled();
    });

    it('should create remote player texture', () => {
      bootScene.preload();

      expect(mockGraphics.generateTexture).toHaveBeenCalledWith('remote-player', 32, 32);
    });

    it('should create ground texture', () => {
      bootScene.preload();

      expect(mockGraphics.generateTexture).toHaveBeenCalledWith('ground', 64, 64);
    });

    it('should setup loading progress handler', () => {
      bootScene.preload();

      expect(mockLoad.on).toHaveBeenCalledWith('progress', expect.any(Function));
      expect(mockLoad.on).toHaveBeenCalledWith('complete', expect.any(Function));
    });
  });

  describe('create', () => {
    it('should start MenuScene', () => {
      bootScene.create();

      expect(mockScene.start).toHaveBeenCalledWith('MenuScene');
    });
  });

  describe('Loading Bar', () => {
    it('should create loading text elements', () => {
      bootScene.preload();

      expect((bootScene as any).make.text).toHaveBeenCalled();
    });

    it('should update progress text', () => {
      // Add clear method to mockGraphics
      mockGraphics.clear = vi.fn();
      
      bootScene.preload();

      // Get the progress callback
      const progressCallback = mockLoad.on.mock.calls.find(
        (call) => call[0] === 'progress'
      )?.[1];

      if (progressCallback) {
        progressCallback(0.5);
        expect(mockText.setText).toHaveBeenCalledWith('50%');
      }
    });

    it('should cleanup after loading completes', () => {
      bootScene.preload();

      // Get the complete callback
      const completeCallback = mockLoad.on.mock.calls.find(
        (call) => call[0] === 'complete'
      )?.[1];

      if (completeCallback) {
        completeCallback();
        expect(mockGraphics.destroy).toHaveBeenCalled();
      }
    });
  });
});
