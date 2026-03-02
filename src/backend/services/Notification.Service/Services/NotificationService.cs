using GamePlatform.Contracts.Common;
using GamePlatform.Notification.Service.Data;
using GamePlatform.Notification.Service.Models;
using Microsoft.EntityFrameworkCore;

namespace GamePlatform.Notification.Service.Services;

/// <summary>
/// Service for managing notifications
/// </summary>
public class NotificationService : INotificationService
{
    private readonly NotificationDbContext _context;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(NotificationDbContext context, ILogger<NotificationService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<ApiResponse<NotificationEntity>> CreateNotificationAsync(Guid userId, NotificationType type, 
        string title, string message, string? data = null)
    {
        try
        {
            var notification = new NotificationEntity
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Type = type,
                Title = title,
                Message = message,
                Data = data,
                IsRead = false,
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddDays(30)
            };

            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Created notification {NotificationId} for user {UserId}", 
                notification.Id, userId);

            return ApiResponse<NotificationEntity>.SuccessResponse(notification, "Notification created");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating notification for user {UserId}", userId);
            return ApiResponse<NotificationEntity>.ErrorResponse("Failed to create notification", 
                new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<List<NotificationEntity>>> GetUserNotificationsAsync(Guid userId, int page = 1, int pageSize = 20)
    {
        try
        {
            var notifications = await _context.Notifications
                .Where(n => n.UserId == userId && (n.ExpiresAt == null || n.ExpiresAt > DateTime.UtcNow))
                .OrderByDescending(n => n.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return ApiResponse<List<NotificationEntity>>.SuccessResponse(notifications);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting notifications for user {UserId}", userId);
            return ApiResponse<List<NotificationEntity>>.ErrorResponse("Failed to get notifications", 
                new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<NotificationEntity>> MarkAsReadAsync(Guid userId, Guid notificationId)
    {
        try
        {
            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);

            if (notification == null)
            {
                return ApiResponse<NotificationEntity>.ErrorResponse("Notification not found", 
                    new List<string> { "Notification does not exist or does not belong to user" });
            }

            notification.IsRead = true;
            notification.ReadAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return ApiResponse<NotificationEntity>.SuccessResponse(notification, "Notification marked as read");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error marking notification as read");
            return ApiResponse<NotificationEntity>.ErrorResponse("Failed to mark as read", 
                new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<bool>> DeleteNotificationAsync(Guid userId, Guid notificationId)
    {
        try
        {
            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);

            if (notification == null)
            {
                return ApiResponse<bool>.ErrorResponse("Notification not found", 
                    new List<string> { "Notification does not exist or does not belong to user" });
            }

            _context.Notifications.Remove(notification);
            await _context.SaveChangesAsync();

            return ApiResponse<bool>.SuccessResponse(true, "Notification deleted");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting notification");
            return ApiResponse<bool>.ErrorResponse("Failed to delete notification", 
                new List<string> { ex.Message });
        }
    }

    public async Task<int> GetUnreadCountAsync(Guid userId)
    {
        try
        {
            return await _context.Notifications
                .Where(n => n.UserId == userId && !n.IsRead && 
                           (n.ExpiresAt == null || n.ExpiresAt > DateTime.UtcNow))
                .CountAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting unread count for user {UserId}", userId);
            return 0;
        }
    }

    public async Task<ApiResponse<int>> MarkAllAsReadAsync(Guid userId)
    {
        try
        {
            var unreadNotifications = await _context.Notifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .ToListAsync();

            foreach (var notification in unreadNotifications)
            {
                notification.IsRead = true;
                notification.ReadAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            return ApiResponse<int>.SuccessResponse(unreadNotifications.Count, 
                $"Marked {unreadNotifications.Count} notifications as read");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error marking all as read for user {UserId}", userId);
            return ApiResponse<int>.ErrorResponse("Failed to mark all as read", 
                new List<string> { ex.Message });
        }
    }
}
