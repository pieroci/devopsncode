using GamePlatform.Player.Service.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GamePlatform.Player.Service.Controllers;

/// <summary>
/// Player management controller
/// Follows RESTful API best practices
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
[Authorize]
public class PlayerController : ControllerBase
{
    private readonly IPlayerService _playerService;
    private readonly ILogger<PlayerController> _logger;

    public PlayerController(IPlayerService playerService, ILogger<PlayerController> logger)
    {
        _playerService = playerService;
        _logger = logger;
    }

    /// <summary>
    /// Get player by ID
    /// </summary>
    [HttpGet("{playerId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int playerId)
    {
        _logger.LogInformation("Getting player {PlayerId}", playerId);
        var result = await _playerService.GetPlayerByIdAsync(playerId);
        
        if (!result.Success)
        {
            return NotFound(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Get player by user ID
    /// </summary>
    [HttpGet("user/{userId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByUserId(int userId)
    {
        _logger.LogInformation("Getting player for user {UserId}", userId);
        var result = await _playerService.GetPlayerByUserIdAsync(userId);
        
        if (!result.Success)
        {
            return NotFound(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Create a new player
    /// </summary>
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreatePlayerRequest request)
    {
        _logger.LogInformation("Creating new player: {DisplayName}", request.DisplayName);
        var result = await _playerService.CreatePlayerAsync(request);
        
        if (!result.Success)
        {
            return BadRequest(result);
        }

        return CreatedAtAction(nameof(GetById), new { playerId = result.Data!.Id }, result);
    }

    /// <summary>
    /// Update player profile
    /// </summary>
    [HttpPut("{playerId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(int playerId, [FromBody] UpdatePlayerRequest request)
    {
        _logger.LogInformation("Updating player {PlayerId}", playerId);
        var result = await _playerService.UpdatePlayerAsync(playerId, request);
        
        if (!result.Success)
        {
            return NotFound(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Add experience to player
    /// </summary>
    [HttpPost("{playerId}/experience")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AddExperience(int playerId, [FromBody] AddExperienceRequest request)
    {
        _logger.LogInformation("Adding {Amount} XP to player {PlayerId}", request.Amount, playerId);
        var result = await _playerService.AddExperienceAsync(playerId, request.Amount);
        
        if (!result.Success)
        {
            return NotFound(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Get player achievements
    /// </summary>
    [HttpGet("{playerId}/achievements")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAchievements(int playerId)
    {
        _logger.LogInformation("Getting achievements for player {PlayerId}", playerId);
        var result = await _playerService.GetPlayerAchievementsAsync(playerId);
        return Ok(result);
    }

    /// <summary>
    /// Earn an achievement
    /// </summary>
    [HttpPost("{playerId}/achievements/{achievementId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> EarnAchievement(int playerId, int achievementId)
    {
        _logger.LogInformation("Player {PlayerId} earning achievement {AchievementId}", playerId, achievementId);
        var result = await _playerService.EarnAchievementAsync(playerId, achievementId);
        
        if (!result.Success)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Get player inventory
    /// </summary>
    [HttpGet("{playerId}/inventory")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetInventory(int playerId)
    {
        _logger.LogInformation("Getting inventory for player {PlayerId}", playerId);
        var result = await _playerService.GetPlayerInventoryAsync(playerId);
        return Ok(result);
    }

    /// <summary>
    /// Add item to player inventory
    /// </summary>
    [HttpPost("{playerId}/inventory")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> AddInventoryItem(int playerId, [FromBody] AddInventoryItemRequest request)
    {
        _logger.LogInformation("Adding item to player {PlayerId} inventory: {ItemName}", playerId, request.ItemName);
        var result = await _playerService.AddInventoryItemAsync(playerId, request);
        
        if (!result.Success)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Update last login timestamp
    /// </summary>
    [HttpPost("{playerId}/login")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateLastLogin(int playerId)
    {
        _logger.LogInformation("Updating last login for player {PlayerId}", playerId);
        var result = await _playerService.UpdateLastLoginAsync(playerId);
        
        if (!result.Success)
        {
            return NotFound(result);
        }

        return Ok(result);
    }
}
