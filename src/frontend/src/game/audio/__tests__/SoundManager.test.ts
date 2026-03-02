import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Phaser module completely
vi.mock('phaser', () => ({
  default: {
    Scene: class {},
    Sound: {
      BaseSound: class {},
    },
  },
}));

import { SoundManager } from '../SoundManager';

describe('SoundManager', () => {
  let mockScene: any;
  let mockSound: any;
  let mockMusic: any;
  let soundManager: SoundManager;

  beforeEach(() => {
    // Mock sound object
    mockSound = {
      play: vi.fn(),
      stop: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      setVolume: vi.fn(),
      setMute: vi.fn(),
      isPlaying: true,
      isPaused: false,
      once: vi.fn((event, callback) => {
        // Simulate completion immediately for testing
        if (event === 'complete') {
          setTimeout(callback, 0);
        }
      }),
    };

    mockMusic = { ...mockSound, isPaused: false };

    // Mock scene
    mockScene = {
      sound: {
        add: vi.fn(() => ({ ...mockSound })),
        context: {},
      },
      cache: {
        audio: {
          exists: vi.fn(() => true),
        },
      },
    };

    soundManager = new SoundManager(mockScene);
  });

  describe('Initialization', () => {
    it('should initialize with default volumes', () => {
      const volumes = soundManager.getVolumes();
      
      expect(volumes.master).toBe(0.7);
      expect(volumes.music).toBe(0.5);
      expect(volumes.sfx).toBe(0.8);
    });

    it('should initialize with custom volumes', () => {
      const customManager = new SoundManager(mockScene, {
        master: 0.9,
        music: 0.6,
        sfx: 0.7,
      });

      const volumes = customManager.getVolumes();
      
      expect(volumes.master).toBe(0.9);
      expect(volumes.music).toBe(0.6);
      expect(volumes.sfx).toBe(0.7);
    });

    it('should not be muted by default', () => {
      expect(soundManager.isMuted()).toBe(false);
    });
  });

  describe('Sound Effects', () => {
    it('should play a sound effect', () => {
      soundManager.playSound('test-sound');

      expect(mockScene.sound.add).toHaveBeenCalledWith('test-sound', expect.any(Object));
      expect(mockSound.play).toHaveBeenCalled();
    });

    it('should play sound with custom volume', () => {
      soundManager.playSound('test-sound', { volume: 0.5 });

      const addCall = mockScene.sound.add.mock.calls[0];
      expect(addCall[1].volume).toBeCloseTo(0.5 * 0.8 * 0.7); // custom * sfx * master
    });

    it('should play looping sound effect', () => {
      soundManager.playSound('loop-sound', { loop: true });

      const addCall = mockScene.sound.add.mock.calls[0];
      expect(addCall[1].loop).toBe(true);
    });

    it('should not play sound when muted', () => {
      soundManager.mute();
      soundManager.playSound('test-sound');

      expect(mockScene.sound.add).not.toHaveBeenCalled();
    });

    it('should stop a specific sound', () => {
      // Need to return a persistent mock for stopSound to work
      const persistentMock = { ...mockSound, once: vi.fn() };
      mockScene.sound.add.mockReturnValue(persistentMock);
      
      soundManager.playSound('test-sound');
      soundManager.stopSound('test-sound');

      expect(persistentMock.stop).toHaveBeenCalled();
    });

    it('should stop all sounds', () => {
      const sound1 = { ...mockSound, once: vi.fn() };
      const sound2 = { ...mockSound, once: vi.fn() };
      mockScene.sound.add.mockReturnValueOnce(sound1).mockReturnValueOnce(sound2);

      soundManager.playSound('sound1');
      soundManager.playSound('sound2');
      soundManager.stopAllSounds();

      expect(sound1.stop).toHaveBeenCalled();
      expect(sound2.stop).toHaveBeenCalled();
    });
  });

  describe('Background Music', () => {
    it('should play background music', () => {
      mockScene.sound.add.mockReturnValue(mockMusic);
      soundManager.playMusic('menu-music');

      expect(mockScene.sound.add).toHaveBeenCalledWith('menu-music', expect.any(Object));
      expect(mockMusic.play).toHaveBeenCalled();
    });

    it('should loop music by default', () => {
      mockScene.sound.add.mockReturnValue(mockMusic);
      soundManager.playMusic('menu-music');

      const addCall = mockScene.sound.add.mock.calls[0];
      expect(addCall[1].loop).toBe(true);
    });

    it('should stop existing music when playing new music', () => {
      const oldMusic = { ...mockMusic };
      const newMusic = { ...mockMusic };
      
      mockScene.sound.add.mockReturnValueOnce(oldMusic).mockReturnValueOnce(newMusic);

      soundManager.playMusic('music1');
      soundManager.playMusic('music2');

      expect(oldMusic.stop).toHaveBeenCalled();
      expect(newMusic.play).toHaveBeenCalled();
    });

    it('should stop music', () => {
      mockScene.sound.add.mockReturnValue(mockMusic);
      soundManager.playMusic('menu-music');
      soundManager.stopMusic();

      expect(mockMusic.stop).toHaveBeenCalled();
    });

    it('should pause music', () => {
      mockScene.sound.add.mockReturnValue(mockMusic);
      soundManager.playMusic('menu-music');
      soundManager.pauseMusic();

      expect(mockMusic.pause).toHaveBeenCalled();
    });

    it('should resume music', () => {
      const pausedMusic = { ...mockMusic, isPaused: true, isPlaying: false };
      mockScene.sound.add.mockReturnValue(pausedMusic);
      
      soundManager.playMusic('menu-music');
      soundManager.resumeMusic();

      expect(pausedMusic.resume).toHaveBeenCalled();
    });

    it('should not resume if music is not paused', () => {
      mockScene.sound.add.mockReturnValue(mockMusic);
      soundManager.playMusic('menu-music');
      soundManager.resumeMusic();

      expect(mockMusic.resume).not.toHaveBeenCalled();
    });
  });

  describe('Volume Controls', () => {
    it('should set master volume', () => {
      soundManager.setMasterVolume(0.5);

      const volumes = soundManager.getVolumes();
      expect(volumes.master).toBe(0.5);
    });

    it('should clamp master volume between 0 and 1', () => {
      soundManager.setMasterVolume(1.5);
      expect(soundManager.getVolumes().master).toBe(1);

      soundManager.setMasterVolume(-0.5);
      expect(soundManager.getVolumes().master).toBe(0);
    });

    it('should set music volume', () => {
      mockScene.sound.add.mockReturnValue(mockMusic);
      soundManager.playMusic('menu-music');
      
      soundManager.setMusicVolume(0.3);

      const volumes = soundManager.getVolumes();
      expect(volumes.music).toBe(0.3);
      expect(mockMusic.setVolume).toHaveBeenCalled();
    });

    it('should set sfx volume', () => {
      const sound1 = { ...mockSound, once: vi.fn() };
      mockScene.sound.add.mockReturnValue(sound1);
      
      soundManager.playSound('test-sound');
      soundManager.setSfxVolume(0.4);

      const volumes = soundManager.getVolumes();
      expect(volumes.sfx).toBe(0.4);
      expect(sound1.setVolume).toHaveBeenCalled();
    });

    it('should return volume settings', () => {
      const volumes = soundManager.getVolumes();

      expect(volumes).toHaveProperty('master');
      expect(volumes).toHaveProperty('music');
      expect(volumes).toHaveProperty('sfx');
      expect(volumes.master).toBe(0.7);
    });
  });

  describe('Mute/Unmute', () => {
    it('should mute all audio', () => {
      mockScene.sound.add.mockReturnValue(mockMusic);
      soundManager.playMusic('menu-music');
      
      soundManager.mute();

      expect(soundManager.isMuted()).toBe(true);
      expect(mockMusic.setMute).toHaveBeenCalledWith(true);
    });

    it('should unmute all audio', () => {
      mockScene.sound.add.mockReturnValue(mockMusic);
      soundManager.playMusic('menu-music');
      
      soundManager.mute();
      soundManager.unmute();

      expect(soundManager.isMuted()).toBe(false);
      expect(mockMusic.setMute).toHaveBeenCalledWith(false);
    });

    it('should mute sounds when muted', () => {
      const sound1 = { ...mockSound, once: vi.fn() };
      mockScene.sound.add.mockReturnValue(sound1);
      
      soundManager.mute();
      soundManager.playSound('test-sound');

      // Sound shouldn't play when muted
      expect(mockScene.sound.add).not.toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('should destroy and cleanup all audio', () => {
      const music = { ...mockMusic };
      const sound1 = { ...mockSound, once: vi.fn() };
      
      mockScene.sound.add.mockReturnValueOnce(music).mockReturnValueOnce(sound1);

      soundManager.playMusic('menu-music');
      soundManager.playSound('test-sound');
      soundManager.destroy();

      expect(music.stop).toHaveBeenCalled();
      expect(sound1.stop).toHaveBeenCalled();
    });

    it('should handle destroy when no audio is playing', () => {
      expect(() => soundManager.destroy()).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing sound system gracefully', () => {
      const noSoundScene = { ...mockScene, sound: undefined };
      const manager = new SoundManager(noSoundScene);

      expect(() => manager.playSound('test')).not.toThrow();
      expect(() => manager.playMusic('music')).not.toThrow();
    });

    it('should handle stopping non-existent sound', () => {
      expect(() => soundManager.stopSound('non-existent')).not.toThrow();
    });

    it('should handle pausing when no music is playing', () => {
      expect(() => soundManager.pauseMusic()).not.toThrow();
    });

    it('should handle resuming when no music is playing', () => {
      expect(() => soundManager.resumeMusic()).not.toThrow();
    });
  });
});
