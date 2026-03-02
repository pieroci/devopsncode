using GamePlatform.Match.Service.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace GamePlatform.Match.Service.Controllers;

/// <summary>
/// Controller for leaderboard operations
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
[Authorize]
public class LeaderboardController : ControllerBase
{
    private readonly ILeaderboardService _leaderboardService;
    private readonly ILogger<LeaderboardController> _logger;

    public LeaderboardController(
        ILeaderboardService leaderboardService,
        ILogger<LeaderboardController> logger)
    {
        _leaderboardService = leaderboardService;
        _logger = logger;
    }

    /// <summary>
    /// Get global leaderboard (top players)
    /// </summary>
    [HttpGet("global")]
    [AllowAnonymous]
    public async Task<IActionResult> GetGlobalLeaderboard([FromQuery] int top = 100)
    {
        var result = await _leaderboardService.GetGlobalLeaderboardAsync(top);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get player's rank
    /// </summary>
    [HttpGet("rank")]
    public async Task<IActionResult> GetPlayerRank()
    {
        var playerId = GetUserIdFromClaims();
        if (playerId == Guid.Empty)
        {
            return Unauthorized("Invalid user");
        }

        var result = await _leaderboardService.GetPlayerRankAsync(playerId);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Get specific player's rank by ID
    /// </summary>
    [HttpGet("rank/{playerId}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetPlayerRankById(Guid playerId)
    {
        var result = await _leaderboardService.GetPlayerRankAsync(playerId);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Refresh leaderboard cache (admin)
    /// </summary>
    [HttpPost("refresh")]
    public async Task<IActionResult> RefreshLeaderboard()
    {
        var result = await _leaderboardService.RefreshLeaderboardAsync();
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
