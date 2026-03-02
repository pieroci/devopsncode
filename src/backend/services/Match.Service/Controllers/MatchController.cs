using GamePlatform.Match.Service.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace GamePlatform.Match.Service.Controllers;

/// <summary>
/// Controller for match operations
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
[Authorize]
public class MatchController : ControllerBase
{
    private readonly IMatchService _matchService;
    private readonly ILogger<MatchController> _logger;

    public MatchController(
        IMatchService matchService,
        ILogger<MatchController> logger)
    {
        _matchService = matchService;
        _logger = logger;
    }

    /// <summary>
    /// Health check endpoint
    /// </summary>
    [HttpGet("health")]
    [AllowAnonymous]
    public IActionResult Health()
    {
        return Ok(new
        {
            status = "healthy",
            service = "Match.Service",
            timestamp = DateTime.UtcNow
        });
    }

    /// <summary>
    /// Get match details by ID
    /// </summary>
    [HttpGet("{matchId}")]
    public async Task<IActionResult> GetMatch(Guid matchId)
    {
        var result = await _matchService.GetMatchAsync(matchId);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Get active matches
    /// </summary>
    [HttpGet("active")]
    public async Task<IActionResult> GetActiveMatches([FromQuery] Guid? worldId = null)
    {
        var result = await _matchService.GetActiveMatchesAsync(worldId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get match history for current player
    /// </summary>
    [HttpGet("history")]
    public async Task<IActionResult> GetMatchHistory([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var playerId = GetUserIdFromClaims();
        if (playerId == Guid.Empty)
        {
            return Unauthorized("Invalid user");
        }

        var result = await _matchService.GetMatchHistoryAsync(playerId, page, pageSize);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// End match (internal/admin use)
    /// </summary>
    [HttpPost("{matchId}/end")]
    public async Task<IActionResult> EndMatch(Guid matchId, [FromBody] EndMatchRequest request)
    {
        var result = await _matchService.EndMatchAsync(matchId, request);
        return result.Success ? Ok(result) : BadRequest(result);
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
