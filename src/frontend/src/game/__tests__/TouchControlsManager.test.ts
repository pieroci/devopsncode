import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock Phaser module completely
vi.mock('phaser', () => ({
  default: {
    Scene: class {},
    Math: {
      Distance: {
        Between: (x1: number, y1: number, x2: number, y2: number) => {
          return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        },
      },
    },
  },
}));

import { TouchControlsManager } from '../TouchControlsManager';

// Mock Phaser classes
class MockGraphics {
  public depth = 0;
  public alpha = 1;
  public visible = true;

  setDepth(depth: number) {
    this.depth = depth;
    return this;
  }

  setAlpha(alpha: number) {
    this.alpha = alpha;
    return this;
  }

  setVisible(visible: boolean) {
    this.visible = visible;
    return this;
  }

  clear() {
    return this;
  }

  lineStyle() {
    return this;
  }

  fillStyle() {
    return this;
  }

  fillCircle() {
    return this;
  }

  strokeCircle() {
    return this;
  }

  destroy() {}
}

class MockCamera {
  public width = 800;
  public height = 600;
}

class MockInput {
  private listeners: Map<string, Function[]> = new Map();

  on(event: string, callback: Function, context?: any) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback.bind(context));
  }

  off(event: string, callback: Function, context?: any) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback.bind(context));
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  emit(event: string, ...args: any[]) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => callback(...args));
    }
  }
}

class MockScene {
  public cameras = {
    main: new MockCamera(),
  };
  public input = new MockInput();
  public add = {
    graphics: () => new MockGraphics(),
  };
}

