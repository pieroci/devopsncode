using GamePlatform.Contracts.Common;
using GamePlatform.Match.Service.Data;
using GamePlatform.Match.Service.Models;
using Microsoft.EntityFrameworkCore;

namespace GamePlatform.Match.Service.Services;

/// <summary>
/// Interface for match management operations
/// </summary>
public interface IMatchService
{
    Task<ApiResponse<MatchEntity>> CreateMatchAsync(Guid worldId, List<Guid> playerIds, List<int> playerElos);
    Task<ApiResponse<MatchEntity>> GetMatchAsync(Guid matchId);
    Task<ApiResponse<MatchEntity>> StartMatchAsync(Guid matchId);
    Task<ApiResponse<MatchEntity>> EndMatchAsync(Guid matchId, EndMatchRequest request);
    Task<ApiResponse<List<MatchEntity>>> GetActiveMatchesAsync(Guid? worldId = null);
    Task<ApiResponse<List<MatchEntity>>> GetMatchHistoryAsync(Guid playerId, int page = 1, int pageSize = 10);
}

/// <summary>
/// Service for managing match lifecycle
/// </summary>
public class MatchService : IMatchService
{
    private readonly MatchDbContext _context;
    private readonly IEloService _eloService;
    private readonly ILogger<MatchService> _logger;

    public MatchService(
        MatchDbContext context,
        IEloService _eloService,
        ILogger<MatchService> logger)
    {
        _context = context;
        this._eloService = _eloService;
        _logger = logger;
    }

