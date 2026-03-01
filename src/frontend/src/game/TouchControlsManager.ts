import Phaser from 'phaser';

export interface TouchControlsConfig {
  scene: Phaser.Scene;
  joystickRadius?: number;
  joystickX?: number;
  joystickY?: number;
  deadZone?: number;
}

export interface JoystickState {
  active: boolean;
  x: number;
  y: number;
  force: number;
  angle: number;
}

/**
 * TouchControlsManager handles touch input for mobile devices
 * Provides a virtual joystick for player movement
 */
export class TouchControlsManager {
  private scene: Phaser.Scene;
  private joystickRadius: number;
  private joystickX: number;
  private joystickY: number;
  private deadZone: number;

  private joystickBase?: Phaser.GameObjects.Graphics;
  private joystickThumb?: Phaser.GameObjects.Graphics;
  private joystickActive: boolean = false;
  private joystickStartX: number = 0;
  private joystickStartY: number = 0;
  private joystickCurrentX: number = 0;
  private joystickCurrentY: number = 0;

  constructor(config: TouchControlsConfig) {
    this.scene = config.scene;
    this.joystickRadius = config.joystickRadius || 60;
    this.joystickX = config.joystickX || 100;
    this.joystickY = config.joystickY || this.scene.cameras.main.height - 100;
    this.deadZone = config.deadZone || 0.15;

    this.setupTouchControls();
  }

  private setupTouchControls(): void {
    // Create joystick base (outer circle)
    this.joystickBase = this.scene.add.graphics();
    this.joystickBase.setDepth(1000);
    this.drawJoystickBase();
    this.joystickBase.setAlpha(0.5);
    this.joystickBase.setVisible(false);

    // Create joystick thumb (inner circle)
    this.joystickThumb = this.scene.add.graphics();
    this.joystickThumb.setDepth(1001);
    this.drawJoystickThumb(0, 0);
    this.joystickThumb.setAlpha(0.7);
    this.joystickThumb.setVisible(false);

    // Setup touch event listeners
    this.scene.input.on('pointerdown', this.handleTouchStart, this);
    this.scene.input.on('pointermove', this.handleTouchMove, this);
    this.scene.input.on('pointerup', this.handleTouchEnd, this);
  }

  private drawJoystickBase(): void {
    if (!this.joystickBase) return;

    this.joystickBase.clear();
    this.joystickBase.lineStyle(4, 0xffffff, 1);
    this.joystickBase.fillStyle(0x000000, 0.3);
    this.joystickBase.fillCircle(this.joystickX, this.joystickY, this.joystickRadius);
    this.joystickBase.strokeCircle(this.joystickX, this.joystickY, this.joystickRadius);
  }

  private drawJoystickThumb(offsetX: number, offsetY: number): void {
    if (!this.joystickThumb) return;

    this.joystickThumb.clear();
    this.joystickThumb.fillStyle(0x4f46e5, 0.8);
    this.joystickThumb.fillCircle(
      this.joystickX + offsetX,
      this.joystickY + offsetY,
      this.joystickRadius * 0.4
    );
  }

  private handleTouchStart(pointer: Phaser.Input.Pointer): void {
    const distance = Phaser.Math.Distance.Between(
      pointer.x,
      pointer.y,
      this.joystickX,
      this.joystickY
    );

    // Only activate if touch is near the joystick area
    if (distance < this.joystickRadius * 2) {
      this.joystickActive = true;
      this.joystickStartX = pointer.x;
      this.joystickStartY = pointer.y;
      this.joystickCurrentX = pointer.x;
      this.joystickCurrentY = pointer.y;

      this.joystickBase?.setVisible(true);
      this.joystickThumb?.setVisible(true);
    }
  }

  private handleTouchMove(pointer: Phaser.Input.Pointer): void {
    if (!this.joystickActive) return;

    this.joystickCurrentX = pointer.x;
    this.joystickCurrentY = pointer.y;

    // Calculate offset from joystick center
    let offsetX = this.joystickCurrentX - this.joystickX;
    let offsetY = this.joystickCurrentY - this.joystickY;

    // Limit thumb movement to joystick radius
    const distance = Math.sqrt(offsetX * offsetX + offsetY * offsetY);
    if (distance > this.joystickRadius) {
      const angle = Math.atan2(offsetY, offsetX);
      offsetX = Math.cos(angle) * this.joystickRadius;
      offsetY = Math.sin(angle) * this.joystickRadius;
    }

    // Update thumb position
    this.drawJoystickThumb(offsetX, offsetY);
  }

  private handleTouchEnd(): void {
    if (!this.joystickActive) return;

    this.joystickActive = false;
    this.joystickCurrentX = this.joystickX;
    this.joystickCurrentY = this.joystickY;

    // Reset thumb to center
    this.drawJoystickThumb(0, 0);

    // Hide joystick
    this.joystickBase?.setVisible(false);
    this.joystickThumb?.setVisible(false);
  }

  /**
   * Get the current joystick state
   */
  public getJoystickState(): JoystickState {
    if (!this.joystickActive) {
      return {
        active: false,
        x: 0,
        y: 0,
        force: 0,
        angle: 0,
      };
    }

    // Calculate normalized offset (-1 to 1)
    const offsetX = this.joystickCurrentX - this.joystickX;
    const offsetY = this.joystickCurrentY - this.joystickY;
    const distance = Math.sqrt(offsetX * offsetX + offsetY * offsetY);
    const normalizedDistance = Math.min(distance / this.joystickRadius, 1);

    // Apply dead zone
    const force = normalizedDistance < this.deadZone ? 0 : normalizedDistance;

    // Calculate angle
    const angle = Math.atan2(offsetY, offsetX);

    // Calculate normalized direction
    const normalizedX = distance > 0 ? offsetX / distance : 0;
    const normalizedY = distance > 0 ? offsetY / distance : 0;

    return {
      active: true,
      x: normalizedX * force,
      y: normalizedY * force,
      force: force,
      angle: angle,
    };
  }

  /**
   * Check if touch controls are currently active
   */
  public isActive(): boolean {
    return this.joystickActive;
  }

  /**
   * Cleanup touch controls
   */
  public destroy(): void {
    this.scene.input.off('pointerdown', this.handleTouchStart, this);
    this.scene.input.off('pointermove', this.handleTouchMove, this);
    this.scene.input.off('pointerup', this.handleTouchEnd, this);

    this.joystickBase?.destroy();
    this.joystickThumb?.destroy();
  }

  /**
   * Check if device supports touch
   */
  public static isTouchDevice(): boolean {
    return (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      // @ts-ignore
      navigator.msMaxTouchPoints > 0
    );
  }
}