describe('TouchControlsManager', () => {
  let scene: MockScene;
  let touchControls: TouchControlsManager;

  beforeEach(() => {
    scene = new MockScene();
    touchControls = new TouchControlsManager({
      scene: scene as any,
      joystickRadius: 60,
      joystickX: 100,
      joystickY: 500,
      deadZone: 0.15,
    });
  });

  afterEach(() => {
    touchControls.destroy();
  });

  describe('Initialization', () => {
    it('should create TouchControlsManager with default config', () => {
      const manager = new TouchControlsManager({
        scene: scene as any,
      });

      expect(manager).toBeDefined();
      expect(manager.isActive()).toBe(false);
      manager.destroy();
    });

    it('should create TouchControlsManager with custom config', () => {
      const manager = new TouchControlsManager({
        scene: scene as any,
        joystickRadius: 80,
        joystickX: 150,
        joystickY: 450,
        deadZone: 0.2,
      });

      expect(manager).toBeDefined();
      expect(manager.isActive()).toBe(false);
      manager.destroy();
    });

    it('should setup touch event listeners', () => {
      const spyOn = vi.spyOn(scene.input, 'on');

      const manager = new TouchControlsManager({
        scene: scene as any,
      });

      expect(spyOn).toHaveBeenCalledWith('pointerdown', expect.any(Function), manager);
      expect(spyOn).toHaveBeenCalledWith('pointermove', expect.any(Function), manager);
      expect(spyOn).toHaveBeenCalledWith('pointerup', expect.any(Function), manager);

      manager.destroy();
    });
  });

  describe('Touch Events', () => {
    it('should activate joystick on touch start near joystick area', () => {
      const pointer = { x: 100, y: 500 };

      scene.input.emit('pointerdown', pointer);

      expect(touchControls.isActive()).toBe(true);
    });

    it('should not activate joystick on touch start far from joystick area', () => {
      const pointer = { x: 400, y: 300 };

      scene.input.emit('pointerdown', pointer);

      expect(touchControls.isActive()).toBe(false);
    });

    it('should update joystick position on touch move when active', () => {
      // Start touch
      scene.input.emit('pointerdown', { x: 100, y: 500 });

      // Move touch
      scene.input.emit('pointermove', { x: 120, y: 480 });

      const state = touchControls.getJoystickState();
      expect(state.active).toBe(true);
      expect(state.force).toBeGreaterThan(0);
    });

    it('should not update joystick on touch move when inactive', () => {
      // Move without starting touch
      scene.input.emit('pointermove', { x: 120, y: 480 });

      const state = touchControls.getJoystickState();
      expect(state.active).toBe(false);
      expect(state.force).toBe(0);
    });

    it('should deactivate joystick on touch end', () => {
      // Start and move touch
      scene.input.emit('pointerdown', { x: 100, y: 500 });
      scene.input.emit('pointermove', { x: 120, y: 480 });

      expect(touchControls.isActive()).toBe(true);

      // End touch
      scene.input.emit('pointerup');

      expect(touchControls.isActive()).toBe(false);
    });
  });

  describe('Joystick State', () => {
    it('should return inactive state when joystick is not active', () => {
      const state = touchControls.getJoystickState();

      expect(state.active).toBe(false);
      expect(state.x).toBe(0);
      expect(state.y).toBe(0);
      expect(state.force).toBe(0);
      expect(state.angle).toBe(0);
    });

    it('should return correct state when joystick is moved right', () => {
      scene.input.emit('pointerdown', { x: 100, y: 500 });
      scene.input.emit('pointermove', { x: 140, y: 500 });

      const state = touchControls.getJoystickState();

      expect(state.active).toBe(true);
      expect(state.x).toBeGreaterThan(0);
      expect(Math.abs(state.y)).toBeLessThan(0.1);
      expect(state.force).toBeGreaterThan(0);
    });

    it('should return correct state when joystick is moved left', () => {
      scene.input.emit('pointerdown', { x: 100, y: 500 });
      scene.input.emit('pointermove', { x: 60, y: 500 });

      const state = touchControls.getJoystickState();

      expect(state.active).toBe(true);
      expect(state.x).toBeLessThan(0);
      expect(Math.abs(state.y)).toBeLessThan(0.1);
      expect(state.force).toBeGreaterThan(0);
    });

    it('should return correct state when joystick is moved up', () => {
      scene.input.emit('pointerdown', { x: 100, y: 500 });
      scene.input.emit('pointermove', { x: 100, y: 460 });

      const state = touchControls.getJoystickState();

      expect(state.active).toBe(true);
      expect(Math.abs(state.x)).toBeLessThan(0.1);
      expect(state.y).toBeLessThan(0);
      expect(state.force).toBeGreaterThan(0);
    });

    it('should return correct state when joystick is moved down', () => {
      scene.input.emit('pointerdown', { x: 100, y: 500 });
      scene.input.emit('pointermove', { x: 100, y: 540 });

      const state = touchControls.getJoystickState();

      expect(state.active).toBe(true);
      expect(Math.abs(state.x)).toBeLessThan(0.1);
      expect(state.y).toBeGreaterThan(0);
      expect(state.force).toBeGreaterThan(0);
    });

    it('should limit joystick movement to radius', () => {
      scene.input.emit('pointerdown', { x: 100, y: 500 });
      // Move far beyond radius
      scene.input.emit('pointermove', { x: 300, y: 300 });

      const state = touchControls.getJoystickState();

      expect(state.force).toBeLessThanOrEqual(1);
    });

    it('should apply dead zone correctly', () => {
      scene.input.emit('pointerdown', { x: 100, y: 500 });
      // Very small movement (within dead zone)
      scene.input.emit('pointermove', { x: 102, y: 502 });

      const state = touchControls.getJoystickState();

      expect(state.force).toBe(0);
    });

    it('should return force > 0 outside dead zone', () => {
      scene.input.emit('pointerdown', { x: 100, y: 500 });
      // Movement outside dead zone
      scene.input.emit('pointermove', { x: 120, y: 520 });

      const state = touchControls.getJoystickState();

      expect(state.force).toBeGreaterThan(0);
    });

    it('should calculate angle correctly for right direction', () => {
      scene.input.emit('pointerdown', { x: 100, y: 500 });
      scene.input.emit('pointermove', { x: 140, y: 500 });

      const state = touchControls.getJoystickState();

      expect(state.angle).toBeCloseTo(0, 1);
    });

    it('should calculate angle correctly for left direction', () => {
      scene.input.emit('pointerdown', { x: 100, y: 500 });
      scene.input.emit('pointermove', { x: 60, y: 500 });

      const state = touchControls.getJoystickState();

      expect(Math.abs(state.angle)).toBeCloseTo(Math.PI, 1);
    });
  });

  describe('Touch Device Detection', () => {
    it('should detect touch device when ontouchstart is available', () => {
      const originalOntouchstart = 'ontouchstart' in window;

      // Mock touch device
      Object.defineProperty(window, 'ontouchstart', {
        configurable: true,
        value: {},
      });

      expect(TouchControlsManager.isTouchDevice()).toBe(true);

      // Restore
      if (!originalOntouchstart) {
        // @ts-ignore
        delete window.ontouchstart;
      }
    });

    it('should detect touch device when maxTouchPoints > 0', () => {
      const originalMaxTouchPoints = navigator.maxTouchPoints;

      // Mock touch device
      Object.defineProperty(navigator, 'maxTouchPoints', {
        configurable: true,
        value: 1,
      });

      expect(TouchControlsManager.isTouchDevice()).toBe(true);

      // Restore
      Object.defineProperty(navigator, 'maxTouchPoints', {
        configurable: true,
        value: originalMaxTouchPoints,
      });
    });
  });

  describe('Cleanup', () => {
    it('should remove event listeners on destroy', () => {
      const spyOff = vi.spyOn(scene.input, 'off');

      touchControls.destroy();

      expect(spyOff).toHaveBeenCalledWith('pointerdown', expect.any(Function), touchControls);
      expect(spyOff).toHaveBeenCalledWith('pointermove', expect.any(Function), touchControls);
      expect(spyOff).toHaveBeenCalledWith('pointerup', expect.any(Function), touchControls);
    });

    it('should not throw error when destroyed multiple times', () => {
      expect(() => {
        touchControls.destroy();
        touchControls.destroy();
      }).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle pointer down at exact joystick center', () => {
      scene.input.emit('pointerdown', { x: 100, y: 500 });

      expect(touchControls.isActive()).toBe(true);

      const state = touchControls.getJoystickState();
      expect(state.force).toBe(0);
    });

    it('should handle rapid touch events', () => {
      scene.input.emit('pointerdown', { x: 100, y: 500 });
      scene.input.emit('pointermove', { x: 120, y: 480 });
      scene.input.emit('pointermove', { x: 110, y: 490 });
      scene.input.emit('pointermove', { x: 130, y: 470 });
      scene.input.emit('pointerup');

      expect(touchControls.isActive()).toBe(false);
    });

    it('should handle touch end without touch start', () => {
      scene.input.emit('pointerup');

      expect(touchControls.isActive()).toBe(false);
    });
  });
});
