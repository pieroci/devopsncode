using GamePlatform.Contracts.World;
using GamePlatform.World.Service.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GamePlatform.World.Service.Controllers;

/// <summary>
/// World management controller
/// Follows RESTful API best practices
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class WorldController : ControllerBase
{
    private readonly IWorldService _worldService;
    private readonly ILogger<WorldController> _logger;

    public WorldController(IWorldService worldService, ILogger<WorldController> logger)
    {
        _worldService = worldService;
        _logger = logger;
    }

    /// <summary>
    /// Get all worlds
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll()
    {
        _logger.LogInformation("Getting all worlds");
        var result = await _worldService.GetAllWorldsAsync();
        return Ok(result);
    }

    /// <summary>
    /// Get available worlds (not full and active)
    /// </summary>
    [HttpGet("available")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAvailable()
    {
        _logger.LogInformation("Getting available worlds");
        var result = await _worldService.GetAvailableWorldsAsync();
        return Ok(result);
    }

    /// <summary>
    /// Get world by ID
    /// </summary>
    [HttpGet("{worldId}")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int worldId)
    {
        _logger.LogInformation("Getting world {WorldId}", worldId);
        var result = await _worldService.GetWorldByIdAsync(worldId);
        
        if (!result.Success)
        {
            return NotFound(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Create a new world (Admin only)
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Create([FromBody] CreateWorldRequest request)
    {
        _logger.LogInformation("Creating new world: {WorldName}", request.Name);
        var result = await _worldService.CreateWorldAsync(request);
        
        if (!result.Success)
        {
            return BadRequest(result);
        }

        return CreatedAtAction(nameof(GetById), new { worldId = result.Data!.Id }, result);
    }

    /// <summary>
    /// Update world settings (Admin only)
    /// </summary>
    [HttpPut("{worldId}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(int worldId, [FromBody] UpdateWorldRequest request)
    {
        _logger.LogInformation("Updating world {WorldId}", worldId);
        var result = await _worldService.UpdateWorldAsync(worldId, request);
        
        if (!result.Success)
        {
            return NotFound(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Increment player count for a world (Internal use)
    /// </summary>
    [HttpPost("{worldId}/increment-players")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> IncrementPlayers(int worldId)
    {
        _logger.LogInformation("Incrementing player count for world {WorldId}", worldId);
        var result = await _worldService.IncrementPlayerCountAsync(worldId);
        
        if (!result.Success)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Decrement player count for a world (Internal use)
    /// </summary>
    [HttpPost("{worldId}/decrement-players")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DecrementPlayers(int worldId)
    {
        _logger.LogInformation("Decrementing player count for world {WorldId}", worldId);
        var result = await _worldService.DecrementPlayerCountAsync(worldId);
        
        if (!result.Success)
        {
            return NotFound(result);
        }

        return Ok(result);
    }
}
