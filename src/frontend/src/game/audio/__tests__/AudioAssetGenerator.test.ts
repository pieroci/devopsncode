import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Phaser module completely
vi.mock('phaser', () => ({
  default: {
    Scene: class {},
  },
}));

import { AudioAssetGenerator } from '../AudioAssetGenerator';

describe('AudioAssetGenerator', () => {
  let mockScene: any;
  let mockContext: any;
  let mockBuffer: any;
  let mockChannelData: Float32Array;
  let audioGenerator: AudioAssetGenerator;

  beforeEach(() => {
    // Create mock channel data
    mockChannelData = new Float32Array(44100); // 1 second at 44.1kHz

    // Mock audio buffer
    mockBuffer = {
      getChannelData: vi.fn(() => mockChannelData),
    };

    // Mock audio context
    mockContext = {
      sampleRate: 44100,
      createBuffer: vi.fn(() => mockBuffer),
    };

    // Mock scene
    mockScene = {
      sound: {
        context: mockContext,
      },
      cache: {
        audio: {
          add: vi.fn(),
          exists: vi.fn(() => false),
        },
      },
    };

    audioGenerator = new AudioAssetGenerator(mockScene);
  });

  describe('Initialization', () => {
    it('should create AudioAssetGenerator instance', () => {
      expect(audioGenerator).toBeInstanceOf(AudioAssetGenerator);
    });

    it('should check if audio generation is supported', () => {
      expect(AudioAssetGenerator.isSupported(mockScene)).toBe(true);
    });

    it('should return false if sound system is missing', () => {
      const noSoundScene = { ...mockScene, sound: undefined };
      expect(AudioAssetGenerator.isSupported(noSoundScene)).toBe(false);
    });

    it('should return false if audio context is missing', () => {
      const noContextScene = { ...mockScene, sound: {} };
      expect(AudioAssetGenerator.isSupported(noContextScene)).toBe(false);
    });
  });

  describe('generateDefaultAudio', () => {
    it('should generate all default audio assets', () => {
      audioGenerator.generateDefaultAudio();

      // Should create 3 audio assets
      expect(mockContext.createBuffer).toHaveBeenCalledTimes(3);
      expect(mockScene.cache.audio.add).toHaveBeenCalledTimes(3);
      
      // Check that all assets were added
      expect(mockScene.cache.audio.add).toHaveBeenCalledWith('button-click', expect.any(Object));
      expect(mockScene.cache.audio.add).toHaveBeenCalledWith('menu-music', expect.any(Object));
      expect(mockScene.cache.audio.add).toHaveBeenCalledWith('movement-sound', expect.any(Object));
    });

    it('should not generate audio if Web Audio API is unavailable', () => {
      const noContextScene = { ...mockScene, sound: { context: null } };
      const generator = new AudioAssetGenerator(noContextScene);

      generator.generateDefaultAudio();

      expect(mockScene.cache.audio.add).not.toHaveBeenCalled();
    });

    it('should not generate audio if sound system is missing', () => {
      const noSoundScene = { ...mockScene, sound: undefined };
      const generator = new AudioAssetGenerator(noSoundScene);

      generator.generateDefaultAudio();

      expect(mockContext.createBuffer).not.toHaveBeenCalled();
    });
  });

  describe('Button Click Sound', () => {
    it('should generate button click sound with correct duration', () => {
      audioGenerator.generateDefaultAudio();

      // Button click should be ~0.1 seconds
      const clickCall = mockContext.createBuffer.mock.calls.find(
        call => call[1] === Math.floor(44100 * 0.1)
      );
      expect(clickCall).toBeDefined();
    });

    it('should create mono audio buffer for button click', () => {
      audioGenerator.generateDefaultAudio();

      // All calls should use 1 channel (mono)
      const calls = mockContext.createBuffer.mock.calls;
      expect(calls[0][0]).toBe(1); // First call is button click
    });

    it('should add button click to cache', () => {
      audioGenerator.generateDefaultAudio();

      expect(mockScene.cache.audio.add).toHaveBeenCalledWith(
        'button-click',
        expect.any(Object)
      );
    });

    it('should generate audio data for button click', () => {
      audioGenerator.generateDefaultAudio();

      // Check that channel data was accessed and modified
      expect(mockBuffer.getChannelData).toHaveBeenCalled();
      
      // The channel data should have been modified (not all zeros)
      const hasNonZero = Array.from(mockChannelData).some(v => v !== 0);
      expect(hasNonZero).toBe(true);
    });
  });

  describe('Menu Music', () => {
    it('should generate menu music with correct duration', () => {
      audioGenerator.generateDefaultAudio();

      // Menu music should be 4 seconds
      const musicCall = mockContext.createBuffer.mock.calls.find(
        call => call[1] === 44100 * 4
      );
      expect(musicCall).toBeDefined();
    });

    it('should add menu music to cache', () => {
      audioGenerator.generateDefaultAudio();

      expect(mockScene.cache.audio.add).toHaveBeenCalledWith(
        'menu-music',
        expect.any(Object)
      );
    });

    it('should use correct sample rate', () => {
      audioGenerator.generateDefaultAudio();

      const calls = mockContext.createBuffer.mock.calls;
      calls.forEach(call => {
        expect(call[2]).toBe(44100); // Sample rate
      });
    });
  });

  describe('Movement Sound', () => {
    it('should generate movement sound with correct duration', () => {
      audioGenerator.generateDefaultAudio();

      // Movement sound should be ~0.15 seconds
      const movementCall = mockContext.createBuffer.mock.calls.find(
        call => call[1] === Math.floor(44100 * 0.15)
      );
      expect(movementCall).toBeDefined();
    });

    it('should add movement sound to cache', () => {
      audioGenerator.generateDefaultAudio();

      expect(mockScene.cache.audio.add).toHaveBeenCalledWith(
        'movement-sound',
        expect.any(Object)
      );
    });

    it('should create short duration sound', () => {
      audioGenerator.generateDefaultAudio();

      // Movement sound should be one of the shorter sounds
      const movementCall = mockContext.createBuffer.mock.calls.find(
        call => call[1] === Math.floor(44100 * 0.15)
      );
      expect(movementCall).toBeDefined();
      expect(movementCall[1]).toBeLessThan(44100); // Less than 1 second
    });
  });

  describe('Audio Buffer Creation', () => {
    it('should create buffers with correct parameters', () => {
      audioGenerator.generateDefaultAudio();

      const calls = mockContext.createBuffer.mock.calls;
      
      // All calls should have correct structure: (channels, length, sampleRate)
      calls.forEach(call => {
        expect(call).toHaveLength(3);
        expect(call[0]).toBe(1); // Mono
        expect(call[1]).toBeGreaterThan(0); // Non-zero length
        expect(call[2]).toBe(44100); // Sample rate
      });
    });

    it('should get channel data for all buffers', () => {
      audioGenerator.generateDefaultAudio();

      // getChannelData should be called for each buffer
      expect(mockBuffer.getChannelData).toHaveBeenCalledTimes(3);
      expect(mockBuffer.getChannelData).toHaveBeenCalledWith(0); // Channel 0 (mono)
    });
  });

  describe('Error Handling', () => {
    it('should handle missing audio context gracefully', () => {
      const noContextScene = {
        ...mockScene,
        sound: { context: null },
      };
      const generator = new AudioAssetGenerator(noContextScene);

      expect(() => generator.generateDefaultAudio()).not.toThrow();
    });

    it('should handle missing sound system gracefully', () => {
      const noSoundScene = {
        ...mockScene,
        sound: undefined,
      };
      const generator = new AudioAssetGenerator(noSoundScene);

      expect(() => generator.generateDefaultAudio()).not.toThrow();
    });

    it('should handle createBuffer errors gracefully', () => {
      mockContext.createBuffer = vi.fn(() => {
        throw new Error('Buffer creation failed');
      });

      expect(() => audioGenerator.generateDefaultAudio()).toThrow();
    });
  });

  describe('Static Methods', () => {
    it('should correctly identify supported environments', () => {
      expect(AudioAssetGenerator.isSupported(mockScene)).toBe(true);
      
      const unsupportedScene = { sound: null };
      expect(AudioAssetGenerator.isSupported(unsupportedScene)).toBe(false);
    });

    it('should be callable without instantiation', () => {
      const result = AudioAssetGenerator.isSupported(mockScene);
      expect(typeof result).toBe('boolean');
    });
  });
});
