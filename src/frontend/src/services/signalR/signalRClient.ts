import * as signalR from '@microsoft/signalr';

/**
 * SignalR Client wrapper for real-time communication
 * Provides a clean interface for SignalR hub connections
 */
export class SignalRClient {
  private connection: signalR.HubConnection;

  constructor(hubUrl: string, accessToken?: string) {
    // Build SignalR connection
    const builder = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => accessToken || '',
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information);

    this.connection = builder.build();
  }

  /**
   * Connect to the SignalR hub
   */
  async connect(): Promise<void> {
    if (this.connection.state === signalR.HubConnectionState.Connected) {
      return;
    }

    try {
      await this.connection.start();
      console.log('SignalR connected successfully');
    } catch (error) {
      console.error('SignalR connection error:', error);
      throw error;
    }
  }

  /**
   * Disconnect from the SignalR hub
   */
  async disconnect(): Promise<void> {
    if (this.connection.state === signalR.HubConnectionState.Disconnected) {
      return;
    }

    try {
      await this.connection.stop();
      console.log('SignalR disconnected successfully');
    } catch (error) {
      console.error('SignalR disconnection error:', error);
      throw error;
    }
  }

  /**
   * Subscribe to a hub event
   * @param eventName - Name of the event to subscribe to
   * @param callback - Callback function to handle the event
   */
  on(eventName: string, callback: (...args: any[]) => void): void {
    this.connection.on(eventName, callback);
  }

  /**
   * Unsubscribe from a hub event
   * @param eventName - Name of the event to unsubscribe from
   * @param callback - Optional callback to remove (removes all if not provided)
   */
  off(eventName: string, callback?: (...args: any[]) => void): void {
    if (callback) {
      this.connection.off(eventName, callback);
    } else {
      this.connection.off(eventName);
    }
  }

  /**
   * Invoke a hub method
   * @param methodName - Name of the method to invoke
   * @param args - Arguments to pass to the method
   * @returns Promise resolving to the method result
   */
  async invoke<T = any>(methodName: string, ...args: any[]): Promise<T> {
    try {
      return await this.connection.invoke<T>(methodName, ...args);
    } catch (error) {
      console.error(`SignalR invoke error (${methodName}):`, error);
      throw error;
    }
  }

  /**
   * Get the current connection state
   */
  getConnectionState(): signalR.HubConnectionState {
    return this.connection.state;
  }

  /**
   * Check if the connection is currently connected
   */
  isConnected(): boolean {
    return this.connection.state === signalR.HubConnectionState.Connected;
  }

  /**
   * Register callback for connection closed event
   */
  onConnectionClosed(callback: (error?: Error) => void): void {
    this.connection.onclose(callback);
  }

  /**
   * Register callback for reconnecting event
   */
  onReconnecting(callback: (error?: Error) => void): void {
    this.connection.onreconnecting(callback);
  }

  /**
   * Register callback for reconnected event
   */
  onReconnected(callback: (connectionId?: string) => void): void {
    this.connection.onreconnected(callback);
  }
}
