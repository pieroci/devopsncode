using GamePlatform.Contracts.Common;
using GamePlatform.Contracts.Game;
using GamePlatform.Game.Service.Models;
using GamePlatform.Game.Service.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace GamePlatform.Game.Service.Controllers;

/// <summary>
/// Game session management controller
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class GameController : ControllerBase
{
    private readonly ISessionManager _sessionManager;
    private readonly ILogger<GameController> _logger;

    public GameController(ISessionManager sessionManager, ILogger<GameController> logger)
    {
        _sessionManager = sessionManager;
        _logger = logger;
    }

    /// <summary>
    /// Health check endpoint
    /// </summary>
    [HttpGet("health")]
    [AllowAnonymous]
    public IActionResult Health()
    {
        return Ok(new { status = "healthy", service = "Game.Service", timestamp = DateTime.UtcNow });
    }

    /// <summary>
    /// Get service information
    /// </summary>
    [HttpGet("info")]
    [AllowAnonymous]
    public IActionResult GetInfo()
    {
        return Ok(new
        {
            service = "Game.Service",
            version = "1.0.0",
            description = "Game session management and real-time game state API",
            features = new List<string>
            {
                "Session Management",
                "Real-time Game State",
                "Player Actions",
                "Event Sourcing",
                "Game Replay"
            },
            timestamp = DateTime.UtcNow
        });
    }

    /// <summary>
    /// List active game sessions
    /// </summary>
    [HttpGet("sessions")]
    [Authorize]
    public async Task<IActionResult> GetSessions()
    {
        _logger.LogInformation("Fetching active game sessions");
        var result = await _sessionManager.GetActiveSessionsAsync();
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get specific session details
    /// </summary>
    [HttpGet("sessions/{sessionId}")]
    [Authorize]
    public async Task<IActionResult> GetSession(Guid sessionId)
    {
        _logger.LogInformation("Fetching session {SessionId}", sessionId);
        var result = await _sessionManager.GetSessionAsync(sessionId);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Create a new game session
    /// </summary>
    [HttpPost("sessions")]
    [Authorize]
    public async Task<IActionResult> CreateSession([FromBody] CreateSessionRequest request)
    {
        _logger.LogInformation("Creating new game session for world {WorldId}", request.WorldId);
        var result = await _sessionManager.CreateSessionAsync(request.WorldId, request.WorldName, request.MaxPlayers);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Join a game session
    /// </summary>
    [HttpPost("sessions/{sessionId}/join")]
    [Authorize]
    public async Task<IActionResult> JoinSession(Guid sessionId)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var username = User.FindFirst(ClaimTypes.Name)?.Value ?? "Unknown";

        if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out var playerId))
        {
            return Unauthorized(ApiResponse<GameSessionDto>.ErrorResponse("Invalid user", new List<string> { "User not authenticated" }));
        }

        _logger.LogInformation("Player {PlayerId} joining session {SessionId}", playerId, sessionId);
        var result = await _sessionManager.JoinSessionAsync(sessionId, playerId, username);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Leave a game session
    /// </summary>
    [HttpPost("sessions/{sessionId}/leave")]
    [Authorize]
    public async Task<IActionResult> LeaveSession(Guid sessionId)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out var playerId))
        {
            return Unauthorized(ApiResponse<GameSessionDto>.ErrorResponse("Invalid user", new List<string> { "User not authenticated" }));
        }

        _logger.LogInformation("Player {PlayerId} leaving session {SessionId}", playerId, sessionId);
        var result = await _sessionManager.LeaveSessionAsync(sessionId, playerId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Start a game session
    /// </summary>
    [HttpPost("sessions/{sessionId}/start")]
    [Authorize]
    public async Task<IActionResult> StartSession(Guid sessionId)
    {
        _logger.LogInformation("Starting session {SessionId}", sessionId);
        var result = await _sessionManager.StartSessionAsync(sessionId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// End a game session
    /// </summary>
    [HttpPost("sessions/{sessionId}/end")]
    [Authorize]
    public async Task<IActionResult> EndSession(Guid sessionId)
    {
        _logger.LogInformation("Ending session {SessionId}", sessionId);
        var result = await _sessionManager.EndSessionAsync(sessionId);
        return result.Success ? Ok(result) : BadRequest(result);
    }
}

/// <summary>
/// Request to create a new session
/// </summary>
public class CreateSessionRequest
{
    public int WorldId { get; set; }
    public string WorldName { get; set; } = string.Empty;
    public int MaxPlayers { get; set; } = 10;
}
