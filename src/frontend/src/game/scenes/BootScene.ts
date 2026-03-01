import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Load essential assets
    this.loadAssets();
    this.createLoadingBar();
  }

  create(): void {
    // After assets are loaded, go to menu
    this.scene.start('MenuScene');
  }

  private loadAssets(): void {
    // In a real game, load sprites, sounds, etc.
    // For now, we'll create simple placeholders
    
    // Create a simple player sprite (colored rectangle)
    const graphics = this.add.graphics();
    graphics.fillStyle(0x4f46e5, 1);
    graphics.fillRect(0, 0, 32, 32);
    graphics.generateTexture('player', 32, 32);
    graphics.destroy();

    // Create remote player sprite (different color)
    const remoteGraphics = this.add.graphics();
    remoteGraphics.fillStyle(0x06b6d4, 1);
    remoteGraphics.fillRect(0, 0, 32, 32);
    remoteGraphics.generateTexture('remote-player', 32, 32);
    remoteGraphics.destroy();

    // Create track/ground texture
    const groundGraphics = this.add.graphics();
    groundGraphics.fillStyle(0x10b981, 1);
    groundGraphics.fillRect(0, 0, 64, 64);
    groundGraphics.generateTexture('ground', 64, 64);
    groundGraphics.destroy();
  }

  private createLoadingBar(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Progress bar background
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 4, height / 2 - 30, width / 2, 50);

    // Loading text
    const loadingText = this.make.text({
      x: width / 2,
      y: height / 2 - 50,
      text: 'Loading...',
      style: {
        font: '20px monospace',
        color: '#ffffff',
      },
    });
    loadingText.setOrigin(0.5, 0.5);

    // Percent text
    const percentText = this.make.text({
      x: width / 2,
      y: height / 2,
      text: '0%',
      style: {
        font: '18px monospace',
        color: '#ffffff',
      },
    });
    percentText.setOrigin(0.5, 0.5);

    // Update progress bar
    this.load.on('progress', (value: number) => {
      percentText.setText(`${Math.floor(value * 100)}%`);
      progressBar.clear();
      progressBar.fillStyle(0x4f46e5, 1);
      progressBar.fillRect(
        width / 4 + 10,
        height / 2 - 20,
        (width / 2 - 20) * value,
        30
      );
    });

    // Cleanup after loading
    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      percentText.destroy();
    });
  }
}
