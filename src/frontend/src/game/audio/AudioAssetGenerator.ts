import Phaser from 'phaser';

/**
 * AudioAssetGenerator - Generates simple procedural audio for the game
 * Creates audio buffers programmatically without external audio files
 */
export class AudioAssetGenerator {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Generates all default audio assets
   */
  generateDefaultAudio(): void {
    // Only generate if Web Audio API is available
    if (!this.scene.sound || !(this.scene.sound as any).context) {
      return;
    }

    this.generateButtonClick();
    this.generateMenuMusic();
    this.generateMovementSound();
  }

  /**
   * Generates a simple button click sound
   */
  private generateButtonClick(): void {
    const context = (this.scene.sound as any).context as AudioContext;
    if (!context) return;

    const sampleRate = context.sampleRate;
    const duration = 0.1; // 100ms
    const length = sampleRate * duration;
    const buffer = context.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    // Generate a short click/beep sound
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      // Short sine wave with exponential decay
      data[i] = Math.sin(2 * Math.PI * 800 * t) * Math.exp(-t * 50);
    }

    // Add the audio to Phaser's cache
    this.scene.cache.audio.add('button-click', buffer);
  }

  /**
   * Generates simple background menu music
   */
  private generateMenuMusic(): void {
    const context = (this.scene.sound as any).context as AudioContext;
    if (!context) return;

    const sampleRate = context.sampleRate;
    const duration = 4; // 4 seconds loop
    const length = sampleRate * duration;
    const buffer = context.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    // Generate a simple melody with multiple frequencies
    const notes = [440, 494, 523, 587]; // A, B, C, D notes
    const noteLength = length / notes.length;

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const noteIndex = Math.floor(i / noteLength);
      const freq = notes[noteIndex % notes.length];
      
      // Sine wave with gentle amplitude modulation
      const envelope = 0.3 * (1 - (i % noteLength) / noteLength * 0.5);
      data[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.1;
    }

    this.scene.cache.audio.add('menu-music', buffer);
  }

  /**
   * Generates a movement/step sound
   */
  private generateMovementSound(): void {
    const context = (this.scene.sound as any).context as AudioContext;
    if (!context) return;

    const sampleRate = context.sampleRate;
    const duration = 0.15; // 150ms
    const length = sampleRate * duration;
    const buffer = context.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    // Generate a low frequency thump
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      // Low frequency with quick decay (like a footstep)
      const freq = 100 + 50 * Math.exp(-t * 10);
      data[i] = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 15) * 0.3;
    }

    this.scene.cache.audio.add('movement-sound', buffer);
  }

  /**
   * Checks if audio generation is supported
   * @returns Whether audio can be generated
   */
  static isSupported(scene: Phaser.Scene): boolean {
    return !!(scene.sound && (scene.sound as any).context);
  }
}
