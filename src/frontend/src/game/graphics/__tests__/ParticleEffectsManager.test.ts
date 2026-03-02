import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Phaser module completely
vi.mock('phaser', () => ({
  default: {
    Scene: class {},
    GameObjects: {
      Sprite: class {},
    },
  },
}));

import { ParticleEffectsManager } from '../ParticleEffectsManager';

describe('ParticleEffectsManager', () => {
  let mockScene: any;
  let mockEmitter: any;
  let mockParticles: any;
  let mockSprite: any;
  let particleManager: ParticleEffectsManager;

  beforeEach(() => {
    // Mock emitter
    mockEmitter = {
      stop: vi.fn().mockReturnThis(),
      start: vi.fn().mockReturnThis(),
      on: false,
      manager: {
        destroy: vi.fn(),
      },
    };

    // Mock particles
    mockParticles = mockEmitter;

    // Mock sprite
    mockSprite = {
      x: 100,
      y: 200,
    } as any;

    // Mock scene
    mockScene = {
      add: {
        particles: vi.fn().mockReturnValue(mockParticles),
      },
      time: {
        delayedCall: vi.fn(),
      },
    } as any;

    particleManager = new ParticleEffectsManager(mockScene);
  });

  describe('createMovementTrail', () => {
    it('should create a movement trail for a sprite', () => {
      const emitter = particleManager.createMovementTrail('test-trail', mockSprite, 'spark-particle');

      expect(mockScene.add.particles).toHaveBeenCalledWith(
        0,
        0,
        'spark-particle',
        expect.objectContaining({
          follow: mockSprite,
          lifespan: 300,
          quantity: 2,
        })
      );
      expect(emitter).toBe(mockParticles);
      expect(mockEmitter.stop).toHaveBeenCalled();
    });

    it('should store the emitter with the given key', () => {
      particleManager.createMovementTrail('player-trail', mockSprite, 'spark-particle');

      expect(particleManager.isTrailActive('player-trail')).toBe(false);
    });

    it('should create trail with correct particle settings', () => {
      particleManager.createMovementTrail('test-trail', mockSprite, 'test-particle');

      const callArgs = (mockScene.add.particles as any).mock.calls[0][3];
      expect(callArgs).toMatchObject({
        speed: { min: 20, max: 50 },
        angle: { min: 0, max: 360 },
        scale: { start: 1, end: 0 },
        alpha: { start: 0.8, end: 0 },
        lifespan: 300,
        frequency: 50,
        quantity: 2,
        blendMode: 'ADD',
      });
    });
  });

  describe('createBurst', () => {
    it('should create a burst effect at specified position', () => {
      particleManager.createBurst(100, 200, 'star-particle', 15);

      expect(mockScene.add.particles).toHaveBeenCalledWith(
        100,
        200,
        'star-particle',
        expect.objectContaining({
          quantity: 15,
          lifespan: 500,
        })
      );
    });

    it('should use default particle count if not specified', () => {
      particleManager.createBurst(50, 75, 'spark-particle');

      const callArgs = (mockScene.add.particles as any).mock.calls[0][3];
      expect(callArgs.quantity).toBe(10);
    });

    it('should schedule particle cleanup after burst', () => {
      particleManager.createBurst(100, 200, 'star-particle');

      expect(mockScene.time.delayedCall).toHaveBeenCalledWith(600, expect.any(Function));
    });

    it('should destroy particles after delay', () => {
      const mockDestroy = vi.fn();
      mockParticles.destroy = mockDestroy;

      particleManager.createBurst(100, 200, 'star-particle');

      // Get the callback and execute it
      const delayedCallArgs = (mockScene.time.delayedCall as any).mock.calls[0];
      const callback = delayedCallArgs[1];
      callback();

      expect(mockDestroy).toHaveBeenCalled();
    });
  });

  describe('startTrail and stopTrail', () => {
    beforeEach(() => {
      particleManager.createMovementTrail('test-trail', mockSprite, 'spark-particle');
    });

    it('should start a trail by key', () => {
      particleManager.startTrail('test-trail');

      expect(mockEmitter.start).toHaveBeenCalled();
    });

    it('should stop a trail by key', () => {
      particleManager.stopTrail('test-trail');

      expect(mockEmitter.stop).toHaveBeenCalled();
    });

    it('should handle starting non-existent trail gracefully', () => {
      expect(() => particleManager.startTrail('non-existent')).not.toThrow();
    });

    it('should handle stopping non-existent trail gracefully', () => {
      expect(() => particleManager.stopTrail('non-existent')).not.toThrow();
    });
  });

  describe('isTrailActive', () => {
    it('should return false for inactive trail', () => {
      particleManager.createMovementTrail('test-trail', mockSprite, 'spark-particle');
      mockEmitter.on = false;

      expect(particleManager.isTrailActive('test-trail')).toBe(false);
    });

    it('should return true for active trail', () => {
      particleManager.createMovementTrail('test-trail', mockSprite, 'spark-particle');
      mockEmitter.on = true;

      expect(particleManager.isTrailActive('test-trail')).toBe(true);
    });

    it('should return false for non-existent trail', () => {
      expect(particleManager.isTrailActive('non-existent')).toBe(false);
    });
  });

  describe('destroyEmitter', () => {
    it('should destroy an emitter by key', () => {
      particleManager.createMovementTrail('test-trail', mockSprite, 'spark-particle');

      particleManager.destroyEmitter('test-trail');

      expect(mockEmitter.stop).toHaveBeenCalled();
      expect(mockEmitter.manager.destroy).toHaveBeenCalled();
      expect(particleManager.isTrailActive('test-trail')).toBe(false);
    });

    it('should handle destroying non-existent emitter gracefully', () => {
      expect(() => particleManager.destroyEmitter('non-existent')).not.toThrow();
    });

    it('should remove emitter from internal map', () => {
      particleManager.createMovementTrail('test-trail', mockSprite, 'spark-particle');
      particleManager.destroyEmitter('test-trail');

      expect(particleManager.isTrailActive('test-trail')).toBe(false);
    });
  });

  describe('destroyAll', () => {
    it('should destroy all emitters', () => {
      // Create multiple emitters
      const mockEmitter2 = { ...mockEmitter, manager: { destroy: vi.fn() } };
      const mockEmitter3 = { ...mockEmitter, manager: { destroy: vi.fn() } };

      (mockScene.add.particles as any)
        .mockReturnValueOnce(mockEmitter)
        .mockReturnValueOnce(mockEmitter2)
        .mockReturnValueOnce(mockEmitter3);

      particleManager.createMovementTrail('trail1', mockSprite, 'particle1');
      particleManager.createMovementTrail('trail2', mockSprite, 'particle2');
      particleManager.createMovementTrail('trail3', mockSprite, 'particle3');

      particleManager.destroyAll();

      expect(mockEmitter.manager.destroy).toHaveBeenCalled();
      expect(mockEmitter2.manager.destroy).toHaveBeenCalled();
      expect(mockEmitter3.manager.destroy).toHaveBeenCalled();
    });

    it('should clear all emitters from map', () => {
      particleManager.createMovementTrail('trail1', mockSprite, 'particle1');
      particleManager.createMovementTrail('trail2', mockSprite, 'particle2');

      particleManager.destroyAll();

      expect(particleManager.isTrailActive('trail1')).toBe(false);
      expect(particleManager.isTrailActive('trail2')).toBe(false);
    });

    it('should handle empty emitter map gracefully', () => {
      expect(() => particleManager.destroyAll()).not.toThrow();
    });
  });
});
