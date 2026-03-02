using GamePlatform.Game.Service.Models;

namespace GamePlatform.Game.Service.Services;

/// <summary>
/// Interface for logging game events
/// </summary>
public interface IEventLogger
{
    /// <summary>
    /// Log a game event
    /// </summary>
    Task LogEventAsync(Guid sessionId, Guid? playerId, GameEventType type, string action, object? data);

    /// <summary>
    /// Get all events for a session
    /// </summary>
    Task<IEnumerable<GameEvent>> GetSessionEventsAsync(Guid sessionId);

    /// <summary>
    /// Get events for a specific player
    /// </summary>
    Task<IEnumerable<GameEvent>> GetPlayerEventsAsync(Guid sessionId, Guid playerId);

    /// <summary>
    /// Get recent events for a session
    /// </summary>
    Task<IEnumerable<GameEvent>> GetRecentSessionEventsAsync(Guid sessionId, int count = 50);
}
