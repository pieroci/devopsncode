import Phaser from 'phaser';

export interface SoundConfig {
  volume?: number;
  loop?: boolean;
  mute?: boolean;
}

export interface VolumeSettings {
  master: number;
  music: number;
  sfx: number;
}

/**
 * SoundManager - Manages all audio playback in the game
 * Handles background music, sound effects, and volume controls
 */
export class SoundManager {
  private scene: Phaser.Scene;
  private sounds: Map<string, Phaser.Sound.BaseSound> = new Map();
  private music?: Phaser.Sound.BaseSound;
  private volumes: VolumeSettings;
  private muted: boolean = false;

  constructor(scene: Phaser.Scene, initialVolumes?: Partial<VolumeSettings>) {
    this.scene = scene;
    this.volumes = {
      master: initialVolumes?.master ?? 0.7,
      music: initialVolumes?.music ?? 0.5,
      sfx: initialVolumes?.sfx ?? 0.8,
    };
  }

  /**
   * Plays a sound effect
   * @param key - The sound key
   * @param config - Optional sound configuration
   */
  playSound(key: string, config?: SoundConfig): void {
    if (!this.scene.sound || this.muted) {
      return;
    }

    const volume = (config?.volume ?? 1) * this.volumes.sfx * this.volumes.master;
    const sound = this.scene.sound.add(key, {
      volume,
      loop: config?.loop ?? false,
      mute: config?.mute ?? false,
    });

    sound.play();
    this.sounds.set(key, sound);

    // Auto-cleanup when sound finishes
    sound.once('complete', () => {
      this.sounds.delete(key);
    });
  }

  /**
   * Plays or resumes background music
   * @param key - The music key
   * @param config - Optional music configuration
   */
  playMusic(key: string, config?: SoundConfig): void {
    if (!this.scene.sound) {
      return;
    }

    // Stop existing music
    if (this.music) {
      this.music.stop();
    }

    const volume = (config?.volume ?? 1) * this.volumes.music * this.volumes.master;
    this.music = this.scene.sound.add(key, {
      volume,
      loop: config?.loop ?? true,
      mute: config?.mute ?? this.muted,
    });

    this.music.play();
  }

  /**
   * Stops the currently playing music
   */
  stopMusic(): void {
    if (this.music) {
      this.music.stop();
      this.music = undefined;
    }
  }

  /**
   * Pauses the currently playing music
   */
  pauseMusic(): void {
    if (this.music && this.music.isPlaying) {
      this.music.pause();
    }
  }

  /**
   * Resumes paused music
   */
  resumeMusic(): void {
    if (this.music && this.music.isPaused) {
      this.music.resume();
    }
  }

  /**
   * Stops a specific sound effect
   * @param key - The sound key
   */
  stopSound(key: string): void {
    const sound = this.sounds.get(key);
    if (sound) {
      sound.stop();
      this.sounds.delete(key);
    }
  }

  /**
   * Stops all currently playing sounds
   */
  stopAllSounds(): void {
    this.sounds.forEach((sound) => sound.stop());
    this.sounds.clear();
  }

  /**
   * Sets the master volume
   * @param volume - Volume level (0 to 1)
   */
  setMasterVolume(volume: number): void {
    this.volumes.master = Math.max(0, Math.min(1, volume));
    this.updateVolumes();
  }

  /**
   * Sets the music volume
   * @param volume - Volume level (0 to 1)
   */
  setMusicVolume(volume: number): void {
    this.volumes.music = Math.max(0, Math.min(1, volume));
    if (this.music && 'setVolume' in this.music) {
      (this.music as any).setVolume(this.volumes.music * this.volumes.master);
    }
  }

  /**
   * Sets the sound effects volume
   * @param volume - Volume level (0 to 1)
   */
  setSfxVolume(volume: number): void {
    this.volumes.sfx = Math.max(0, Math.min(1, volume));
    this.sounds.forEach((sound) => {
      if ('setVolume' in sound) {
        (sound as any).setVolume(this.volumes.sfx * this.volumes.master);
      }
    });
  }

  /**
   * Gets current volume settings
   * @returns Current volume levels
   */
  getVolumes(): VolumeSettings {
    return { ...this.volumes };
  }

  /**
   * Mutes all audio
   */
  mute(): void {
    this.muted = true;
    if (this.music && 'setMute' in this.music) {
      (this.music as any).setMute(true);
    }
    this.sounds.forEach((sound) => {
      if ('setMute' in sound) {
        (sound as any).setMute(true);
      }
    });
  }

  /**
   * Unmutes all audio
   */
  unmute(): void {
    this.muted = false;
    if (this.music && 'setMute' in this.music) {
      (this.music as any).setMute(false);
    }
    this.sounds.forEach((sound) => {
      if ('setMute' in sound) {
        (sound as any).setMute(false);
      }
    });
  }

  /**
   * Checks if audio is muted
   * @returns Whether audio is muted
   */
  isMuted(): boolean {
    return this.muted;
  }

  /**
   * Updates all sound volumes based on current settings
   */
  private updateVolumes(): void {
    if (this.music && 'setVolume' in this.music) {
      (this.music as any).setVolume(this.volumes.music * this.volumes.master);
    }
    this.sounds.forEach((sound) => {
      if ('setVolume' in sound) {
        (sound as any).setVolume(this.volumes.sfx * this.volumes.master);
      }
    });
  }

  /**
   * Cleanup - stops all audio
   */
  destroy(): void {
    this.stopMusic();
    this.stopAllSounds();
  }
}
