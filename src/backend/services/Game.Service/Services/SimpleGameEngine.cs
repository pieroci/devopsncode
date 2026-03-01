using GamePlatform.Contracts.Common;
using GamePlatform.Game.Service.Data;
using GamePlatform.Game.Service.Models;
using Microsoft.EntityFrameworkCore;

namespace GamePlatform.Game.Service.Services;

/// <summary>
/// Simple game engine implementation with basic mechanics
/// </summary>
public class SimpleGameEngine : IGameEngine
{
    private readonly GameDbContext _context;
    private readonly IStateManager _stateManager;
    private readonly IEventLogger _eventLogger;
    private readonly ILogger<SimpleGameEngine> _logger;

    // Game constants
    private const float MAX_MOVE_SPEED = 10f;
    private const float ATTACK_RANGE = 5f;
    private const int BASE_ATTACK_DAMAGE = 25;
    private const float COLLISION_RADIUS = 1f;

    public SimpleGameEngine(
        GameDbContext context,
        IStateManager stateManager,
        IEventLogger eventLogger,
        ILogger<SimpleGameEngine> logger)
    {
        _context = context;
        _stateManager = stateManager;
        _eventLogger = eventLogger;
        _logger = logger;
    }

    public async Task<ApiResponse<PlayerGameState>> ProcessMoveAsync(Guid sessionId, Guid playerId, 
        float x, float y, float z, float rotation)
    {
        try
        {
            // Validate session is in progress
            var session = await _context.GameSessions.FindAsync(sessionId);
            if (session == null || session.State != GameSessionState.InProgress)
            {
                return ApiResponse<PlayerGameState>.ErrorResponse("Invalid session state",
                    new List<string> { "Session is not in progress" });
            }

            // Get current player state
            var playerStateResult = await _stateManager.GetPlayerStateAsync(sessionId, playerId);
            if (!playerStateResult.Success || playerStateResult.Data == null)
            {
                return ApiResponse<PlayerGameState>.ErrorResponse("Player not found",
                    new List<string> { "Player not in session" });
            }

            var playerState = playerStateResult.Data;

            // Validate player is alive
            if (!playerState.IsAlive)
            {
                return ApiResponse<PlayerGameState>.ErrorResponse("Player is dead",
                    new List<string> { "Dead players cannot move" });
            }

            // Calculate distance moved (simple validation)
            var distanceMoved = CalculateDistance(
                playerState.PositionX, playerState.PositionY, playerState.PositionZ,
                x, y, z);

            if (distanceMoved > MAX_MOVE_SPEED)
            {
                _logger.LogWarning("Player {PlayerId} attempted to move too fast: {Distance}", playerId, distanceMoved);
                return ApiResponse<PlayerGameState>.ErrorResponse("Invalid move",
                    new List<string> { "Movement speed exceeded" });
            }

            // Update position
            return await _stateManager.UpdatePlayerPositionAsync(sessionId, playerId, x, y, z, rotation);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing move for player {PlayerId}", playerId);
            return ApiResponse<PlayerGameState>.ErrorResponse("Failed to process move",
                new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<AttackResult>> ProcessAttackAsync(Guid sessionId, Guid attackerId, Guid targetId)
    {
        try
        {
            // Validate session
            var session = await _context.GameSessions.FindAsync(sessionId);
            if (session == null || session.State != GameSessionState.InProgress)
            {
                return ApiResponse<AttackResult>.ErrorResponse("Invalid session state",
                    new List<string> { "Session is not in progress" });
            }

            // Get attacker and target states
            var attackerResult = await _stateManager.GetPlayerStateAsync(sessionId, attackerId);
            var targetResult = await _stateManager.GetPlayerStateAsync(sessionId, targetId);

            if (!attackerResult.Success || attackerResult.Data == null)
            {
                return ApiResponse<AttackResult>.ErrorResponse("Attacker not found",
                    new List<string> { "Attacker not in session" });
            }

            if (!targetResult.Success || targetResult.Data == null)
            {
                return ApiResponse<AttackResult>.ErrorResponse("Target not found",
                    new List<string> { "Target not in session" });
            }

            var attacker = attackerResult.Data;
            var target = targetResult.Data;

            // Validate attacker is alive
            if (!attacker.IsAlive)
            {
                return ApiResponse<AttackResult>.ErrorResponse("Attacker is dead",
                    new List<string> { "Dead players cannot attack" });
            }

            // Validate target is alive
            if (!target.IsAlive)
            {
                return ApiResponse<AttackResult>.ErrorResponse("Target is dead",
                    new List<string> { "Cannot attack dead players" });
            }

            // Calculate distance
            var distance = CalculateDistance(
                attacker.PositionX, attacker.PositionY, attacker.PositionZ,
                target.PositionX, target.PositionY, target.PositionZ);

            // Check if in range
            if (distance > ATTACK_RANGE)
            {
                var result = new AttackResult
                {
                    AttackerId = attackerId,
                    TargetId = targetId,
                    Damage = 0,
                    Hit = false,
                    TargetKilled = false,
                    Message = "Target out of range"
                };

                return ApiResponse<AttackResult>.SuccessResponse(result);
            }

            // Apply damage
            var damageResult = await _stateManager.ApplyDamageAsync(sessionId, targetId, BASE_ATTACK_DAMAGE);

            if (!damageResult.Success)
            {
                return ApiResponse<AttackResult>.ErrorResponse("Failed to apply damage",
                    new List<string> { damageResult.Message });
            }

            // Log attack event
            await _eventLogger.LogEventAsync(sessionId, attackerId, GameEventType.PlayerAttack, "Attack",
                new { targetId, damage = BASE_ATTACK_DAMAGE });

            var attackResult = new AttackResult
            {
                AttackerId = attackerId,
                TargetId = targetId,
                Damage = BASE_ATTACK_DAMAGE,
                Hit = true,
                TargetKilled = damageResult.Data?.Health <= 0,
                Message = damageResult.Data?.Health <= 0 ? "Target killed!" : "Hit!"
            };

            // Update attacker's score if target was killed
            if (attackResult.TargetKilled)
            {
                await _stateManager.UpdatePlayerScoreAsync(sessionId, attackerId, 100);
            }

            _logger.LogInformation("Player {AttackerId} attacked {TargetId}, damage: {Damage}, killed: {Killed}",
                attackerId, targetId, BASE_ATTACK_DAMAGE, attackResult.TargetKilled);

            return ApiResponse<AttackResult>.SuccessResponse(attackResult);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing attack from {AttackerId} to {TargetId}", attackerId, targetId);
            return ApiResponse<AttackResult>.ErrorResponse("Failed to process attack",
                new List<string> { ex.Message });
        }
    }

    public async Task<bool> ValidateActionAsync(Guid sessionId, Guid playerId, string actionType)
    {
        try
        {
            // Check session is active
            var session = await _context.GameSessions.FindAsync(sessionId);
            if (session == null || session.State != GameSessionState.InProgress)
            {
                return false;
            }

            // Check player is in session and alive
            var playerResult = await _stateManager.GetPlayerStateAsync(sessionId, playerId);
            if (!playerResult.Success || playerResult.Data == null || !playerResult.Data.IsAlive)
            {
                return false;
            }

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating action for player {PlayerId}", playerId);
            return false;
        }
    }

    public async Task<List<Guid>> CheckCollisionsAsync(Guid sessionId, float x, float y, float z, float radius)
    {
        try
        {
            var players = await _context.PlayerGameStates
                .Where(p => p.SessionId == sessionId && p.IsAlive)
                .ToListAsync();

            var nearbyPlayers = new List<Guid>();

            foreach (var player in players)
            {
                var distance = CalculateDistance(x, y, z, player.PositionX, player.PositionY, player.PositionZ);
                if (distance <= radius + COLLISION_RADIUS)
                {
                    nearbyPlayers.Add(player.PlayerId);
                }
            }

            return nearbyPlayers;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking collisions in session {SessionId}", sessionId);
            return new List<Guid>();
        }
    }

    public async Task<float> GetDistanceBetweenPlayersAsync(Guid sessionId, Guid player1Id, Guid player2Id)
    {
        try
        {
            var player1Result = await _stateManager.GetPlayerStateAsync(sessionId, player1Id);
            var player2Result = await _stateManager.GetPlayerStateAsync(sessionId, player2Id);

            if (!player1Result.Success || player1Result.Data == null || 
                !player2Result.Success || player2Result.Data == null)
            {
                return float.MaxValue;
            }

            var player1 = player1Result.Data;
            var player2 = player2Result.Data;

            return CalculateDistance(
                player1.PositionX, player1.PositionY, player1.PositionZ,
                player2.PositionX, player2.PositionY, player2.PositionZ);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating distance between players");
            return float.MaxValue;
        }
    }

    private float CalculateDistance(float x1, float y1, float z1, float x2, float y2, float z2)
    {
        var dx = x2 - x1;
        var dy = y2 - y1;
        var dz = z2 - z1;
        return (float)Math.Sqrt(dx * dx + dy * dy + dz * dz);
    }
}
