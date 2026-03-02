import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Phaser module completely
vi.mock('phaser', () => ({
  default: {
    Scene: class {},
  },
}));

import { SpriteManager } from '../SpriteManager';

describe('SpriteManager', () => {
  let mockScene: any;
  let mockGraphics: any;
  let spriteManager: SpriteManager;

  beforeEach(() => {
    // Mock graphics object
    mockGraphics = {
      fillStyle: vi.fn().mockReturnThis(),
      fillRect: vi.fn().mockReturnThis(),
      fillRoundedRect: vi.fn().mockReturnThis(),
      fillCircle: vi.fn().mockReturnThis(),
      lineStyle: vi.fn().mockReturnThis(),
      lineBetween: vi.fn().mockReturnThis(),
      beginPath: vi.fn().mockReturnThis(),
      moveTo: vi.fn().mockReturnThis(),
      lineTo: vi.fn().mockReturnThis(),
      closePath: vi.fn().mockReturnThis(),
      fillPath: vi.fn().mockReturnThis(),
      generateTexture: vi.fn(),
      destroy: vi.fn(),
    };

    // Mock scene
    mockScene = {
      add: {
        graphics: vi.fn().mockReturnValue(mockGraphics),
      },
    } as any;

    spriteManager = new SpriteManager(mockScene);
  });

  describe('createPlayerSprite', () => {
    it('should create a player sprite with correct configuration', () => {
      const config = {
        size: 32,
        colors: {
          primary: 0x4f46e5,
          secondary: 0x818cf8,
          accent: 0x1e1b4b,
        },
      };

      spriteManager.createPlayerSprite('test-player', config);

      // Verify graphics methods were called
      expect(mockGraphics.fillStyle).toHaveBeenCalled();
      expect(mockGraphics.fillRoundedRect).toHaveBeenCalled();
      expect(mockGraphics.fillCircle).toHaveBeenCalled();
      expect(mockGraphics.fillRect).toHaveBeenCalled();
      expect(mockGraphics.generateTexture).toHaveBeenCalledWith('test-player', 32, 32);
      expect(mockGraphics.destroy).toHaveBeenCalled();
    });

    it('should create sprite with custom size', () => {
      const config = {
        size: 64,
        colors: {
          primary: 0xff0000,
          secondary: 0x00ff00,
          accent: 0x0000ff,
        },
      };

      spriteManager.createPlayerSprite('large-player', config);

      expect(mockGraphics.generateTexture).toHaveBeenCalledWith('large-player', 64, 64);
    });
  });

  describe('createGroundTile', () => {
    it('should create a ground tile with grid pattern', () => {
      spriteManager.createGroundTile('test-ground', 64, 0x10b981, 0x059669);

      // Verify base color fill
      expect(mockGraphics.fillStyle).toHaveBeenCalledWith(0x10b981, 1);
      expect(mockGraphics.fillRect).toHaveBeenCalledWith(0, 0, 64, 64);

      // Verify grid lines
      expect(mockGraphics.lineStyle).toHaveBeenCalledWith(1, 0x059669, 0.3);
      expect(mockGraphics.lineBetween).toHaveBeenCalled();

      expect(mockGraphics.generateTexture).toHaveBeenCalledWith('test-ground', 64, 64);
      expect(mockGraphics.destroy).toHaveBeenCalled();
    });

    it('should create grid with correct number of lines', () => {
      spriteManager.createGroundTile('test-ground', 64, 0x10b981, 0x059669);

      // Should have 5 vertical and 5 horizontal lines (0 to 4 inclusive)
      const lineBetweenCalls = mockGraphics.lineBetween.mock.calls;
      expect(lineBetweenCalls.length).toBe(10); // 5 vertical + 5 horizontal
    });
  });

  describe('createParticleTexture', () => {
    it('should create a star-shaped particle texture', () => {
      spriteManager.createParticleTexture('test-particle', 4, 0xfbbf24);

      expect(mockGraphics.fillStyle).toHaveBeenCalledWith(0xfbbf24, 1);
      expect(mockGraphics.beginPath).toHaveBeenCalled();
      expect(mockGraphics.moveTo).toHaveBeenCalled();
      expect(mockGraphics.lineTo).toHaveBeenCalled();
      expect(mockGraphics.closePath).toHaveBeenCalled();
      expect(mockGraphics.fillPath).toHaveBeenCalled();
      
      // Size * 2 for star points
      expect(mockGraphics.generateTexture).toHaveBeenCalledWith('test-particle', 8, 8);
      expect(mockGraphics.destroy).toHaveBeenCalled();
    });

    it('should create particle with custom color', () => {
      spriteManager.createParticleTexture('white-particle', 3, 0xffffff);

      expect(mockGraphics.fillStyle).toHaveBeenCalledWith(0xffffff, 1);
      expect(mockGraphics.generateTexture).toHaveBeenCalledWith('white-particle', 6, 6);
    });
  });

  describe('createTrackTile', () => {
    it('should create a track tile with racing stripes', () => {
      spriteManager.createTrackTile('test-track', 64);

      // Verify track base
      expect(mockGraphics.fillStyle).toHaveBeenCalledWith(0x2d3748, 1);
      expect(mockGraphics.fillRect).toHaveBeenCalledWith(0, 0, 64, 64);

      // Verify racing stripes
      expect(mockGraphics.lineStyle).toHaveBeenCalledWith(2, 0xfbbf24, 1);

      // Verify side lines
      expect(mockGraphics.lineStyle).toHaveBeenCalledWith(3, 0xffffff, 0.8);

      expect(mockGraphics.generateTexture).toHaveBeenCalledWith('test-track', 64, 64);
      expect(mockGraphics.destroy).toHaveBeenCalled();
    });
  });

  describe('createDefaultSprites', () => {
    it('should create all default game sprites', () => {
      spriteManager.createDefaultSprites();

      // Should create player, remote-player, ground, track, and two particle types
      expect(mockGraphics.generateTexture).toHaveBeenCalledWith('player', 32, 32);
      expect(mockGraphics.generateTexture).toHaveBeenCalledWith('remote-player', 32, 32);
      expect(mockGraphics.generateTexture).toHaveBeenCalledWith('ground', 64, 64);
      expect(mockGraphics.generateTexture).toHaveBeenCalledWith('track', 64, 64);
      expect(mockGraphics.generateTexture).toHaveBeenCalledWith('star-particle', 8, 8);
      expect(mockGraphics.generateTexture).toHaveBeenCalledWith('spark-particle', 6, 6);
    });

    it('should destroy graphics after each sprite creation', () => {
      spriteManager.createDefaultSprites();

      // Should destroy graphics 6 times (one for each sprite)
      expect(mockGraphics.destroy).toHaveBeenCalledTimes(6);
    });
  });
});
