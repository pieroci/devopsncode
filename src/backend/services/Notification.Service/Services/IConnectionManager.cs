namespace GamePlatform.Notification.Service.Services;

/// <summary>
/// Interface for managing SignalR connections
/// </summary>
public interface IConnectionManager
{
    /// <summary>
    /// Add a connection for a user
    /// </summary>
    Task AddConnectionAsync(Guid userId, string connectionId);

    /// <summary>
    /// Remove a connection for a user
    /// </summary>
    Task RemoveConnectionAsync(Guid userId, string connectionId);

    /// <summary>
    /// Get all connection IDs for a user
    /// </summary>
    Task<List<string>> GetUserConnectionsAsync(Guid userId);

    /// <summary>
    /// Check if user is online (has any connections)
    /// </summary>
    Task<bool> IsUserOnlineAsync(Guid userId);

    /// <summary>
    /// Clean up stale connections
    /// </summary>
    Task CleanupStaleConnectionsAsync(TimeSpan maxAge);
}
