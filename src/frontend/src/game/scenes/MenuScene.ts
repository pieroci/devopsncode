import Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
  private startButton?: Phaser.GameObjects.Text;
  private titleText?: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Add background
    this.add.rectangle(0, 0, width, height, 0x1f2937).setOrigin(0, 0);

    // Title
    this.titleText = this.add.text(width / 2, height / 3, 'Racing Game', {
      fontSize: '48px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
    });
    this.titleText.setOrigin(0.5);

    // Subtitle
    const subtitle = this.add.text(
      width / 2,
      height / 3 + 60,
      'Multiplayer Edition',
      {
        fontSize: '24px',
        color: '#9ca3af',
        fontFamily: 'Arial, sans-serif',
      }
    );
    subtitle.setOrigin(0.5);

    // Start button
    this.startButton = this.add.text(width / 2, height / 2 + 50, 'Start Game', {
      fontSize: '32px',
      color: '#ffffff',
      backgroundColor: '#4f46e5',
      padding: { x: 32, y: 16 },
      fontFamily: 'Arial, sans-serif',
    });
    this.startButton.setOrigin(0.5);
    this.startButton.setInteractive({ useHandCursor: true });

    // Button hover effect
    this.startButton.on('pointerover', () => {
      this.startButton?.setStyle({ backgroundColor: '#6366f1' });
    });

    this.startButton.on('pointerout', () => {
      this.startButton?.setStyle({ backgroundColor: '#4f46e5' });
    });

    // Button click handler
    this.startButton.on('pointerdown', () => {
      this.startGame();
    });

    // Instructions
    const instructions = this.add.text(
      width / 2,
      height - 100,
      'Use WASD or Arrow Keys to move\nClick Start when ready',
      {
        fontSize: '16px',
        color: '#9ca3af',
        align: 'center',
        fontFamily: 'Arial, sans-serif',
      }
    );
    instructions.setOrigin(0.5);
  }

  private startGame(): void {
    // Transition to game scene
    this.scene.start('GameScene');
  }

  /**
   * Public method to trigger game start (useful for testing)
   */
  public triggerStart(): void {
    this.startGame();
  }
}
