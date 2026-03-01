namespace GamePlatform.Notification.Service.Services;

/// <summary>
/// Interface for game-related notifications
/// </summary>
public interface IGameNotificationService
{
    /// <summary>
    /// Notify all players in a session
    /// </summary>
    Task NotifySessionAsync(Guid sessionId, string eventName, object data);

    /// <summary>
    /// Notify session that game started
    /// </summary>
    Task NotifySessionStartAsync(Guid sessionId, int playerCount);

    /// <summary>
    /// Notify session that a player joined
    /// </summary>
    Task NotifyPlayerJoinedAsync(Guid sessionId, Guid playerId, string username);

    /// <summary>
    /// Notify session that a player left
    /// </summary>
    Task NotifyPlayerLeftAsync(Guid sessionId, Guid playerId, string username);

    /// <summary>
    /// Broadcast player movement
    /// </summary>
    Task BroadcastPlayerMoveAsync(Guid sessionId, Guid playerId, float x, float y, float z, float rotation);

    /// <summary>
    /// Broadcast player attack
    /// </summary>
    Task BroadcastPlayerAttackAsync(Guid sessionId, Guid attackerId, Guid targetId, int damage, bool wasKill);

    /// <summary>
    /// Notify player of achievement
    /// </summary>
    Task NotifyPlayerKillAsync(Guid userId, Guid victimId, int scoreGained);

    /// <summary>
    /// Notify player of death
    /// </summary>
    Task NotifyPlayerDeathAsync(Guid userId, Guid attackerId);

    /// <summary>
    /// Notify player of score update
    /// </summary>
    Task NotifyScoreUpdateAsync(Guid sessionId, Guid playerId, int newScore);
}
