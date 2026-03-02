using GamePlatform.Notification.Service.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace GamePlatform.Notification.Service.Hubs;

/// <summary>
/// SignalR hub for general notifications
/// </summary>
[Authorize]
public class NotificationHub : Hub
{
    private readonly IConnectionManager _connectionManager;
    private readonly INotificationService _notificationService;
    private readonly ILogger<NotificationHub> _logger;

    public NotificationHub(
        IConnectionManager connectionManager,
        INotificationService notificationService,
        ILogger<NotificationHub> logger)
    {
        _connectionManager = connectionManager;
        _notificationService = notificationService;
        _logger = logger;
    }

    public override async Task OnConnectedAsync()
    {
        var userId = GetUserId();
        if (userId.HasValue)
        {
            await _connectionManager.AddConnectionAsync(userId.Value, Context.ConnectionId);
            
            // Send unread count on connect
            var unreadCount = await _notificationService.GetUnreadCountAsync(userId.Value);
            await Clients.Caller.SendAsync("UnreadCountChanged", unreadCount);
            
            _logger.LogInformation("User {UserId} connected to NotificationHub", userId.Value);
        }
        
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = GetUserId();
        if (userId.HasValue)
        {
            await _connectionManager.RemoveConnectionAsync(userId.Value, Context.ConnectionId);
            _logger.LogInformation("User {UserId} disconnected from NotificationHub", userId.Value);
        }
        
        await base.OnDisconnectedAsync(exception);
    }

    /// <summary>
    /// Mark a notification as read
    /// </summary>
    public async Task MarkAsRead(Guid notificationId)
    {
        var userId = GetUserId();
        if (!userId.HasValue)
        {
            _logger.LogWarning("Anonymous user attempted to mark notification as read");
            return;
        }

        await _notificationService.MarkAsReadAsync(userId.Value, notificationId);
        
        // Send updated unread count
        var unreadCount = await _notificationService.GetUnreadCountAsync(userId.Value);
        await Clients.Caller.SendAsync("UnreadCountChanged", unreadCount);
        
        _logger.LogDebug("User {UserId} marked notification {NotificationId} as read", 
            userId.Value, notificationId);
    }

    /// <summary>
    /// Get current unread count
    /// </summary>
    public async Task<int> GetUnreadCount()
    {
        var userId = GetUserId();
        if (!userId.HasValue) return 0;

        return await _notificationService.GetUnreadCountAsync(userId.Value);
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
