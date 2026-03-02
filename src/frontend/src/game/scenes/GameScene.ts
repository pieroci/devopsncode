import Phaser from 'phaser';
import type { GamePlayer } from '@/types';
import { GAME_CONFIG } from '../config/gameConfig';
import { TouchControlsManager } from '../TouchControlsManager';
import { ParticleEffectsManager } from '../graphics/ParticleEffectsManager';

export interface GameSceneData {
  sendPosition?: (x: number, y: number, rotation: number) => Promise<void>;
  players?: GamePlayer[];
  currentRoom?: any;
}

export class GameScene extends Phaser.Scene {
  private localPlayer?: Phaser.Physics.Arcade.Sprite;
  private remotePlayers: Map<string, Phaser.Physics.Arcade.Sprite> = new Map();
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd?: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  private touchControls?: TouchControlsManager;
  private particleEffects?: ParticleEffectsManager;
  private sceneData?: GameSceneData;
  private lastPositionUpdate: number = 0;
  private playerLabels: Map<string, Phaser.GameObjects.Text> = new Map();

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: GameSceneData): void {
    this.sceneData = data;
  }

  create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Add background
    this.add.rectangle(0, 0, width, height, GAME_CONFIG.COLORS.BACKGROUND).setOrigin(0, 0);

    // Add ground tiles
    this.createGroundTiles();

    // Initialize particle effects
    this.particleEffects = new ParticleEffectsManager(this);

    // Create local player
    this.createLocalPlayer();

    // Setup controls
    this.setupControls();

    // Create existing remote players
    if (this.sceneData?.players) {
      this.sceneData.players.forEach((player) => {
        this.addRemotePlayer(player);
      });
    }

    // Add UI text
    const controlsText = TouchControlsManager.isTouchDevice()
      ? 'Use on-screen joystick or WASD/Arrows to move'
      : 'Use WASD or Arrows to move';
    
    this.add.text(16, 16, controlsText, {
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 8, y: 4 },
    });
  }

  update(time: number): void {
    if (!this.localPlayer) {
      return;
    }

    // Handle player movement
    this.handlePlayerMovement();

    // Broadcast position periodically
    if (time - this.lastPositionUpdate > GAME_CONFIG.POSITION_UPDATE_INTERVAL) {
      this.broadcastPosition();
      this.lastPositionUpdate = time;
    }

    // Update player labels
    this.updatePlayerLabels();
  }

  private createGroundTiles(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const tileSize = 64;

    for (let x = 0; x < width; x += tileSize) {
      for (let y = 0; y < height; y += tileSize) {
        const tile = this.add.image(x, y, 'ground');
        tile.setOrigin(0, 0);
        tile.setAlpha(0.3);
      }
    }
  }

  private createLocalPlayer(): void {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    this.localPlayer = this.physics.add.sprite(centerX, centerY, 'player');
    this.localPlayer.setCollideWorldBounds(true);
    
    // Add particle trail for local player
    if (this.particleEffects && this.localPlayer) {
      this.particleEffects.createMovementTrail('local-player-trail', this.localPlayer, 'spark-particle');
    }
    
    // Add label
    const label = this.add.text(0, 0, 'You', {
      fontSize: '12px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 4, y: 2 },
    });
    label.setOrigin(0.5, 1);
    this.playerLabels.set('local', label);
  }

  private setupControls(): void {
    // Arrow keys
    this.cursors = this.input.keyboard?.createCursorKeys();

    // WASD keys
    if (this.input.keyboard) {
      this.wasd = {
        W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      };
    }

    // Touch controls (only on touch devices)
    if (TouchControlsManager.isTouchDevice()) {
      this.touchControls = new TouchControlsManager({
        scene: this,
        joystickRadius: 60,
        joystickX: 100,
        joystickY: this.cameras.main.height - 100,
        deadZone: 0.15,
      });
    }
  }

  private handlePlayerMovement(): void {
    if (!this.localPlayer) {
      return;
    }

    const speed = GAME_CONFIG.PLAYER_SPEED;
    let velocityX = 0;
    let velocityY = 0;

    // Check keyboard input (both arrow keys and WASD)
    if (this.cursors && this.wasd) {
      if (this.cursors.left.isDown || this.wasd.A.isDown) {
        velocityX = -speed;
      } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
        velocityX = speed;
      }

      if (this.cursors.up.isDown || this.wasd.W.isDown) {
        velocityY = -speed;
      } else if (this.cursors.down.isDown || this.wasd.S.isDown) {
        velocityY = speed;
      }
    }

    // Check touch controls (overrides keyboard if active)
    if (this.touchControls) {
      const joystickState = this.touchControls.getJoystickState();
      if (joystickState.active && joystickState.force > 0) {
        velocityX = joystickState.x * speed;
        velocityY = joystickState.y * speed;
      }
    }

    // Normalize diagonal movement (only for keyboard, touch is already normalized)
    if (!this.touchControls?.isActive() && velocityX !== 0 && velocityY !== 0) {
      velocityX *= 0.707;
      velocityY *= 0.707;
    }

    this.localPlayer.setVelocity(velocityX, velocityY);

    // Update rotation based on movement
    if (velocityX !== 0 || velocityY !== 0) {
      const angle = Math.atan2(velocityY, velocityX);
      this.localPlayer.setRotation(angle);
      
      // Start particle trail when moving
      if (this.particleEffects && !this.particleEffects.isTrailActive('local-player-trail')) {
        this.particleEffects.startTrail('local-player-trail');
      }
    } else {
      // Stop particle trail when stopped
      if (this.particleEffects && this.particleEffects.isTrailActive('local-player-trail')) {
        this.particleEffects.stopTrail('local-player-trail');
      }
    }
  }

  private broadcastPosition(): void {
    if (!this.localPlayer || !this.sceneData?.sendPosition) {
      return;
    }

    const x = this.localPlayer.x;
    const y = this.localPlayer.y;
    const rotation = this.localPlayer.rotation;

    this.sceneData.sendPosition(x, y, rotation).catch((error) => {
      console.error('Failed to broadcast position:', error);
    });
  }

  private updatePlayerLabels(): void {
    // Update local player label
    if (this.localPlayer) {
      const localLabel = this.playerLabels.get('local');
      if (localLabel) {
        localLabel.setPosition(this.localPlayer.x, this.localPlayer.y - 20);
      }
    }

    // Update remote player labels
    this.remotePlayers.forEach((sprite, playerId) => {
      const label = this.playerLabels.get(playerId);
      if (label) {
        label.setPosition(sprite.x, sprite.y - 20);
      }
    });
  }

  /**
   * Add a remote player to the scene
   */
  public addRemotePlayer(player: GamePlayer): void {
    if (this.remotePlayers.has(player.playerId)) {
      return;
    }

    const sprite = this.physics.add.sprite(player.x, player.y, 'remote-player');
    sprite.setRotation(player.rotation);
    this.remotePlayers.set(player.playerId, sprite);

    // Add label
    const label = this.add.text(player.x, player.y - 20, player.username, {
      fontSize: '12px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 4, y: 2 },
    });
    label.setOrigin(0.5, 1);
    this.playerLabels.set(player.playerId, label);
  }

  /**
   * Remove a remote player from the scene
   */
  public removeRemotePlayer(playerId: string): void {
    const sprite = this.remotePlayers.get(playerId);
    if (sprite) {
      sprite.destroy();
      this.remotePlayers.delete(playerId);
    }

    const label = this.playerLabels.get(playerId);
    if (label) {
      label.destroy();
      this.playerLabels.delete(playerId);
    }
  }

  /**
   * Update a remote player's position
   */
  public updateRemotePlayerPosition(
    playerId: string,
    x: number,
    y: number,
    rotation: number
  ): void {
    const sprite = this.remotePlayers.get(playerId);
    if (sprite) {
      // Smooth interpolation
      this.tweens.add({
        targets: sprite,
        x,
        y,
        rotation,
        duration: GAME_CONFIG.INTERPOLATION_DELAY,
        ease: 'Linear',
      });
    }
  }

  /**
   * Get the local player sprite (for testing)
   */
  public getLocalPlayer(): Phaser.Physics.Arcade.Sprite | undefined {
    return this.localPlayer;
  }

  /**
   * Get remote players (for testing)
   */
  public getRemotePlayers(): Map<string, Phaser.Physics.Arcade.Sprite> {
    return this.remotePlayers;
  }

  /**
   * Cleanup when scene is shutdown
   */
  shutdown(): void {
    // Cleanup touch controls
    if (this.touchControls) {
      this.touchControls.destroy();
      this.touchControls = undefined;
    }

    // Clean up particle effects
    if (this.particleEffects) {
      this.particleEffects.destroyAll();
      this.particleEffects = undefined;
    }

    // Clear player labels
    this.playerLabels.forEach((label) => label.destroy());
    this.playerLabels.clear();

    // Clear remote players
    this.remotePlayers.forEach((sprite) => sprite.destroy());
    this.remotePlayers.clear();
  }
}
