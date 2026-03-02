using GamePlatform.Contracts.Common;
using GamePlatform.Game.Service.Models;

namespace GamePlatform.Game.Service.Services;

/// <summary>
/// Interface for game engine logic
/// </summary>
public interface IGameEngine
{
    /// <summary>
    /// Process a player move action
    /// </summary>
    Task<ApiResponse<PlayerGameState>> ProcessMoveAsync(Guid sessionId, Guid playerId, float x, float y, float z, float rotation);

    /// <summary>
    /// Process a player attack action
    /// </summary>
    Task<ApiResponse<AttackResult>> ProcessAttackAsync(Guid sessionId, Guid attackerId, Guid targetId);

    /// <summary>
    /// Validate if an action is allowed
    /// </summary>
    Task<bool> ValidateActionAsync(Guid sessionId, Guid playerId, string actionType);

    /// <summary>
    /// Check for collisions near a position
    /// </summary>
    Task<List<Guid>> CheckCollisionsAsync(Guid sessionId, float x, float y, float z, float radius);

    /// <summary>
    /// Calculate distance between two players
    /// </summary>
    Task<float> GetDistanceBetweenPlayersAsync(Guid sessionId, Guid player1Id, Guid player2Id);
}

/// <summary>
/// Result of an attack action
/// </summary>
public class AttackResult
{
    public Guid AttackerId { get; set; }
    public Guid TargetId { get; set; }
    public int Damage { get; set; }
    public bool Hit { get; set; }
    public bool TargetKilled { get; set; }
    public string Message { get; set; } = string.Empty;
}
