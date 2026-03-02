using GamePlatform.Notification.Service.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace GamePlatform.Notification.Service.Hubs;

/// <summary>
/// SignalR hub for real-time game updates
/// </summary>
[Authorize]
public class GameHub : Hub
{
    private readonly IConnectionManager _connectionManager;
    private readonly ILogger<GameHub> _logger;

    public GameHub(IConnectionManager connectionManager, ILogger<GameHub> logger)
    {
        _connectionManager = connectionManager;
        _logger = logger;
    }

    public override async Task OnConnectedAsync()
    {
        var userId = GetUserId();
        if (userId.HasValue)
        {
            await _connectionManager.AddConnectionAsync(userId.Value, Context.ConnectionId);
            _logger.LogInformation("User {UserId} connected to GameHub with connection {ConnectionId}", 
                userId.Value, Context.ConnectionId);
        }
        
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = GetUserId();
        if (userId.HasValue)
        {
            await _connectionManager.RemoveConnectionAsync(userId.Value, Context.ConnectionId);
            _logger.LogInformation("User {UserId} disconnected from GameHub", userId.Value);
        }
        
        await base.OnDisconnectedAsync(exception);
    }

    /// <summary>
    /// Join a game session group
    /// </summary>
    public async Task JoinGameSession(Guid sessionId)
    {
        var userId = GetUserId();
        if (!userId.HasValue)
        {
            _logger.LogWarning("Anonymous user attempted to join game session");
            return;
        }

        var groupName = $"session:{sessionId}";
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
        
        _logger.LogInformation("User {UserId} joined game session {SessionId}", userId.Value, sessionId);
        
        // Notify others in the group
        await Clients.OthersInGroup(groupName).SendAsync("PlayerJoinedSession", new
        {
            UserId = userId.Value,
            SessionId = sessionId,
            Timestamp = DateTime.UtcNow
        });
    }

    /// <summary>
    /// Leave a game session group
    /// </summary>
    public async Task LeaveGameSession(Guid sessionId)
    {
        var userId = GetUserId();
        if (!userId.HasValue) return;

        var groupName = $"session:{sessionId}";
        
        // Notify others before leaving
        await Clients.OthersInGroup(groupName).SendAsync("PlayerLeftSession", new
        {
            UserId = userId.Value,
            SessionId = sessionId,
            Timestamp = DateTime.UtcNow
        });
        
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
        
        _logger.LogInformation("User {UserId} left game session {SessionId}", userId.Value, sessionId);
    }

    private Guid? GetUserId()
    {
        var userIdClaim = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            return null;
        }
        return userId;
    }
}
