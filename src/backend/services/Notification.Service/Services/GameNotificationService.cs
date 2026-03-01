using GamePlatform.Notification.Service.Hubs;
using GamePlatform.Notification.Service.Models;
using Microsoft.AspNetCore.SignalR;

namespace GamePlatform.Notification.Service.Services;

/// <summary>
/// Service for broadcasting game events via SignalR
/// </summary>
public class GameNotificationService : IGameNotificationService
{
    private readonly IHubContext<GameHub> _gameHub;
    private readonly INotificationService _notificationService;
    private readonly ILogger<GameNotificationService> _logger;

    public GameNotificationService(
        IHubContext<GameHub> gameHub,
        INotificationService notificationService,
        ILogger<GameNotificationService> logger)
    {
        _gameHub = gameHub;
        _notificationService = notificationService;
        _logger = logger;
    }

    public async Task NotifySessionAsync(Guid sessionId, string eventName, object data)
    {
        try
        {
            var groupName = $"session:{sessionId}";
            await _gameHub.Clients.Group(groupName).SendAsync(eventName, data);
            
            _logger.LogDebug("Sent {EventName} to session {SessionId}", eventName, sessionId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error notifying session {SessionId}", sessionId);
        }
    }

    public async Task NotifySessionStartAsync(Guid sessionId, int playerCount)
    {
        var data = new
        {
            SessionId = sessionId,
            PlayerCount = playerCount,
            Timestamp = DateTime.UtcNow
        };

        await NotifySessionAsync(sessionId, "SessionStarted", data);
        _logger.LogInformation("Session {SessionId} started with {PlayerCount} players", 
            sessionId, playerCount);
    }

    public async Task NotifyPlayerJoinedAsync(Guid sessionId, Guid playerId, string username)
    {
        var data = new
        {
            SessionId = sessionId,
            PlayerId = playerId,
            Username = username,
            Timestamp = DateTime.UtcNow
        };

        await NotifySessionAsync(sessionId, "PlayerJoinedSession", data);
        _logger.LogInformation("Player {Username} joined session {SessionId}", username, sessionId);
    }

    public async Task NotifyPlayerLeftAsync(Guid sessionId, Guid playerId, string username)
    {
        var data = new
        {
            SessionId = sessionId,
            PlayerId = playerId,
            Username = username,
            Timestamp = DateTime.UtcNow
        };

        await NotifySessionAsync(sessionId, "PlayerLeftSession", data);
        _logger.LogInformation("Player {Username} left session {SessionId}", username, sessionId);
    }

    public async Task BroadcastPlayerMoveAsync(Guid sessionId, Guid playerId, 
        float x, float y, float z, float rotation)
    {
        var data = new
        {
            PlayerId = playerId,
            Position = new { X = x, Y = y, Z = z },
            Rotation = rotation,
            Timestamp = DateTime.UtcNow
        };

        await NotifySessionAsync(sessionId, "ReceiveGameUpdate", data);
    }

    public async Task BroadcastPlayerAttackAsync(Guid sessionId, Guid attackerId, 
        Guid targetId, int damage, bool wasKill)
    {
        var data = new
        {
            AttackerId = attackerId,
            TargetId = targetId,
            Damage = damage,
            WasKill = wasKill,
            Timestamp = DateTime.UtcNow
        };

        await NotifySessionAsync(sessionId, "ReceivePlayerAction", data);
        
        if (wasKill)
        {
            _logger.LogInformation("Player {AttackerId} killed {TargetId} in session {SessionId}", 
                attackerId, targetId, sessionId);
        }
    }

    public async Task NotifyPlayerKillAsync(Guid userId, Guid victimId, int scoreGained)
    {
        try
        {
            // Create persistent notification
            await _notificationService.CreateNotificationAsync(
                userId,
                NotificationType.PlayerKilled,
                "Player Eliminated!",
                $"You eliminated a player and earned {scoreGained} points!",
                System.Text.Json.JsonSerializer.Serialize(new { victimId, scoreGained })
            );

            _logger.LogInformation("Player {UserId} got kill notification", userId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error notifying player kill");
        }
    }

    public async Task NotifyPlayerDeathAsync(Guid userId, Guid attackerId)
    {
        try
        {
            // Create persistent notification
            await _notificationService.CreateNotificationAsync(
                userId,
                NotificationType.PlayerDied,
                "You were eliminated",
                "You were eliminated by another player. Respawn to continue!",
                System.Text.Json.JsonSerializer.Serialize(new { attackerId })
            );

            _logger.LogInformation("Player {UserId} got death notification", userId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error notifying player death");
        }
    }

    public async Task NotifyScoreUpdateAsync(Guid sessionId, Guid playerId, int newScore)
    {
        var data = new
        {
            PlayerId = playerId,
            Score = newScore,
            Timestamp = DateTime.UtcNow
        };

        await NotifySessionAsync(sessionId, "ReceiveGameUpdate", data);
    }
}