    public async Task<ApiResponse<MatchEntity>> CreateMatchAsync(Guid worldId, List<Guid> playerIds, List<int> playerElos)
    {
        try
        {
            var match = new MatchEntity
            {
                Id = Guid.NewGuid(),
                WorldId = worldId,
                Status = MatchStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };

            _context.Matches.Add(match);

            // Balance teams based on ELO
            var sortedPlayers = playerIds
                .Select((id, index) => new { Id = id, Elo = playerElos[index] })
                .OrderByDescending(p => p.Elo)
                .ToList();

            // Assign teams (alternating high/low for balance)
            for (int i = 0; i < sortedPlayers.Count; i++)
            {
                var player = sortedPlayers[i];
                var teamId = (i % 2) + 1; // Team 1 or 2

                var matchPlayer = new MatchPlayer
                {
                    Id = Guid.NewGuid(),
                    MatchId = match.Id,
                    PlayerId = player.Id,
                    TeamId = teamId,
                    EloBefore = player.Elo,
                    EloAfter = player.Elo, // Will be updated at match end
                    EloChange = 0,
                    CreatedAt = DateTime.UtcNow
                };

                _context.MatchPlayers.Add(matchPlayer);
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation("Created match {MatchId} with {PlayerCount} players", 
                match.Id, playerIds.Count);

            return ApiResponse<MatchEntity>.SuccessResponse(match, "Match created successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating match");
            return ApiResponse<MatchEntity>.ErrorResponse("Failed to create match", 
                new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<MatchEntity>> GetMatchAsync(Guid matchId)
    {
        try
        {
            var match = await _context.Matches
                .Include(m => m.Players)
                .FirstOrDefaultAsync(m => m.Id == matchId);

            if (match == null)
            {
                return ApiResponse<MatchEntity>.ErrorResponse("Match not found", 
                    new List<string> { "The specified match does not exist" });
            }

            return ApiResponse<MatchEntity>.SuccessResponse(match);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting match {MatchId}", matchId);
            return ApiResponse<MatchEntity>.ErrorResponse("Failed to get match", 
                new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<MatchEntity>> StartMatchAsync(Guid matchId)
    {
        try
        {
            var match = await _context.Matches.FindAsync(matchId);

            if (match == null)
            {
                return ApiResponse<MatchEntity>.ErrorResponse("Match not found", 
                    new List<string> { "The specified match does not exist" });
            }

            if (match.Status != MatchStatus.Pending)
            {
                return ApiResponse<MatchEntity>.ErrorResponse("Match already started", 
                    new List<string> { "Match is not in pending status" });
            }

            match.Status = MatchStatus.InProgress;
            match.StartTime = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Started match {MatchId}", matchId);

            return ApiResponse<MatchEntity>.SuccessResponse(match, "Match started");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error starting match {MatchId}", matchId);
            return ApiResponse<MatchEntity>.ErrorResponse("Failed to start match", 
                new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<MatchEntity>> EndMatchAsync(Guid matchId, EndMatchRequest request)
    {
        try
        {
            var match = await _context.Matches
                .Include(m => m.Players)
                .FirstOrDefaultAsync(m => m.Id == matchId);

            if (match == null)
            {
                return ApiResponse<MatchEntity>.ErrorResponse("Match not found", 
                    new List<string> { "The specified match does not exist" });
            }

            if (match.Status != MatchStatus.InProgress)
            {
                return ApiResponse<MatchEntity>.ErrorResponse("Match not in progress", 
                    new List<string> { "Match must be in progress to end" });
            }

            match.Status = MatchStatus.Completed;
            match.EndTime = DateTime.UtcNow;
            match.DurationSeconds = match.StartTime.HasValue 
                ? (int)(match.EndTime.Value - match.StartTime.Value).TotalSeconds 
                : 0;
            match.WinningTeamId = request.WinningTeamId;

            // Update player stats and calculate ELO changes
            await UpdatePlayerStatsAndEloAsync(match, request.PlayerStats);

            await _context.SaveChangesAsync();

            _logger.LogInformation("Ended match {MatchId}, winner: Team {TeamId}", 
                matchId, request.WinningTeamId);

            return ApiResponse<MatchEntity>.SuccessResponse(match, "Match ended successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error ending match {MatchId}", matchId);
            return ApiResponse<MatchEntity>.ErrorResponse("Failed to end match", 
                new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<List<MatchEntity>>> GetActiveMatchesAsync(Guid? worldId = null)
    {
        try
        {
            var query = _context.Matches
                .Include(m => m.Players)
                .Where(m => m.Status == MatchStatus.InProgress || m.Status == MatchStatus.Pending);

            if (worldId.HasValue)
            {
                query = query.Where(m => m.WorldId == worldId.Value);
            }

            var matches = await query
                .OrderByDescending(m => m.CreatedAt)
                .ToListAsync();

            return ApiResponse<List<MatchEntity>>.SuccessResponse(matches);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting active matches");
            return ApiResponse<List<MatchEntity>>.ErrorResponse("Failed to get active matches", 
                new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<List<MatchEntity>>> GetMatchHistoryAsync(Guid playerId, int page = 1, int pageSize = 10)
    {
        try
        {
            var matches = await _context.Matches
                .Include(m => m.Players)
                .Where(m => m.Players.Any(p => p.PlayerId == playerId))
                .OrderByDescending(m => m.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return ApiResponse<List<MatchEntity>>.SuccessResponse(matches);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting match history for player {PlayerId}", playerId);
            return ApiResponse<List<MatchEntity>>.ErrorResponse("Failed to get match history", 
                new List<string> { ex.Message });
        }
    }

    private async Task UpdatePlayerStatsAndEloAsync(MatchEntity match, List<PlayerStatsDto> playerStats)
    {
        foreach (var matchPlayer in match.Players)
        {
            var stats = playerStats.FirstOrDefault(s => s.PlayerId == matchPlayer.PlayerId);
            if (stats != null)
            {
                matchPlayer.Score = stats.Score;
                matchPlayer.Kills = stats.Kills;
                matchPlayer.Deaths = stats.Deaths;
                matchPlayer.Assists = stats.Assists;
            }

            // Get or create PlayerElo record
            var playerElo = await _context.PlayerElos
                .FirstOrDefaultAsync(e => e.PlayerId == matchPlayer.PlayerId);

            if (playerElo == null)
            {
                playerElo = new PlayerElo
                {
                    Id = Guid.NewGuid(),
                    PlayerId = matchPlayer.PlayerId,
                    CurrentElo = 1200,
                    HighestElo = 1200,
                    Rank = "Silver",
                    CreatedAt = DateTime.UtcNow
                };
                _context.PlayerElos.Add(playerElo);
            }

            // Calculate ELO change
            var won = matchPlayer.TeamId == match.WinningTeamId;
            var actualScore = won ? 1.0 : 0.0;

            // Calculate average opponent ELO
            var opponentElo = match.Players
                .Where(p => p.TeamId != matchPlayer.TeamId)
                .Average(p => p.EloBefore);

            var eloChange = _eloService.CalculateEloChange(
                matchPlayer.EloBefore,
                (int)opponentElo,
                actualScore,
                playerElo.GamesPlayed);

            matchPlayer.EloChange = eloChange;
            matchPlayer.EloAfter = matchPlayer.EloBefore + eloChange;

            // Update PlayerElo
            playerElo.CurrentElo = matchPlayer.EloAfter;
            playerElo.HighestElo = Math.Max(playerElo.HighestElo, playerElo.CurrentElo);
            playerElo.Rank = _eloService.GetRankFromElo(playerElo.CurrentElo);
            playerElo.GamesPlayed++;
            
            if (won) playerElo.Wins++;
            else playerElo.Losses++;

            playerElo.WinStreak = won ? playerElo.WinStreak + 1 : 0;
            playerElo.UpdatedAt = DateTime.UtcNow;
        }
    }
}

/// <summary>
/// Request for ending a match
/// </summary>
public class EndMatchRequest
{
    public int WinningTeamId { get; set; }
    public List<PlayerStatsDto> PlayerStats { get; set; } = new();
}

/// <summary>
/// Player stats from a match
/// </summary>
public class PlayerStatsDto
{
    public Guid PlayerId { get; set; }
    public int Score { get; set; }
    public int Kills { get; set; }
    public int Deaths { get; set; }
    public int Assists { get; set; }
}
