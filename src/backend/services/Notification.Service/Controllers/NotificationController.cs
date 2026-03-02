using GamePlatform.Contracts.Common;
using GamePlatform.Notification.Service.Models;
using GamePlatform.Notification.Service.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace GamePlatform.Notification.Service.Controllers;

/// <summary>
/// REST API controller for notifications
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
[Authorize]
public class NotificationController : ControllerBase
{
    private readonly INotificationService _notificationService;
    private readonly ILogger<NotificationController> _logger;

    public NotificationController(
        INotificationService notificationService,
        ILogger<NotificationController> logger)
    {
        _notificationService = notificationService;
        _logger = logger;
    }

    /// <summary>
    /// Health check endpoint
    /// </summary>
    [HttpGet("health")]
    [AllowAnonymous]
    public IActionResult Health()
    {
        return Ok(new
        {
            status = "healthy",
            service = "Notification.Service",
            signalr = "enabled",
            timestamp = DateTime.UtcNow
        });
    }

    /// <summary>
    /// Get user notifications (paginated)
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetNotifications([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var userId = GetUserIdFromClaims();
        if (userId == Guid.Empty)
        {
            return Unauthorized("Invalid user");
        }

        var result = await _notificationService.GetUserNotificationsAsync(userId, page, pageSize);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get unread notification count
    /// </summary>
    [HttpGet("unread-count")]
    public async Task<IActionResult> GetUnreadCount()
    {
        var userId = GetUserIdFromClaims();
        if (userId == Guid.Empty)
        {
            return Unauthorized("Invalid user");
        }

        var count = await _notificationService.GetUnreadCountAsync(userId);
        return Ok(new { count, userId, timestamp = DateTime.UtcNow });
    }

    /// <summary>
    /// Mark notification as read
    /// </summary>
    [HttpPut("{notificationId}/read")]
    public async Task<IActionResult> MarkAsRead(Guid notificationId)
    {
        var userId = GetUserIdFromClaims();
        if (userId == Guid.Empty)
        {
            return Unauthorized("Invalid user");
        }

        var result = await _notificationService.MarkAsReadAsync(userId, notificationId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Mark all notifications as read
    /// </summary>
    [HttpPut("mark-all-read")]
    public async Task<IActionResult> MarkAllAsRead()
    {
        var userId = GetUserIdFromClaims();
        if (userId == Guid.Empty)
        {
            return Unauthorized("Invalid user");
        }

        var result = await _notificationService.MarkAllAsReadAsync(userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Delete a notification
    /// </summary>
    [HttpDelete("{notificationId}")]
    public async Task<IActionResult> DeleteNotification(Guid notificationId)
    {
        var userId = GetUserIdFromClaims();
        if (userId == Guid.Empty)
        {
            return Unauthorized("Invalid user");
        }

        var result = await _notificationService.DeleteNotificationAsync(userId, notificationId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Test notification endpoint (for development/testing)
    /// </summary>
    [HttpPost("test")]
    public async Task<IActionResult> TestNotification([FromBody] TestNotificationRequest request)
    {
        var userId = GetUserIdFromClaims();
        if (userId == Guid.Empty)
        {
            return Unauthorized("Invalid user");
        }

        var result = await _notificationService.CreateNotificationAsync(
            userId,
            NotificationType.System,
            request.Title,
            request.Message
        );

        return result.Success ? Ok(result) : BadRequest(result);
    }

    private Guid GetUserIdFromClaims()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            return Guid.Empty;
        }
        return userId;
    }
}

/// <summary>
/// Request for test notification
/// </summary>
public class TestNotificationRequest
{
    public string Title { get; set; } = "Test Notification";
    public string Message { get; set; } = "This is a test notification";
}
