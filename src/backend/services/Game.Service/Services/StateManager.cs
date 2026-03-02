using GamePlatform.Contracts.Common;
using GamePlatform.Game.Service.Data;
using GamePlatform.Game.Service.Models;
using GamePlatform.Infrastructure.Redis;
using Microsoft.EntityFrameworkCore;

namespace GamePlatform.Game.Service.Services;

/// <summary>
/// Service for managing player game state
/// </summary>
public class StateManager : IStateManager
{
    private readonly GameDbContext _context;
    private readonly IRedisCacheService _cache;
    private readonly IEventLogger _eventLogger;
    private readonly ILogger<StateManager> _logger;
    private const string PLAYER_STATE_PREFIX = "game:player:";
    private const int CACHE_EXPIRATION_MINUTES = 15;

    public StateManager(
        GameDbContext context,
        IRedisCacheService cache,
        IEventLogger eventLogger,
        ILogger<StateManager> logger)
    {
        _context = context;
        _cache = cache;
        _eventLogger = eventLogger;
        _logger = logger;
    }

    public async Task<ApiResponse<PlayerGameState>> GetPlayerStateAsync(Guid sessionId, Guid playerId)
    {
        try
        {
            // Try cache first
            var cacheKey = $"{PLAYER_STATE_PREFIX}{sessionId}:{playerId}";
            var cachedState = await _cache.GetAsync<PlayerGameState>(cacheKey);
            if (cachedState != null)
            {
                return ApiResponse<PlayerGameState>.SuccessResponse(cachedState);
            }

            // Load from database
            var state = await _context.PlayerGameStates
                .FirstOrDefaultAsync(p => p.SessionId == sessionId && p.PlayerId == playerId);

            if (state == null)
            {
                return ApiResponse<PlayerGameState>.ErrorResponse("Player state not found",
                    new List<string> { "Player not in session" });
            }

            await CachePlayerStateAsync(state);

            return ApiResponse<PlayerGameState>.SuccessResponse(state);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving player state for {PlayerId} in session {SessionId}", 
                playerId, sessionId);
            return ApiResponse<PlayerGameState>.ErrorResponse("Failed to retrieve state", 
                new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<PlayerGameState>> UpdatePlayerPositionAsync(Guid sessionId, Guid playerId, 
        float x, float y, float z, float rotation)
    {
        try
        {
            var state = await _context.PlayerGameStates
                .FirstOrDefaultAsync(p => p.SessionId == sessionId && p.PlayerId == playerId);

            if (state == null)
            {
                return ApiResponse<PlayerGameState>.ErrorResponse("Player state not found",
                    new List<string> { "Player not in session" });
            }

            state.PositionX = x;
            state.PositionY = y;
            state.PositionZ = z;
            state.Rotation = rotation;
            state.LastActionAt = DateTime.UtcNow;
            state.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            await _eventLogger.LogEventAsync(sessionId, playerId, GameEventType.PlayerMove, "Move",
                new { x, y, z, rotation });

            await CachePlayerStateAsync(state);

            return ApiResponse<PlayerGameState>.SuccessResponse(state);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating position for player {PlayerId}", playerId);
            return ApiResponse<PlayerGameState>.ErrorResponse("Failed to update position", 
                new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<PlayerGameState>> UpdatePlayerHealthAsync(Guid sessionId, Guid playerId, int health)
    {
        try
        {
            var state = await _context.PlayerGameStates
                .FirstOrDefaultAsync(p => p.SessionId == sessionId && p.PlayerId == playerId);

            if (state == null)
            {
                return ApiResponse<PlayerGameState>.ErrorResponse("Player state not found",
                    new List<string> { "Player not in session" });
            }

            var oldHealth = state.Health;
            state.Health = Math.Clamp(health, 0, state.MaxHealth);
            state.UpdatedAt = DateTime.UtcNow;

            if (state.Health <= 0 && state.IsAlive)
            {
                state.IsAlive = false;
                await _eventLogger.LogEventAsync(sessionId, playerId, GameEventType.PlayerDied, "Died", 
                    new { oldHealth });
            }

            await _context.SaveChangesAsync();
            await CachePlayerStateAsync(state);

            return ApiResponse<PlayerGameState>.SuccessResponse(state);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating health for player {PlayerId}", playerId);
            return ApiResponse<PlayerGameState>.ErrorResponse("Failed to update health", 
                new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<PlayerGameState>> UpdatePlayerScoreAsync(Guid sessionId, Guid playerId, int scoreChange)
    {
        try
        {
            var state = await _context.PlayerGameStates
                .FirstOrDefaultAsync(p => p.SessionId == sessionId && p.PlayerId == playerId);

            if (state == null)
            {
                return ApiResponse<PlayerGameState>.ErrorResponse("Player state not found",
                    new List<string> { "Player not in session" });
            }

            var oldScore = state.Score;
            state.Score = Math.Max(0, state.Score + scoreChange);
            state.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            await _eventLogger.LogEventAsync(sessionId, playerId, GameEventType.ScoreChanged, "ScoreChanged",
                new { oldScore, newScore = state.Score, change = scoreChange });

            await CachePlayerStateAsync(state);

            _logger.LogInformation("Player {PlayerId} score changed by {ScoreChange} to {NewScore}", 
                playerId, scoreChange, state.Score);

            return ApiResponse<PlayerGameState>.SuccessResponse(state);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating score for player {PlayerId}", playerId);
            return ApiResponse<PlayerGameState>.ErrorResponse("Failed to update score", 
                new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<PlayerGameState>> SetPlayerReadyAsync(Guid sessionId, Guid playerId, bool isReady)
    {
        try
        {
            var state = await _context.PlayerGameStates
                .FirstOrDefaultAsync(p => p.SessionId == sessionId && p.PlayerId == playerId);

            if (state == null)
            {
                return ApiResponse<PlayerGameState>.ErrorResponse("Player state not found",
                    new List<string> { "Player not in session" });
            }

            state.IsReady = isReady;
            state.Status = isReady ? PlayerStatus.Ready : PlayerStatus.Connected;
            state.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            if (isReady)
            {
                await _eventLogger.LogEventAsync(sessionId, playerId, GameEventType.PlayerReady, "Ready", null);
            }

            await CachePlayerStateAsync(state);

            return ApiResponse<PlayerGameState>.SuccessResponse(state);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error setting ready state for player {PlayerId}", playerId);
            return ApiResponse<PlayerGameState>.ErrorResponse("Failed to update ready state", 
                new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<IEnumerable<PlayerGameState>>> GetSessionPlayersAsync(Guid sessionId)
    {
        try
        {
            var players = await _context.PlayerGameStates
                .Where(p => p.SessionId == sessionId && !p.LeftAt.HasValue)
                .OrderBy(p => p.JoinedAt)
                .ToListAsync();

            return ApiResponse<IEnumerable<PlayerGameState>>.SuccessResponse(players);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving players for session {SessionId}", sessionId);
            return ApiResponse<IEnumerable<PlayerGameState>>.ErrorResponse("Failed to retrieve players", 
                new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<PlayerGameState>> ApplyDamageAsync(Guid sessionId, Guid playerId, int damage)
    {
        try
        {
            var state = await _context.PlayerGameStates
                .FirstOrDefaultAsync(p => p.SessionId == sessionId && p.PlayerId == playerId);

            if (state == null)
            {
                return ApiResponse<PlayerGameState>.ErrorResponse("Player state not found",
                    new List<string> { "Player not in session" });
            }

            if (!state.IsAlive)
            {
                return ApiResponse<PlayerGameState>.ErrorResponse("Player is dead",
                    new List<string> { "Cannot damage dead player" });
            }

            var oldHealth = state.Health;
            state.Health = Math.Max(0, state.Health - damage);
            state.UpdatedAt = DateTime.UtcNow;

            await _eventLogger.LogEventAsync(sessionId, playerId, GameEventType.PlayerDamaged, "Damaged",
                new { damage, oldHealth, newHealth = state.Health });

            if (state.Health <= 0)
            {
                state.IsAlive = false;
                await _eventLogger.LogEventAsync(sessionId, playerId, GameEventType.PlayerDied, "Died", null);
            }

            await _context.SaveChangesAsync();
            await CachePlayerStateAsync(state);

            _logger.LogInformation("Player {PlayerId} took {Damage} damage, health now {Health}", 
                playerId, damage, state.Health);

            return ApiResponse<PlayerGameState>.SuccessResponse(state);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error applying damage to player {PlayerId}", playerId);
            return ApiResponse<PlayerGameState>.ErrorResponse("Failed to apply damage", 
                new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<PlayerGameState>> RespawnPlayerAsync(Guid sessionId, Guid playerId)
    {
        try
        {
            var state = await _context.PlayerGameStates
                .FirstOrDefaultAsync(p => p.SessionId == sessionId && p.PlayerId == playerId);

            if (state == null)
            {
                return ApiResponse<PlayerGameState>.ErrorResponse("Player state not found",
                    new List<string> { "Player not in session" });
            }

            // Reset to spawn position (0,0,0) and full health
            state.PositionX = 0;
            state.PositionY = 0;
            state.PositionZ = 0;
            state.Rotation = 0;
            state.Health = state.MaxHealth;
            state.IsAlive = true;
            state.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            await _eventLogger.LogEventAsync(sessionId, playerId, GameEventType.PlayerRespawned, "Respawned", null);

            await CachePlayerStateAsync(state);

            _logger.LogInformation("Player {PlayerId} respawned", playerId);

            return ApiResponse<PlayerGameState>.SuccessResponse(state);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error respawning player {PlayerId}", playerId);
            return ApiResponse<PlayerGameState>.ErrorResponse("Failed to respawn", 
                new List<string> { ex.Message });
        }
    }

    private async Task CachePlayerStateAsync(PlayerGameState state)
    {
        try
        {
            var cacheKey = $"{PLAYER_STATE_PREFIX}{state.SessionId}:{state.PlayerId}";
            await _cache.SetAsync(cacheKey, state, TimeSpan.FromMinutes(CACHE_EXPIRATION_MINUTES));
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to cache player state for {PlayerId}", state.PlayerId);
        }
    }
}
