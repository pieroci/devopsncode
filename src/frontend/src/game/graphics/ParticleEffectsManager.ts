import Phaser from 'phaser';

/**
 * ParticleEffectsManager - Manages particle effects for enhanced visuals
 * Creates and controls particle emitters for movement trails, explosions, etc.
 */
export class ParticleEffectsManager {
  private scene: Phaser.Scene;
  private emitters: Map<string, Phaser.GameObjects.Particles.ParticleEmitter> = new Map();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Creates a movement trail effect for a sprite
   * @param key - Unique identifier for this emitter
   * @param sprite - The sprite to follow
   * @param particleKey - Texture key for particles
   * @returns The created emitter
   */
  createMovementTrail(
    key: string,
    sprite: Phaser.GameObjects.Sprite,
    particleKey: string
  ): Phaser.GameObjects.Particles.ParticleEmitter {
    // Check if we already have an emitter system for this particle type
    let emitterManager = this.scene.add.particles(0, 0, particleKey, {
      speed: { min: 20, max: 50 },
      angle: { min: 0, max: 360 },
      scale: { start: 1, end: 0 },
      alpha: { start: 0.8, end: 0 },
      lifespan: 300,
      frequency: 50,
      quantity: 2,
      blendMode: 'ADD',
      follow: sprite,
    });

    const emitter = emitterManager;
    this.emitters.set(key, emitter);
    emitter.stop();

    return emitter;
  }

  /**
   * Creates a burst effect at a specific position
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param particleKey - Texture key for particles
   * @param count - Number of particles
   */
  createBurst(x: number, y: number, particleKey: string, count: number = 10): void {
    const particles = this.scene.add.particles(x, y, particleKey, {
      speed: { min: 100, max: 200 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.5, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 500,
      quantity: count,
      blendMode: 'ADD',
    });

    // Auto-destroy after particles fade
    this.scene.time.delayedCall(600, () => {
      particles.destroy();
    });
  }

  /**
   * Starts a trail effect
   * @param key - Emitter key
   */
  startTrail(key: string): void {
    const emitter = this.emitters.get(key);
    if (emitter) {
      emitter.start();
    }
  }

  /**
   * Stops a trail effect
   * @param key - Emitter key
   */
  stopTrail(key: string): void {
    const emitter = this.emitters.get(key);
    if (emitter) {
      emitter.stop();
    }
  }

  /**
   * Checks if a trail is currently active
   * @param key - Emitter key
   * @returns Whether the trail is active
   */
  isTrailActive(key: string): boolean {
    const emitter = this.emitters.get(key);
    return emitter ? (emitter.on as any) === true : false;
  }

  /**
   * Destroys an emitter
   * @param key - Emitter key
   */
  destroyEmitter(key: string): void {
    const emitter = this.emitters.get(key);
    if (emitter) {
      emitter.stop();
      // Get the parent particle manager and destroy it
      const parentManager = (emitter as any).manager;
      if (parentManager && typeof parentManager.destroy === 'function') {
        parentManager.destroy();
      }
      this.emitters.delete(key);
    }
  }

  /**
   * Destroys all emitters
   */
  destroyAll(): void {
    this.emitters.forEach((_emitter, key) => {
      this.destroyEmitter(key);
    });
    this.emitters.clear();
  }
}
