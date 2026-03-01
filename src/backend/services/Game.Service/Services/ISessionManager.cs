using GamePlatform.Contracts.Common;
using GamePlatform.Contracts.Game;

namespace GamePlatform.Game.Service.Services;

/// <summary>
/// Interface for managing game sessions
/// </summary>
public interface ISessionManager
{
    /// <summary>
    /// Create a new game session
    /// </summary>
    Task<ApiResponse<GameSessionDto>> CreateSessionAsync(int worldId, string worldName, int maxPlayers = 10);

    /// <summary>
    /// Get session by ID
    /// </summary>
    Task<ApiResponse<GameSessionDto>> GetSessionAsync(Guid sessionId);

    /// <summary>
    /// Get all active sessions
    /// </summary>
    Task<ApiResponse<IEnumerable<GameSessionDto>>> GetActiveSessionsAsync();

    /// <summary>
    /// Get sessions by world ID
    /// </summary>
    Task<ApiResponse<IEnumerable<GameSessionDto>>> GetSessionsByWorldAsync(int worldId);

    /// <summary>
    /// Add player to session
    /// </summary>
    Task<ApiResponse<GameSessionDto>> JoinSessionAsync(Guid sessionId, Guid playerId, string username);

    /// <summary>
    /// Remove player from session
    /// </summary>
    Task<ApiResponse<GameSessionDto>> LeaveSessionAsync(Guid sessionId, Guid playerId);

    /// <summary>
    /// Start a game session
    /// </summary>
    Task<ApiResponse<GameSessionDto>> StartSessionAsync(Guid sessionId);

    /// <summary>
    /// End a game session
    /// </summary>
    Task<ApiResponse<GameSessionDto>> EndSessionAsync(Guid sessionId);

    /// <summary>
    /// Cancel a game session
    /// </summary>
    Task<ApiResponse<GameSessionDto>> CancelSessionAsync(Guid sessionId);

    /// <summary>
    /// Check if session is full
    /// </summary>
    Task<bool> IsSessionFullAsync(Guid sessionId);

    /// <summary>
    /// Check if player is in session
    /// </summary>
    Task<bool> IsPlayerInSessionAsync(Guid sessionId, Guid playerId);
}
