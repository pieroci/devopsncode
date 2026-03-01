using GamePlatform.Contracts.Common;
using GamePlatform.Game.Service.Models;

namespace GamePlatform.Game.Service.Services;

/// <summary>
/// Interface for managing player game state
/// </summary>
public interface IStateManager
{
    /// <summary>
    /// Get player's current state in a session
    /// </summary>
    Task<ApiResponse<PlayerGameState>> GetPlayerStateAsync(Guid sessionId, Guid playerId);

    /// <summary>
    /// Update player's position
    /// </summary>
    Task<ApiResponse<PlayerGameState>> UpdatePlayerPositionAsync(Guid sessionId, Guid playerId, 
        float x, float y, float z, float rotation);

    /// <summary>
    /// Update player's health
    /// </summary>
    Task<ApiResponse<PlayerGameState>> UpdatePlayerHealthAsync(Guid sessionId, Guid playerId, int health);

    /// <summary>
    /// Update player's score
    /// </summary>
    Task<ApiResponse<PlayerGameState>> UpdatePlayerScoreAsync(Guid sessionId, Guid playerId, int scoreChange);

    /// <summary>
    /// Mark player as ready
    /// </summary>
    Task<ApiResponse<PlayerGameState>> SetPlayerReadyAsync(Guid sessionId, Guid playerId, bool isReady);

    /// <summary>
    /// Get all players in a session
    /// </summary>
    Task<ApiResponse<IEnumerable<PlayerGameState>>> GetSessionPlayersAsync(Guid sessionId);

    /// <summary>
    /// Apply damage to player
    /// </summary>
    Task<ApiResponse<PlayerGameState>> ApplyDamageAsync(Guid sessionId, Guid playerId, int damage);

    /// <summary>
    /// Respawn player
    /// </summary>
    Task<ApiResponse<PlayerGameState>> RespawnPlayerAsync(Guid sessionId, Guid playerId);
}
