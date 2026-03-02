using GamePlatform.Match.Service.Models;
using GamePlatform.Match.Service.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace GamePlatform.Match.Service.Controllers;

/// <summary>
/// Controller for matchmaking operations
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
[Authorize]
public class MatchmakingController : ControllerBase
{
    private readonly IMatchmakingService _matchmakingService;
    private readonly ILogger<MatchmakingController> _logger;

    public MatchmakingController(
        IMatchmakingService matchmakingService,
        ILogger<MatchmakingController> logger)
    {
        _matchmakingService = matchmakingService;
        _logger = logger;
    }

    /// <summary>
    /// Join matchmaking queue
    /// </summary>
    [HttpPost("join")]
    public async Task<IActionResult> JoinQueue([FromBody] JoinQueueRequest request)
    {
        var playerId = GetUserIdFromClaims();
        if (playerId == Guid.Empty)
        {
            return Unauthorized("Invalid user");
        }

        var result = await _matchmakingService.JoinQueueAsync(playerId, request.Mode, request.CurrentElo);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Leave matchmaking queue
    /// </summary>
    [HttpDelete("leave")]
    public async Task<IActionResult> LeaveQueue()
    {
        var playerId = GetUserIdFromClaims();
        if (playerId == Guid.Empty)
        {
            return Unauthorized("Invalid user");
        }

        var result = await _matchmakingService.LeaveQueueAsync(playerId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get current queue status
    /// </summary>
    [HttpGet("status")]
    public async Task<IActionResult> GetQueueStatus()
    {
        var playerId = GetUserIdFromClaims();
        if (playerId == Guid.Empty)
        {
            return Unauthorized("Invalid user");
        }

        var result = await _matchmakingService.GetQueueStatusAsync(playerId);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Get queue size for a game mode
    /// </summary>
    [HttpGet("queue-size/{mode}")]
    public async Task<IActionResult> GetQueueSize(GameMode mode)
    {
        var size = await _matchmakingService.GetQueueSizeAsync(mode);
        return Ok(new { mode, size, timestamp = DateTime.UtcNow });
    }

    private Guid GetUserIdFromClaims()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            return Guid.Empty;
        }
        return userId;
    }
}

/// <summary>
/// Request to join matchmaking queue
/// </summary>
public class JoinQueueRequest
{
    public GameMode Mode { get; set; }
    public int CurrentElo { get; set; }
}
