using GamePlatform.Contracts.Common;
using GamePlatform.Game.Service.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace GamePlatform.Game.Service.Controllers;

/// <summary>
/// Controller for handling player actions in game
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
[Authorize]
public class ActionController : ControllerBase
{
    private readonly IGameEngine _gameEngine;
    private readonly IStateManager _stateManager;
    private readonly ILogger<ActionController> _logger;

    public ActionController(
        IGameEngine gameEngine,
        IStateManager stateManager,
        ILogger<ActionController> logger)
    {
        _gameEngine = gameEngine;
        _stateManager = stateManager;
        _logger = logger;
    }

    /// <summary>
    /// Move player to new position
    /// </summary>
    [HttpPost("move")]
    public async Task<IActionResult> Move([FromBody] MoveRequest request)
    {
        var playerId = GetPlayerIdFromClaims();
        if (playerId == Guid.Empty)
        {
            return Unauthorized("Invalid user");
        }

        _logger.LogDebug("Player {PlayerId} moving to ({X}, {Y}, {Z})", 
            playerId, request.X, request.Y, request.Z);

        var result = await _gameEngine.ProcessMoveAsync(request.SessionId, playerId, 
            request.X, request.Y, request.Z, request.Rotation);

        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Attack another player
    /// </summary>
    [HttpPost("attack")]
    public async Task<IActionResult> Attack([FromBody] AttackRequest request)
    {
        var playerId = GetPlayerIdFromClaims();
        if (playerId == Guid.Empty)
        {
            return Unauthorized("Invalid user");
        }

        _logger.LogInformation("Player {PlayerId} attacking {TargetId}", playerId, request.TargetId);

        var result = await _gameEngine.ProcessAttackAsync(request.SessionId, playerId, request.TargetId);

        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get current player state
    /// </summary>
    [HttpGet("state/{sessionId}")]
    public async Task<IActionResult> GetState(Guid sessionId)
    {
        var playerId = GetPlayerIdFromClaims();
        if (playerId == Guid.Empty)
        {
            return Unauthorized("Invalid user");
        }

        var result = await _stateManager.GetPlayerStateAsync(sessionId, playerId);

        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Set player ready status
    /// </summary>
    [HttpPost("ready")]
    public async Task<IActionResult> SetReady([FromBody] ReadyRequest request)
    {
        var playerId = GetPlayerIdFromClaims();
        if (playerId == Guid.Empty)
        {
            return Unauthorized("Invalid user");
        }

        var result = await _stateManager.SetPlayerReadyAsync(request.SessionId, playerId, request.IsReady);

        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Respawn player
    /// </summary>
    [HttpPost("respawn")]
    public async Task<IActionResult> Respawn([FromBody] RespawnRequest request)
    {
        var playerId = GetPlayerIdFromClaims();
        if (playerId == Guid.Empty)
        {
            return Unauthorized("Invalid user");
        }

        _logger.LogInformation("Player {PlayerId} respawning in session {SessionId}", 
            playerId, request.SessionId);

        var result = await _stateManager.RespawnPlayerAsync(request.SessionId, playerId);

        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get all players in session
    /// </summary>
    [HttpGet("players/{sessionId}")]
    public async Task<IActionResult> GetPlayers(Guid sessionId)
    {
        var result = await _stateManager.GetSessionPlayersAsync(sessionId);

        return result.Success ? Ok(result) : BadRequest(result);
    }

    private Guid GetPlayerIdFromClaims()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out var playerId))
        {
            return Guid.Empty;
        }
        return playerId;
    }
}

/// <summary>
/// Request to move player
/// </summary>
public class MoveRequest
{
    public Guid SessionId { get; set; }
    public float X { get; set; }
    public float Y { get; set; }
    public float Z { get; set; }
    public float Rotation { get; set; }
}

/// <summary>
/// Request to attack another player
/// </summary>
public class AttackRequest
{
    public Guid SessionId { get; set; }
    public Guid TargetId { get; set; }
}

/// <summary>
/// Request to set ready status
/// </summary>
public class ReadyRequest
{
    public Guid SessionId { get; set; }
    public bool IsReady { get; set; }
}

/// <summary>
/// Request to respawn
/// </summary>
public class RespawnRequest
{
    public Guid SessionId { get; set; }
}
