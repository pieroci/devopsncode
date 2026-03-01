import { vi } from 'vitest';

/**
 * Mock Phaser Game instance
 */
export const createMockPhaserGame = () => ({
  scene: {
    add: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    sleep: vi.fn(),
    wake: vi.fn(),
    switch: vi.fn(),
    getScene: vi.fn(),
    isActive: vi.fn().mockReturnValue(true),
    isPaused: vi.fn().mockReturnValue(false),
    isVisible: vi.fn().mockReturnValue(true),
  },
  canvas: document.createElement('canvas'),
  destroy: vi.fn(),
  config: {
    width: 1280,
    height: 720,
  },
  events: {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  },
});

/**
 * Mock Phaser Scene
 */
export const createMockPhaserScene = () => ({
  add: {
    sprite: vi.fn(),
    image: vi.fn(),
    text: vi.fn(),
    graphics: vi.fn(),
    container: vi.fn(),
  },
  physics: {
    add: {
      sprite: vi.fn(),
      group: vi.fn(),
    },
    world: {
      setBounds: vi.fn(),
    },
  },
  cameras: {
    main: {
      startFollow: vi.fn(),
      setBounds: vi.fn(),
      setZoom: vi.fn(),
    },
  },
  input: {
    keyboard: {
      createCursorKeys: vi.fn().mockReturnValue({
        up: { isDown: false },
        down: { isDown: false },
        left: { isDown: false },
        right: { isDown: false },
      }),
      addKey: vi.fn(),
    },
    on: vi.fn(),
  },
  load: {
    image: vi.fn(),
    spritesheet: vi.fn(),
    audio: vi.fn(),
    json: vi.fn(),
  },
  scene: {
    start: vi.fn(),
    stop: vi.fn(),
    launch: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
  },
  events: {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  },
  time: {
    addEvent: vi.fn(),
    delayedCall: vi.fn(),
  },
});

/**
 * Mock Phaser Sprite
 */
export const createMockPhaserSprite = () => ({
  x: 0,
  y: 0,
  rotation: 0,
  setVelocity: vi.fn(),
  setPosition: vi.fn(),
  setRotation: vi.fn(),
  setTexture: vi.fn(),
  play: vi.fn(),
  destroy: vi.fn(),
  body: {
    velocity: { x: 0, y: 0 },
    setCollideWorldBounds: vi.fn(),
  },
});

// Mock Phaser module
vi.mock('phaser', () => ({
  default: {
    Game: vi.fn().mockImplementation(() => createMockPhaserGame()),
    Scene: vi.fn(),
    AUTO: 'AUTO',
    Scale: {
      FIT: 'FIT',
      CENTER_BOTH: 'CENTER_BOTH',
    },
  },
  Game: vi.fn().mockImplementation(() => createMockPhaserGame()),
  Scene: vi.fn(),
  AUTO: 'AUTO',
}));
