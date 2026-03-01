using GamePlatform.Contracts.Common;
using GamePlatform.Infrastructure.Redis;
using GamePlatform.Match.Service.Data;
using GamePlatform.Match.Service.Models;
using Microsoft.EntityFrameworkCore;

namespace GamePlatform.Match.Service.Services;

/// <summary>
/// Interface for matchmaking operations
/// </summary>
public interface IMatchmakingService
{
    Task<ApiResponse<MatchQueue>> JoinQueueAsync(Guid playerId, GameMode mode, int currentElo);
    Task<ApiResponse<bool>> LeaveQueueAsync(Guid playerId);
    Task<ApiResponse<QueueStatusDto>> GetQueueStatusAsync(Guid playerId);
    Task<List<MatchQueue>> FindPotentialMatchesAsync(GameMode mode, int playerCount);
    Task<int> GetQueueSizeAsync(GameMode mode);
}

/// <summary>
/// Service for managing matchmaking queue
/// </summary>
public class MatchmakingService : IMatchmakingService
{
    private readonly MatchDbContext _context;
    private readonly IRedisCacheService _cache;
    private readonly ILogger<MatchmakingService> _logger;
    private const string QUEUE_PREFIX = "matchmaking:queue:";
    private const int ELO_RANGE = 200;
    private const int MAX_WAIT_MINUTES = 5;

    public MatchmakingService(
        MatchDbContext context,
        IRedisCacheService cache,
        ILogger<MatchmakingService> logger)
    {
        _context = context;
        _cache = cache;
        _logger = logger;
    }

