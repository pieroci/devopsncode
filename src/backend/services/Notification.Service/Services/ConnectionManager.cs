using GamePlatform.Infrastructure.Redis;
using GamePlatform.Notification.Service.Data;
using GamePlatform.Notification.Service.Models;
using Microsoft.EntityFrameworkCore;

namespace GamePlatform.Notification.Service.Services;

/// <summary>
/// Manages SignalR connections using Redis and database
/// </summary>
public class ConnectionManager : IConnectionManager
{
    private readonly NotificationDbContext _context;
    private readonly IRedisCacheService _cache;
    private readonly ILogger<ConnectionManager> _logger;
    private const string CONNECTION_PREFIX = "notification:connection:";

    public ConnectionManager(
        NotificationDbContext context,
        IRedisCacheService cache,
        ILogger<ConnectionManager> logger)
    {
        _context = context;
        _cache = cache;
        _logger = logger;
    }

    public async Task AddConnectionAsync(Guid userId, string connectionId)
    {
        try
        {
            // Add to database
            var connection = new UserConnection
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                ConnectionId = connectionId,
                ConnectedAt = DateTime.UtcNow,
                LastActivityAt = DateTime.UtcNow
            };

            _context.UserConnections.Add(connection);
            await _context.SaveChangesAsync();

            // Add to Redis for fast lookup
            var cacheKey = $"{CONNECTION_PREFIX}{userId}";
            var connections = await GetUserConnectionsAsync(userId);
            connections.Add(connectionId);
            await _cache.SetAsync(cacheKey, connections, TimeSpan.FromHours(24));

            _logger.LogInformation("Added connection {ConnectionId} for user {UserId}", connectionId, userId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding connection for user {UserId}", userId);
        }
    }

    public async Task RemoveConnectionAsync(Guid userId, string connectionId)
    {
        try
        {
            // Remove from database
            var connection = await _context.UserConnections
                .FirstOrDefaultAsync(c => c.UserId == userId && c.ConnectionId == connectionId);

            if (connection != null)
            {
                _context.UserConnections.Remove(connection);
                await _context.SaveChangesAsync();
            }

            // Update Redis cache
            var cacheKey = $"{CONNECTION_PREFIX}{userId}";
            var connections = await GetUserConnectionsAsync(userId);
            connections.Remove(connectionId);
            
            if (connections.Any())
            {
                await _cache.SetAsync(cacheKey, connections, TimeSpan.FromHours(24));
            }
            else
            {
                await _cache.DeleteAsync(cacheKey);
            }

            _logger.LogInformation("Removed connection {ConnectionId} for user {UserId}", connectionId, userId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing connection for user {UserId}", userId);
        }
    }

    public async Task<List<string>> GetUserConnectionsAsync(Guid userId)
    {
        try
        {
            // Try Redis first
            var cacheKey = $"{CONNECTION_PREFIX}{userId}";
            var cachedConnections = await _cache.GetAsync<List<string>>(cacheKey);
            if (cachedConnections != null && cachedConnections.Any())
            {
                return cachedConnections;
            }

            // Fall back to database
            var connections = await _context.UserConnections
                .Where(c => c.UserId == userId)
                .Select(c => c.ConnectionId)
                .ToListAsync();

            if (connections.Any())
            {
                await _cache.SetAsync(cacheKey, connections, TimeSpan.FromHours(24));
            }

            return connections;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting connections for user {UserId}", userId);
            return new List<string>();
        }
    }

    public async Task<bool> IsUserOnlineAsync(Guid userId)
    {
        var connections = await GetUserConnectionsAsync(userId);
        return connections.Any();
    }

    public async Task CleanupStaleConnectionsAsync(TimeSpan maxAge)
    {
        try
        {
            var cutoffTime = DateTime.UtcNow.Subtract(maxAge);
            var staleConnections = await _context.UserConnections
                .Where(c => c.LastActivityAt < cutoffTime)
                .ToListAsync();

            if (staleConnections.Any())
            {
                _context.UserConnections.RemoveRange(staleConnections);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Cleaned up {Count} stale connections", staleConnections.Count);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error cleaning up stale connections");
        }
    }
}
