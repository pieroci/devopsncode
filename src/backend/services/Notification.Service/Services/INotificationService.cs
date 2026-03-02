using GamePlatform.Contracts.Common;
using GamePlatform.Notification.Service.Models;

namespace GamePlatform.Notification.Service.Services;

/// <summary>
/// Interface for notification management
/// </summary>
public interface INotificationService
{
    /// <summary>
    /// Create a new notification
    /// </summary>
    Task<ApiResponse<NotificationEntity>> CreateNotificationAsync(Guid userId, NotificationType type, 
        string title, string message, string? data = null);

    /// <summary>
    /// Get user notifications
    /// </summary>
    Task<ApiResponse<List<NotificationEntity>>> GetUserNotificationsAsync(Guid userId, int page = 1, int pageSize = 20);

    /// <summary>
    /// Mark notification as read
    /// </summary>
    Task<ApiResponse<NotificationEntity>> MarkAsReadAsync(Guid userId, Guid notificationId);

    /// <summary>
    /// Delete notification
    /// </summary>
    Task<ApiResponse<bool>> DeleteNotificationAsync(Guid userId, Guid notificationId);

    /// <summary>
    /// Get unread count for user
    /// </summary>
    Task<int> GetUnreadCountAsync(Guid userId);

    /// <summary>
    /// Mark all as read for user
    /// </summary>
    Task<ApiResponse<int>> MarkAllAsReadAsync(Guid userId);
}