    public async Task<ApiResponse<MatchQueue>> JoinQueueAsync(Guid playerId, GameMode mode, int currentElo)
    {
        try
        {
            // Check if player already in queue
            var existing = await _context.MatchQueues
                .FirstOrDefaultAsync(q => q.PlayerId == playerId && q.Status == QueueStatus.Waiting);

            if (existing != null)
            {
                return ApiResponse<MatchQueue>.ErrorResponse("Already in queue", 
                    new List<string> { "Player is already waiting in matchmaking queue" });
            }

            var queueEntry = new MatchQueue
            {
                Id = Guid.NewGuid(),
                PlayerId = playerId,
                CurrentElo = currentElo,
                PreferredMode = mode,
                JoinedAt = DateTime.UtcNow,
                Status = QueueStatus.Waiting
            };

            _context.MatchQueues.Add(queueEntry);
            await _context.SaveChangesAsync();

            // Add to Redis for fast matching
            var cacheKey = $"{QUEUE_PREFIX}{mode}";
            await _cache.SetAsync($"{cacheKey}:{playerId}", queueEntry, TimeSpan.FromMinutes(10));

            _logger.LogInformation("Player {PlayerId} joined queue for {Mode} with ELO {Elo}", 
                playerId, mode, currentElo);

            return ApiResponse<MatchQueue>.SuccessResponse(queueEntry, "Joined matchmaking queue");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error joining queue for player {PlayerId}", playerId);
            return ApiResponse<MatchQueue>.ErrorResponse("Failed to join queue", 
                new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<bool>> LeaveQueueAsync(Guid playerId)
    {
        try
        {
            var queueEntry = await _context.MatchQueues
                .FirstOrDefaultAsync(q => q.PlayerId == playerId && q.Status == QueueStatus.Waiting);

            if (queueEntry == null)
            {
                return ApiResponse<bool>.ErrorResponse("Not in queue", 
                    new List<string> { "Player is not in matchmaking queue" });
            }

            queueEntry.Status = QueueStatus.Cancelled;
            await _context.SaveChangesAsync();

            // Remove from Redis
            var cacheKey = $"{QUEUE_PREFIX}{queueEntry.PreferredMode}:{playerId}";
            await _cache.DeleteAsync(cacheKey);

            _logger.LogInformation("Player {PlayerId} left queue", playerId);

            return ApiResponse<bool>.SuccessResponse(true, "Left matchmaking queue");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error leaving queue for player {PlayerId}", playerId);
            return ApiResponse<bool>.ErrorResponse("Failed to leave queue", 
                new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<QueueStatusDto>> GetQueueStatusAsync(Guid playerId)
    {
        try
        {
            var queueEntry = await _context.MatchQueues
                .FirstOrDefaultAsync(q => q.PlayerId == playerId && q.Status == QueueStatus.Waiting);

            if (queueEntry == null)
            {
                return ApiResponse<QueueStatusDto>.ErrorResponse("Not in queue", 
                    new List<string> { "Player is not in matchmaking queue" });
            }

            var waitTime = DateTime.UtcNow - queueEntry.JoinedAt;
            var queueSize = await GetQueueSizeAsync(queueEntry.PreferredMode);
            
            var status = new QueueStatusDto
            {
                PlayerId = playerId,
                Mode = queueEntry.PreferredMode,
                WaitTimeSeconds = (int)waitTime.TotalSeconds,
                QueueSize = queueSize,
                EstimatedWaitSeconds = CalculateEstimatedWait(queueSize, queueEntry.PreferredMode)
            };

            return ApiResponse<QueueStatusDto>.SuccessResponse(status);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting queue status for player {PlayerId}", playerId);
            return ApiResponse<QueueStatusDto>.ErrorResponse("Failed to get queue status", 
                new List<string> { ex.Message });
        }
    }

    public async Task<List<MatchQueue>> FindPotentialMatchesAsync(GameMode mode, int playerCount)
    {
        try
        {
            var waitingPlayers = await _context.MatchQueues
                .Where(q => q.PreferredMode == mode && q.Status == QueueStatus.Waiting)
                .OrderBy(q => q.JoinedAt)
                .Take(playerCount * 2) // Get more than needed for better matching
                .ToListAsync();

            if (waitingPlayers.Count < playerCount)
            {
                return new List<MatchQueue>();
            }

            // Group players by similar ELO
            var matches = new List<MatchQueue>();
            var used = new HashSet<Guid>();

            foreach (var player in waitingPlayers.OrderBy(p => p.CurrentElo))
            {
                if (used.Contains(player.PlayerId)) continue;

                var similarPlayers = waitingPlayers
                    .Where(p => !used.Contains(p.PlayerId) && 
                               Math.Abs(p.CurrentElo - player.CurrentElo) <= ELO_RANGE)
                    .Take(playerCount)
                    .ToList();

                if (similarPlayers.Count >= playerCount)
                {
                    matches.AddRange(similarPlayers);
                    foreach (var p in similarPlayers)
                    {
                        used.Add(p.PlayerId);
                    }
                    
                    if (matches.Count >= playerCount)
                    {
                        return matches.Take(playerCount).ToList();
                    }
                }
            }

            return matches.Take(playerCount).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error finding potential matches for {Mode}", mode);
            return new List<MatchQueue>();
        }
    }

    public async Task<int> GetQueueSizeAsync(GameMode mode)
    {
        return await _context.MatchQueues
            .CountAsync(q => q.PreferredMode == mode && q.Status == QueueStatus.Waiting);
    }

    private int CalculateEstimatedWait(int queueSize, GameMode mode)
    {
        var playersNeeded = (int)mode * 2; // mode enum value is players per team
        if (queueSize >= playersNeeded) return 5; // Very soon
        
        // Rough estimate based on queue size
        return 30 + (playersNeeded - queueSize) * 20;
    }
}

/// <summary>
/// DTO for queue status response
/// </summary>
public class QueueStatusDto
{
    public Guid PlayerId { get; set; }
    public GameMode Mode { get; set; }
    public int WaitTimeSeconds { get; set; }
    public int QueueSize { get; set; }
    public int EstimatedWaitSeconds { get; set; }
}
