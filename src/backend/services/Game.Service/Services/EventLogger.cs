using GamePlatform.Game.Service.Data;
using GamePlatform.Game.Service.Models;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace GamePlatform.Game.Service.Services;

/// <summary>
/// Service for logging game events
/// </summary>
public class EventLogger : IEventLogger
{
    private readonly GameDbContext _context;
    private readonly ILogger<EventLogger> _logger;

    public EventLogger(GameDbContext context, ILogger<EventLogger> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task LogEventAsync(Guid sessionId, Guid? playerId, GameEventType type, string action, object? data)
    {
        try
        {
            var gameEvent = new GameEvent
            {
                Id = Guid.NewGuid(),
                SessionId = sessionId,
                PlayerId = playerId,
                Type = type,
                Action = action,
                Data = data != null ? JsonSerializer.Serialize(data) : string.Empty,
                OccurredAt = DateTime.UtcNow
            };

            _context.GameEvents.Add(gameEvent);
            await _context.SaveChangesAsync();

            _logger.LogDebug("Logged event {EventType} for session {SessionId}", type, sessionId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error logging event {EventType} for session {SessionId}", type, sessionId);
        }
    }

    public async Task<IEnumerable<GameEvent>> GetSessionEventsAsync(Guid sessionId)
    {
        try
        {
            return await _context.GameEvents
                .Where(e => e.SessionId == sessionId)
                .OrderBy(e => e.OccurredAt)
                .ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving events for session {SessionId}", sessionId);
            return Enumerable.Empty<GameEvent>();
        }
    }

    public async Task<IEnumerable<GameEvent>> GetPlayerEventsAsync(Guid sessionId, Guid playerId)
    {
        try
        {
            return await _context.GameEvents
                .Where(e => e.SessionId == sessionId && e.PlayerId == playerId)
                .OrderBy(e => e.OccurredAt)
                .ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving events for player {PlayerId} in session {SessionId}", playerId, sessionId);
            return Enumerable.Empty<GameEvent>();
        }
    }

    public async Task<IEnumerable<GameEvent>> GetRecentSessionEventsAsync(Guid sessionId, int count = 50)
    {
        try
        {
            return await _context.GameEvents
                .Where(e => e.SessionId == sessionId)
                .OrderByDescending(e => e.OccurredAt)
                .Take(count)
                .ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving recent events for session {SessionId}", sessionId);
            return Enumerable.Empty<GameEvent>();
        }
    }
}
