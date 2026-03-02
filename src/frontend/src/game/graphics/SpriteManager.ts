import Phaser from 'phaser';

export interface SpriteConfig {
  size: number;
  colors: {
    primary: number;
    secondary: number;
    accent: number;
  };
}

/**
 * SpriteManager - Handles creation and management of game sprites
 * Creates procedurally generated sprites and animations for the game
 */
export class SpriteManager {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Creates an enhanced player sprite with details
   * @param key - Texture key to store the sprite
   * @param config - Configuration for the sprite
   */
  createPlayerSprite(key: string, config: SpriteConfig): void {
    const { size, colors } = config;
    const graphics = this.scene.add.graphics();

    // Draw player body (rounded rectangle)
    graphics.fillStyle(colors.primary, 1);
    graphics.fillRoundedRect(0, 0, size, size, size / 8);

    // Draw visor/windshield (top third)
    graphics.fillStyle(colors.secondary, 0.8);
    graphics.fillRoundedRect(size * 0.15, size * 0.1, size * 0.7, size * 0.3, size / 16);

    // Draw wheels/details
    graphics.fillStyle(colors.accent, 1);
    // Left wheel
    graphics.fillCircle(size * 0.2, size * 0.8, size * 0.12);
    // Right wheel
    graphics.fillCircle(size * 0.8, size * 0.8, size * 0.12);
    // Front indicator
    graphics.fillRect(size * 0.4, 0, size * 0.2, size * 0.05);

    // Generate texture
    graphics.generateTexture(key, size, size);
    graphics.destroy();
  }

  /**
   * Creates a ground tile with grid pattern
   * @param key - Texture key
   * @param size - Tile size
   * @param baseColor - Base color of the tile
   * @param lineColor - Grid line color
   */
  createGroundTile(
    key: string,
    size: number,
    baseColor: number,
    lineColor: number
  ): void {
    const graphics = this.scene.add.graphics();

    // Base color
    graphics.fillStyle(baseColor, 1);
    graphics.fillRect(0, 0, size, size);

    // Grid lines
    graphics.lineStyle(1, lineColor, 0.3);
    // Vertical lines
    for (let i = 0; i <= 4; i++) {
      const x = (size / 4) * i;
      graphics.lineBetween(x, 0, x, size);
    }
    // Horizontal lines
    for (let i = 0; i <= 4; i++) {
      const y = (size / 4) * i;
      graphics.lineBetween(0, y, size, y);
    }

    graphics.generateTexture(key, size, size);
    graphics.destroy();
  }

  /**
   * Creates animated sparkle particles
   * @param key - Particle texture key
   * @param size - Particle size
   * @param color - Particle color
   */
  createParticleTexture(key: string, size: number, color: number): void {
    const graphics = this.scene.add.graphics();
    
    // Create star shape
    graphics.fillStyle(color, 1);
    graphics.beginPath();
    
    const points = 5;
    const outerRadius = size;
    const innerRadius = size * 0.4;
    const angle = Math.PI / points;
    
    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const x = size + radius * Math.cos(i * angle - Math.PI / 2);
      const y = size + radius * Math.sin(i * angle - Math.PI / 2);
      
      if (i === 0) {
        graphics.moveTo(x, y);
      } else {
        graphics.lineTo(x, y);
      }
    }
    
    graphics.closePath();
    graphics.fillPath();
    
    graphics.generateTexture(key, size * 2, size * 2);
    graphics.destroy();
  }

  /**
   * Creates a track tile with racing stripes
   * @param key - Texture key
   * @param size - Tile size
   */
  createTrackTile(key: string, size: number): void {
    const graphics = this.scene.add.graphics();

    // Dark gray track base
    graphics.fillStyle(0x2d3748, 1);
    graphics.fillRect(0, 0, size, size);

    // Racing stripes (yellow dashed lines)
    graphics.lineStyle(2, 0xfbbf24, 1);
    const dashLength = size / 8;
    const gapLength = size / 8;

    for (let y = 0; y < size; y += dashLength + gapLength) {
      graphics.lineBetween(size / 2, y, size / 2, y + dashLength);
    }

    // Side lines (white)
    graphics.lineStyle(3, 0xffffff, 0.8);
    graphics.lineBetween(size * 0.1, 0, size * 0.1, size);
    graphics.lineBetween(size * 0.9, 0, size * 0.9, size);

    // Texture overlay for asphalt effect
    for (let i = 0; i < size * 2; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const shade = Math.random() * 0.2;
      graphics.fillStyle(0x000000, shade);
      graphics.fillRect(x, y, 1, 1);
    }

    graphics.generateTexture(key, size, size);
    graphics.destroy();
  }

  /**
   * Creates all default game sprites
   */
  createDefaultSprites(): void {
    // Local player (primary color - indigo)
    this.createPlayerSprite('player', {
      size: 32,
      colors: {
        primary: 0x4f46e5, // Indigo
        secondary: 0x818cf8, // Light indigo
        accent: 0x1e1b4b, // Dark indigo
      },
    });

    // Remote player (cyan)
    this.createPlayerSprite('remote-player', {
      size: 32,
      colors: {
        primary: 0x06b6d4, // Cyan
        secondary: 0x67e8f9, // Light cyan
        accent: 0x164e63, // Dark cyan
      },
    });

    // Ground tiles
    this.createGroundTile('ground', 64, 0x10b981, 0x059669);
    this.createTrackTile('track', 64);

    // Particles
    this.createParticleTexture('star-particle', 4, 0xfbbf24);
    this.createParticleTexture('spark-particle', 3, 0xffffff);
  }
}
