import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Phaser module completely
vi.mock('phaser', () => ({
  default: {
    Scene: class {},
  },
}));

import { MenuScene } from '../scenes/MenuScene';

// Mock Phaser text object
const createMockText = () => ({
  setOrigin: vi.fn().mockReturnThis(),
  setInteractive: vi.fn().mockReturnThis(),
  setStyle: vi.fn().mockReturnThis(),
  on: vi.fn(),
});

const mockScene = {
  start: vi.fn(),
};

const mockCameras = {
  main: { width: 800, height: 600 },
};

describe('MenuScene', () => {
  let menuScene: MenuScene;
  let mockStartButton: any;
  let mockTitleText: any;

  beforeEach(() => {
    menuScene = new MenuScene();
    mockStartButton = createMockText();
    mockTitleText = createMockText();

    // Mock scene properties
    (menuScene as any).scene = mockScene;
    (menuScene as any).cameras = mockCameras;
    (menuScene as any).add = {
      rectangle: vi.fn().mockReturnValue({ setOrigin: vi.fn() }),
      text: vi.fn((x, y, text) => {
        if (text === 'Start Game') {
          return mockStartButton;
        }
        if (text === 'Racing Game') {
          return mockTitleText;
        }
        return createMockText();
      }),
    };

    vi.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should create MenuScene with correct key', () => {
      expect(menuScene).toBeInstanceOf(MenuScene);
    });
  });

  describe('create', () => {
    it('should create background', () => {
      menuScene.create();

      expect((menuScene as any).add.rectangle).toHaveBeenCalledWith(
        0,
        0,
        800,
        600,
        expect.any(Number)
      );
    });

    it('should create title text', () => {
      menuScene.create();

      expect((menuScene as any).add.text).toHaveBeenCalledWith(
        400,
        200,
        'Racing Game',
        expect.any(Object)
      );
      expect(mockTitleText.setOrigin).toHaveBeenCalledWith(0.5);
    });

    it('should create subtitle', () => {
      menuScene.create();

      expect((menuScene as any).add.text).toHaveBeenCalledWith(
        400,
        260,
        'Multiplayer Edition',
        expect.any(Object)
      );
    });

    it('should create start button', () => {
      menuScene.create();

      expect((menuScene as any).add.text).toHaveBeenCalledWith(
        400,
        350,
        'Start Game',
        expect.any(Object)
      );
      expect(mockStartButton.setOrigin).toHaveBeenCalledWith(0.5);
      expect(mockStartButton.setInteractive).toHaveBeenCalledWith({ useHandCursor: true });
    });

    it('should setup button hover handlers', () => {
      menuScene.create();

      expect(mockStartButton.on).toHaveBeenCalledWith('pointerover', expect.any(Function));
      expect(mockStartButton.on).toHaveBeenCalledWith('pointerout', expect.any(Function));
      expect(mockStartButton.on).toHaveBeenCalledWith('pointerdown', expect.any(Function));
    });

    it('should create instructions text', () => {
      menuScene.create();

      expect((menuScene as any).add.text).toHaveBeenCalledWith(
        400,
        500,
        expect.stringContaining('WASD'),
        expect.any(Object)
      );
    });
  });

  describe('Button Interactions', () => {
    beforeEach(() => {
      menuScene.create();
    });

    it('should change button style on hover', () => {
      const hoverCallback = mockStartButton.on.mock.calls.find(
        (call: any) => call[0] === 'pointerover'
      )?.[1];

      if (hoverCallback) {
        hoverCallback();
        expect(mockStartButton.setStyle).toHaveBeenCalledWith({
          backgroundColor: '#6366f1',
        });
      }
    });

    it('should reset button style on hover out', () => {
      const hoverOutCallback = mockStartButton.on.mock.calls.find(
        (call: any) => call[0] === 'pointerout'
      )?.[1];

      if (hoverOutCallback) {
        hoverOutCallback();
        expect(mockStartButton.setStyle).toHaveBeenCalledWith({
          backgroundColor: '#4f46e5',
        });
      }
    });

    it('should start game on button click', () => {
      const clickCallback = mockStartButton.on.mock.calls.find(
        (call: any) => call[0] === 'pointerdown'
      )?.[1];

      if (clickCallback) {
        clickCallback();
        expect(mockScene.start).toHaveBeenCalledWith('GameScene');
      }
    });
  });

  describe('triggerStart', () => {
    it('should start GameScene when called', () => {
      (menuScene as any).scene = mockScene;
      
      menuScene.triggerStart();

      expect(mockScene.start).toHaveBeenCalledWith('GameScene');
    });
  });
});
