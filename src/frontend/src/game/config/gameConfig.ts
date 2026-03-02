import Phaser from 'phaser';

export const GAME_CONFIG = {
  // Canvas dimensions
  WIDTH: 800,
  HEIGHT: 600,
  
  // Physics
  GRAVITY: 0,
  
  // Player settings
  PLAYER_SPEED: 200,
  PLAYER_ROTATION_SPEED: 3,
  PLAYER_SIZE: 32,
  
  // Network settings
  POSITION_UPDATE_INTERVAL: 50, // ms
  INTERPOLATION_DELAY: 100, // ms
  
  // Colors
  COLORS: {
    PRIMARY: 0x4f46e5,
    SECONDARY: 0x06b6d4,
    SUCCESS: 0x10b981,
    DANGER: 0xef4444,
    WARNING: 0xf59e0b,
    BACKGROUND: 0x1f2937,
  },
};

export const createPhaserConfig = (parent: string | HTMLElement): Phaser.Types.Core.GameConfig => ({
  type: Phaser.AUTO,
  parent,
  width: GAME_CONFIG.WIDTH,
  height: GAME_CONFIG.HEIGHT,
  backgroundColor: GAME_CONFIG.COLORS.BACKGROUND,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: GAME_CONFIG.GRAVITY },
      debug: import.meta.env.DEV,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [],
});
