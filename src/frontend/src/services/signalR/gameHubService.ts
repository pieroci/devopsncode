import { SignalRClient } from './signalRClient';
import type { GamePlayer } from '@/types';

/**
 * Position data for player movement
 */
export interface PositionData {
  playerId: string;
  x: number;
  y: number;
  rotation: number;
  speed?: number;
}

/**
 * Game Hub Service
 * Provides game-specific SignalR functionality for multiplayer racing game
 */
export class GameHubService {
  private client: SignalRClient;

  constructor(hubUrl: string, accessToken?: string) {
    this.client = new SignalRClient(hubUrl, accessToken);
    
    // Set up connection lifecycle handlers
    this.client.onConnectionClosed((error) => {
      if (error) {
        console.error('Game hub connection closed with error:', error);
      } else {
        console.log('Game hub connection closed');
      }
    });

    this.client.onReconnecting((error) => {
      console.warn('Game hub reconnecting...', error);
    });

    this.client.onReconnected((connectionId) => {
      console.log('Game hub reconnected:', connectionId);
    });
  }

  /**
   * Connect to the game hub
   */
  async connect(): Promise<void> {
    return this.client.connect();
  }

  /**
   * Disconnect from the game hub
   */
  async disconnect(): Promise<void> {
    return this.client.disconnect();
  }

  /**
   * Join a game room
   * @param roomId - ID of the room to join
   */
  async joinRoom(roomId: string): Promise<any> {
    return this.client.invoke('JoinRoom', roomId);
  }

  /**
   * Leave current game room
   * @param roomId - ID of the room to leave
   */
  async leaveRoom(roomId: string): Promise<void> {
    return this.client.invoke('LeaveRoom', roomId);
  }

  /**
   * Send player position update
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param rotation - Player rotation in degrees
   */
  async sendPosition(x: number, y: number, rotation: number): Promise<void> {
    return this.client.invoke('SendPosition', x, y, rotation);
  }

  /**
   * Set player ready status
   * @param isReady - Whether the player is ready
   */
  async setReady(isReady: boolean): Promise<void> {
    return this.client.invoke('SetReady', isReady);
  }

  // Event Subscriptions

  /**
   * Subscribe to player joined event
   * @param callback - Callback function called when a player joins
   */
  onPlayerJoined(callback: (player: GamePlayer) => void): void {
    this.client.on('PlayerJoined', callback);
  }

  /**
   * Subscribe to player left event
   * @param callback - Callback function called when a player leaves
   */
  onPlayerLeft(callback: (playerId: string) => void): void {
    this.client.on('PlayerLeft', callback);
  }

  /**
   * Subscribe to player moved event
   * @param callback - Callback function called when a player moves
   */
  onPlayerMoved(callback: (position: PositionData) => void): void {
    this.client.on('PlayerMoved', callback);
  }

  /**
   * Subscribe to player ready event
   * @param callback - Callback function called when a player changes ready status
   */
  onPlayerReady(callback: (playerId: string, isReady: boolean) => void): void {
    this.client.on('PlayerReady', callback);
  }

  /**
   * Subscribe to game starting event
   * @param callback - Callback function called when game is about to start
   */
  onGameStarting(callback: (countdown: number) => void): void {
    this.client.on('GameStarting', callback);
  }

  /**
   * Subscribe to game started event
   * @param callback - Callback function called when game has started
   */
  onGameStarted(callback: () => void): void {
    this.client.on('GameStarted', callback);
  }

  /**
   * Subscribe to game ended event
   * @param callback - Callback function called when game ends
   */
  onGameEnded(callback: (results: any) => void): void {
    this.client.on('GameEnded', callback);
  }

  // Event Unsubscriptions

  /**
   * Unsubscribe from player joined event
   */
  offPlayerJoined(callback?: (player: GamePlayer) => void): void {
    this.client.off('PlayerJoined', callback);
  }

  /**
   * Unsubscribe from player left event
   */
  offPlayerLeft(callback?: (playerId: string) => void): void {
    this.client.off('PlayerLeft', callback);
  }

  /**
   * Unsubscribe from player moved event
   */
  offPlayerMoved(callback?: (position: PositionData) => void): void {
    this.client.off('PlayerMoved', callback);
  }

  /**
   * Check if connected to game hub
   */
  isConnected(): boolean {
    return this.client.isConnected();
  }
}
