using GamePlatform.Contracts.Common;
using GamePlatform.Infrastructure.Redis;
using GamePlatform.Match.Service.Data;
using GamePlatform.Match.Service.Models;
using Microsoft.EntityFrameworkCore;

namespace GamePlatform.Match.Service.Services;

/// <summary>
/// Interface for leaderboard operations
/// </summary>
public interface ILeaderboardService
{
    Task<ApiResponse<List<LeaderboardEntry>>> GetGlobalLeaderboardAsync(int top = 100);
    Task<ApiResponse<LeaderboardEntry>> GetPlayerRankAsync(Guid playerId);
    Task<ApiResponse<bool>> RefreshLeaderboardAsync();
}

/// <summary>
/// Service for managing leaderboards
/// </summary>
public class LeaderboardService : ILeaderboardService
{
    private readonly MatchDbContext _context;
    private readonly IRedisCacheService _cache;
    private readonly ILogger<LeaderboardService> _logger;
    private const string LEADERBOARD_KEY = "leaderboard:global";
    private const int CACHE_MINUTES = 5;

    public LeaderboardService(
        MatchDbContext context,
        IRedisCacheService cache,
        ILogger<LeaderboardService> logger)
    {
        _context = context;
        _cache = cache;
        _logger = logger;
    }

    public async Task<ApiResponse<List<LeaderboardEntry>>> GetGlobalLeaderboardAsync(int top = 100)
    {
        try
        {
            // Try to get from cache first
            var cached = await _cache.GetAsync<List<LeaderboardEntry>>(LEADERBOARD_KEY);
            if (cached != null && cached.Any())
            {
                _logger.LogDebug("Returning cached leaderboard");
                return ApiResponse<List<LeaderboardEntry>>.SuccessResponse(cached.Take(top).ToList());
            }

            // Build from database
            var leaderboard = await BuildLeaderboardAsync(top);

            // Cache for 5 minutes
            await _cache.SetAsync(LEADERBOARD_KEY, leaderboard, TimeSpan.FromMinutes(CACHE_MINUTES));

            return ApiResponse<List<LeaderboardEntry>>.SuccessResponse(leaderboard);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting global leaderboard");
            return ApiResponse<List<LeaderboardEntry>>.ErrorResponse("Failed to get leaderboard", 
                new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<LeaderboardEntry>> GetPlayerRankAsync(Guid playerId)
    {
        try
        {
            var playerElo = await _context.PlayerElos
                .FirstOrDefaultAsync(e => e.PlayerId == playerId);

            if (playerElo == null)
            {
                return ApiResponse<LeaderboardEntry>.ErrorResponse("Player not found", 
                    new List<string> { "Player has no competitive stats" });
            }

            // Calculate rank
            var rank = await _context.PlayerElos
                .CountAsync(e => e.CurrentElo > playerElo.CurrentElo) + 1;

            var entry = new LeaderboardEntry
            {
                Rank = rank,
                PlayerId = playerElo.PlayerId,
                Elo = playerElo.CurrentElo,
                RankTier = playerElo.Rank,
                GamesPlayed = playerElo.GamesPlayed,
                Wins = playerElo.Wins,
                Losses = playerElo.Losses,
                WinRate = playerElo.GamesPlayed > 0 
                    ? (double)playerElo.Wins / playerElo.GamesPlayed * 100 
                    : 0,
                WinStreak = playerElo.WinStreak
            };

            return ApiResponse<LeaderboardEntry>.SuccessResponse(entry);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting player rank for {PlayerId}", playerId);
            return ApiResponse<LeaderboardEntry>.ErrorResponse("Failed to get player rank", 
                new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<bool>> RefreshLeaderboardAsync()
    {
        try
        {
            var leaderboard = await BuildLeaderboardAsync(100);
            await _cache.SetAsync(LEADERBOARD_KEY, leaderboard, TimeSpan.FromMinutes(CACHE_MINUTES));

            _logger.LogInformation("Refreshed global leaderboard with {Count} entries", leaderboard.Count);

            return ApiResponse<bool>.SuccessResponse(true, "Leaderboard refreshed");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error refreshing leaderboard");
            return ApiResponse<bool>.ErrorResponse("Failed to refresh leaderboard", 
                new List<string> { ex.Message });
        }
    }

    private async Task<List<LeaderboardEntry>> BuildLeaderboardAsync(int top)
    {
        var topPlayers = await _context.PlayerElos
            .OrderByDescending(e => e.CurrentElo)
            .Take(top)
            .ToListAsync();

        var leaderboard = new List<LeaderboardEntry>();
        int rank = 1;

        foreach (var player in topPlayers)
        {
            var entry = new LeaderboardEntry
            {
                Rank = rank++,
                PlayerId = player.PlayerId,
                Elo = player.CurrentElo,
                RankTier = player.Rank,
                GamesPlayed = player.GamesPlayed,
                Wins = player.Wins,
                Losses = player.Losses,
                WinRate = player.GamesPlayed > 0 
                    ? (double)player.Wins / player.GamesPlayed * 100 
                    : 0,
                WinStreak = player.WinStreak
            };

            leaderboard.Add(entry);
        }

        return leaderboard;
    }
}

/// <summary>
/// Leaderboard entry DTO
/// </summary>
public class LeaderboardEntry
{
    public int Rank { get; set; }
    public Guid PlayerId { get; set; }
    public int Elo { get; set; }
    public string RankTier { get; set; } = string.Empty;
    public int GamesPlayed { get; set; }
    public int Wins { get; set; }
    public int Losses { get; set; }
    public double WinRate { get; set; }
    public int WinStreak { get; set; }
}
