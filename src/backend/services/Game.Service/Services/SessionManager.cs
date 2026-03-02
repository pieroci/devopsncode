using GamePlatform.Contracts.Common;
using GamePlatform.Contracts.Game;
using GamePlatform.Game.Service.Data;
using GamePlatform.Game.Service.Models;
using GamePlatform.Infrastructure.Redis;
using Microsoft.EntityFrameworkCore;

namespace GamePlatform.Game.Service.Services;

/// <summary>
/// Service for managing game sessions
/// </summary>
public class SessionManager : ISessionManager
{
    private readonly GameDbContext _context;
    private readonly IRedisCacheService _cache;
    private readonly IEventLogger _eventLogger;
    private readonly ILogger<SessionManager> _logger;
    private const string SESSION_CACHE_PREFIX = "game:session:";
    private const int CACHE_EXPIRATION_MINUTES = 30;

    public SessionManager(
        GameDbContext context,
        IRedisCacheService cache,
        IEventLogger eventLogger,
        ILogger<SessionManager> logger)
    {
        _context = context;
        _cache = cache;
        _eventLogger = eventLogger;
        _logger = logger;
    }

    public async Task<ApiResponse<GameSessionDto>> CreateSessionAsync(int worldId, string worldName, int maxPlayers = 10)
    {
        try
        {
            var session = new GameSession
            {
                Id = Guid.NewGuid(),
                WorldId = worldId,
                WorldName = worldName,
                State = GameSessionState.Waiting,
                MaxPlayers = maxPlayers,
                CurrentPlayers = 0,
                StartedAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.GameSessions.Add(session);
            await _context.SaveChangesAsync();

            await _eventLogger.LogEventAsync(session.Id, null, GameEventType.SessionCreated, "SessionCreated", 
                new { worldId, worldName, maxPlayers });

            await CacheSessionAsync(session);

            _logger.LogInformation("Created game session {SessionId} for world {WorldId}", session.Id, worldId);

            return ApiResponse<GameSessionDto>.SuccessResponse(MapToDto(session), "Session created successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating game session for world {WorldId}", worldId);
            return ApiResponse<GameSessionDto>.ErrorResponse("Failed to create session", new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<GameSessionDto>> GetSessionAsync(Guid sessionId)
    {
        try
        {
            var cacheKey = $"{SESSION_CACHE_PREFIX}{sessionId}";
            var cachedSession = await _cache.GetAsync<GameSessionDto>(cacheKey);
            if (cachedSession != null)
            {
                return ApiResponse<GameSessionDto>.SuccessResponse(cachedSession);
            }

            var session = await _context.GameSessions
                .Include(s => s.Players)
                .FirstOrDefaultAsync(s => s.Id == sessionId);

            if (session == null)
            {
                return ApiResponse<GameSessionDto>.ErrorResponse("Session not found", 
                    new List<string> { $"No session found with ID {sessionId}" });
            }

            var dto = MapToDto(session);
            await _cache.SetAsync(cacheKey, dto, TimeSpan.FromMinutes(CACHE_EXPIRATION_MINUTES));

            return ApiResponse<GameSessionDto>.SuccessResponse(dto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving session {SessionId}", sessionId);
            return ApiResponse<GameSessionDto>.ErrorResponse("Failed to retrieve session", new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<IEnumerable<GameSessionDto>>> GetActiveSessionsAsync()
    {
        try
        {
            var activeSessions = await _context.GameSessions
                .Include(s => s.Players)
                .Where(s => s.State == GameSessionState.Waiting || 
                           s.State == GameSessionState.Starting || 
                           s.State == GameSessionState.InProgress)
                .OrderByDescending(s => s.CreatedAt)
                .Take(50)
                .ToListAsync();

            var dtos = activeSessions.Select(MapToDto).ToList();

            return ApiResponse<IEnumerable<GameSessionDto>>.SuccessResponse(dtos, 
                $"Found {dtos.Count} active sessions");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving active sessions");
            return ApiResponse<IEnumerable<GameSessionDto>>.ErrorResponse("Failed to retrieve sessions", new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<IEnumerable<GameSessionDto>>> GetSessionsByWorldAsync(int worldId)
    {
        try
        {
            var sessions = await _context.GameSessions
                .Include(s => s.Players)
                .Where(s => s.WorldId == worldId && s.State != GameSessionState.Ended && s.State != GameSessionState.Cancelled)
                .OrderByDescending(s => s.CreatedAt)
                .ToListAsync();

            var dtos = sessions.Select(MapToDto).ToList();

            return ApiResponse<IEnumerable<GameSessionDto>>.SuccessResponse(dtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving sessions for world {WorldId}", worldId);
            return ApiResponse<IEnumerable<GameSessionDto>>.ErrorResponse("Failed to retrieve sessions", new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<GameSessionDto>> JoinSessionAsync(Guid sessionId, Guid playerId, string username)
    {
        try
        {
            var session = await _context.GameSessions
                .Include(s => s.Players)
                .FirstOrDefaultAsync(s => s.Id == sessionId);

            if (session == null)
            {
                return ApiResponse<GameSessionDto>.ErrorResponse("Session not found", 
                    new List<string> { $"No session found with ID {sessionId}" });
            }

            if (session.State != GameSessionState.Waiting)
            {
                return ApiResponse<GameSessionDto>.ErrorResponse("Cannot join session", 
                    new List<string> { $"Session is in {session.State} state" });
            }

            if (session.IsFull)
            {
                return ApiResponse<GameSessionDto>.ErrorResponse("Session is full", 
                    new List<string> { $"Session has reached maximum players ({session.MaxPlayers})" });
            }

            if (session.Players.Any(p => p.PlayerId == playerId))
            {
                return ApiResponse<GameSessionDto>.ErrorResponse("Already in session", 
                    new List<string> { "Player is already in this session" });
            }

            var playerState = new PlayerGameState
            {
                Id = Guid.NewGuid(),
                SessionId = sessionId,
                PlayerId = playerId,
                Username = username,
                Health = 100,
                MaxHealth = 100,
                Score = 0,
                Level = 1,
                IsAlive = true,
                IsReady = false,
                Status = PlayerStatus.Connected,
                JoinedAt = DateTime.UtcNow,
                LastActionAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.PlayerGameStates.Add(playerState);
            session.CurrentPlayers++;
            session.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            await _eventLogger.LogEventAsync(sessionId, playerId, GameEventType.PlayerJoined, "PlayerJoined", 
                new { username });

            await CacheSessionAsync(session);

            _logger.LogInformation("Player {PlayerId} joined session {SessionId}", playerId, sessionId);

            return ApiResponse<GameSessionDto>.SuccessResponse(MapToDto(session), "Joined session successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error joining session {SessionId} for player {PlayerId}", sessionId, playerId);
            return ApiResponse<GameSessionDto>.ErrorResponse("Failed to join session", new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<GameSessionDto>> LeaveSessionAsync(Guid sessionId, Guid playerId)
    {
        try
        {
            var session = await _context.GameSessions
                .Include(s => s.Players)
                .FirstOrDefaultAsync(s => s.Id == sessionId);

            if (session == null)
            {
                return ApiResponse<GameSessionDto>.ErrorResponse("Session not found", 
                    new List<string> { $"No session found with ID {sessionId}" });
            }

            var playerState = session.Players.FirstOrDefault(p => p.PlayerId == playerId);
            if (playerState == null)
            {
                return ApiResponse<GameSessionDto>.ErrorResponse("Player not in session", 
                    new List<string> { "Player is not in this session" });
            }

            playerState.LeftAt = DateTime.UtcNow;
            playerState.Status = PlayerStatus.Disconnected;
            playerState.UpdatedAt = DateTime.UtcNow;

            session.CurrentPlayers = Math.Max(0, session.CurrentPlayers - 1);
            session.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            await _eventLogger.LogEventAsync(sessionId, playerId, GameEventType.PlayerLeft, "PlayerLeft", null);

            await CacheSessionAsync(session);

            _logger.LogInformation("Player {PlayerId} left session {SessionId}", playerId, sessionId);

            return ApiResponse<GameSessionDto>.SuccessResponse(MapToDto(session), "Left session successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error leaving session {SessionId} for player {PlayerId}", sessionId, playerId);
            return ApiResponse<GameSessionDto>.ErrorResponse("Failed to leave session", new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<GameSessionDto>> StartSessionAsync(Guid sessionId)
    {
        try
        {
            var session = await _context.GameSessions
                .Include(s => s.Players)
                .FirstOrDefaultAsync(s => s.Id == sessionId);

            if (session == null)
            {
                return ApiResponse<GameSessionDto>.ErrorResponse("Session not found", 
                    new List<string> { $"No session found with ID {sessionId}" });
            }

            if (session.State != GameSessionState.Waiting)
            {
                return ApiResponse<GameSessionDto>.ErrorResponse("Cannot start session", 
                    new List<string> { $"Session is in {session.State} state" });
            }

            if (session.CurrentPlayers < 1)
            {
                return ApiResponse<GameSessionDto>.ErrorResponse("Cannot start session", 
                    new List<string> { "At least 1 player is required to start" });
            }

            session.State = GameSessionState.InProgress;
            session.StartedAt = DateTime.UtcNow;
            session.UpdatedAt = DateTime.UtcNow;

            foreach (var player in session.Players.Where(p => p.Status == PlayerStatus.Ready || p.Status == PlayerStatus.Connected))
            {
                player.Status = PlayerStatus.Playing;
                player.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            await _eventLogger.LogEventAsync(sessionId, null, GameEventType.SessionStarted, "SessionStarted", 
                new { playerCount = session.CurrentPlayers });

            await CacheSessionAsync(session);

            _logger.LogInformation("Started session {SessionId} with {PlayerCount} players", sessionId, session.CurrentPlayers);

            return ApiResponse<GameSessionDto>.SuccessResponse(MapToDto(session), "Session started successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error starting session {SessionId}", sessionId);
            return ApiResponse<GameSessionDto>.ErrorResponse("Failed to start session", new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<GameSessionDto>> EndSessionAsync(Guid sessionId)
    {
        try
        {
            var session = await _context.GameSessions
                .Include(s => s.Players)
                .FirstOrDefaultAsync(s => s.Id == sessionId);

            if (session == null)
            {
                return ApiResponse<GameSessionDto>.ErrorResponse("Session not found", 
                    new List<string> { $"No session found with ID {sessionId}" });
            }

            if (session.State == GameSessionState.Ended || session.State == GameSessionState.Cancelled)
            {
                return ApiResponse<GameSessionDto>.ErrorResponse("Session already ended", 
                    new List<string> { $"Session is already in {session.State} state" });
            }

            session.State = GameSessionState.Ended;
            session.EndedAt = DateTime.UtcNow;
            session.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            await _eventLogger.LogEventAsync(sessionId, null, GameEventType.SessionEnded, "SessionEnded", 
                new { duration = session.Duration?.TotalMinutes });

            await _cache.DeleteAsync($"{SESSION_CACHE_PREFIX}{sessionId}");

            _logger.LogInformation("Ended session {SessionId}", sessionId);

            return ApiResponse<GameSessionDto>.SuccessResponse(MapToDto(session), "Session ended successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error ending session {SessionId}", sessionId);
            return ApiResponse<GameSessionDto>.ErrorResponse("Failed to end session", new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<GameSessionDto>> CancelSessionAsync(Guid sessionId)
    {
        try
        {
            var session = await _context.GameSessions
                .Include(s => s.Players)
                .FirstOrDefaultAsync(s => s.Id == sessionId);

            if (session == null)
            {
                return ApiResponse<GameSessionDto>.ErrorResponse("Session not found", 
                    new List<string> { $"No session found with ID {sessionId}" });
            }

            session.State = GameSessionState.Cancelled;
            session.EndedAt = DateTime.UtcNow;
            session.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            await _eventLogger.LogEventAsync(sessionId, null, GameEventType.SessionEnded, "SessionCancelled", null);

            await _cache.DeleteAsync($"{SESSION_CACHE_PREFIX}{sessionId}");

            _logger.LogInformation("Cancelled session {SessionId}", sessionId);

            return ApiResponse<GameSessionDto>.SuccessResponse(MapToDto(session), "Session cancelled successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error cancelling session {SessionId}", sessionId);
            return ApiResponse<GameSessionDto>.ErrorResponse("Failed to cancel session", new List<string> { ex.Message });
        }
    }

    public async Task<bool> IsSessionFullAsync(Guid sessionId)
    {
        var session = await _context.GameSessions.FindAsync(sessionId);
        return session?.IsFull ?? false;
    }

    public async Task<bool> IsPlayerInSessionAsync(Guid sessionId, Guid playerId)
    {
        return await _context.PlayerGameStates
            .AnyAsync(p => p.SessionId == sessionId && p.PlayerId == playerId && !p.LeftAt.HasValue);
    }

    private async Task CacheSessionAsync(GameSession session)
    {
        try
        {
            var dto = MapToDto(session);
            await _cache.SetAsync($"{SESSION_CACHE_PREFIX}{session.Id}", dto, 
                TimeSpan.FromMinutes(CACHE_EXPIRATION_MINUTES));
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to cache session {SessionId}", session.Id);
        }
    }

    private GameSessionDto MapToDto(GameSession session)
    {
        return new GameSessionDto
        {
            Id = session.Id,
            WorldId = session.WorldId,
            State = (GameState)(int)session.State,
            StartedAt = session.StartedAt,
            EndedAt = session.EndedAt,
            Players = session.Players?.Select(p => new PlayerInGameDto
            {
                PlayerId = p.PlayerId,
                Username = p.Username,
                Position = new PlayerPosition
                {
                    X = p.PositionX,
                    Y = p.PositionY,
                    Z = p.PositionZ,
                    Rotation = p.Rotation
                },
                Health = p.Health,
                Score = p.Score
            }).ToList() ?? new List<PlayerInGameDto>()
        };
    }
}
