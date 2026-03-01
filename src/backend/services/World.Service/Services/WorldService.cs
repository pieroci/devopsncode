using GamePlatform.Common.Constants;
using GamePlatform.Contracts.Common;
using GamePlatform.Contracts.World;
using GamePlatform.Infrastructure.Redis;
using GamePlatform.World.Service.Data;
using GamePlatform.World.Service.Models;
using Microsoft.EntityFrameworkCore;

namespace GamePlatform.World.Service.Services;

/// <summary>
/// World service interface
/// Follows Interface Segregation Principle
/// </summary>
public interface IWorldService
{
    Task<ApiResponse<IEnumerable<WorldDto>>> GetAllWorldsAsync();
    Task<ApiResponse<IEnumerable<WorldDto>>> GetAvailableWorldsAsync();
    Task<ApiResponse<WorldDto>> GetWorldByIdAsync(int worldId);
    Task<ApiResponse<WorldDto>> CreateWorldAsync(CreateWorldRequest request);
    Task<ApiResponse<WorldDto>> UpdateWorldAsync(int worldId, UpdateWorldRequest request);
    Task<ApiResponse<bool>> IncrementPlayerCountAsync(int worldId);
    Task<ApiResponse<bool>> DecrementPlayerCountAsync(int worldId);
}

/// <summary>
/// World service implementation
/// Implements SOLID principles and uses Repository pattern
/// </summary>
public class WorldService : IWorldService
{
    private readonly WorldDbContext _context;
    private readonly IRedisCacheService _cache;
    private readonly ILogger<WorldService> _logger;

    public WorldService(
        WorldDbContext context,
        IRedisCacheService cache,
        ILogger<WorldService> logger)
    {
        _context = context;
        _cache = cache;
        _logger = logger;
    }

    public async Task<ApiResponse<IEnumerable<WorldDto>>> GetAllWorldsAsync()
    {
        try
        {
            // Try to get from cache first
            var cacheKey = RedisKeys.WorldListKey();
            var cachedWorlds = await _cache.GetAsync<List<WorldDto>>(cacheKey);
            if (cachedWorlds != null)
            {
                _logger.LogInformation("Retrieved {Count} worlds from cache", cachedWorlds.Count);
                return ApiResponse<IEnumerable<WorldDto>>.SuccessResponse(cachedWorlds);
            }

            // Get from database
            var worlds = await _context.Worlds
                .Include(w => w.Statistics)
                .OrderBy(w => w.Id)
                .ToListAsync();

            var worldDtos = worlds.Select(MapToDto).ToList();

            // Cache for 5 minutes
            await _cache.SetAsync(cacheKey, worldDtos, TimeSpan.FromMinutes(5));

            _logger.LogInformation("Retrieved {Count} worlds from database", worlds.Count);
            return ApiResponse<IEnumerable<WorldDto>>.SuccessResponse(worldDtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all worlds");
            return ApiResponse<IEnumerable<WorldDto>>.ErrorResponse(
                "Failed to retrieve worlds",
                new List<string> { "An error occurred while retrieving worlds" });
        }
    }

    public async Task<ApiResponse<IEnumerable<WorldDto>>> GetAvailableWorldsAsync()
    {
        try
        {
            var cacheKey = RedisKeys.WorldAvailableListKey();
            var cachedWorlds = await _cache.GetAsync<List<WorldDto>>(cacheKey);
            if (cachedWorlds != null)
            {
                _logger.LogInformation("Retrieved {Count} available worlds from cache", cachedWorlds.Count);
                return ApiResponse<IEnumerable<WorldDto>>.SuccessResponse(cachedWorlds);
            }

            // Get active worlds that are not full
            var worlds = await _context.Worlds
                .Include(w => w.Statistics)
                .Where(w => w.IsActive && w.CurrentPlayers < w.MaxCapacity)
                .OrderBy(w => w.CurrentPlayers) // Show least populated first
                .ToListAsync();

            var worldDtos = worlds.Select(MapToDto).ToList();

            // Cache for 2 minutes (shorter TTL for availability data)
            await _cache.SetAsync(cacheKey, worldDtos, TimeSpan.FromMinutes(2));

            _logger.LogInformation("Retrieved {Count} available worlds", worlds.Count);
            return ApiResponse<IEnumerable<WorldDto>>.SuccessResponse(worldDtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting available worlds");
            return ApiResponse<IEnumerable<WorldDto>>.ErrorResponse(
                "Failed to retrieve available worlds",
                new List<string> { "An error occurred while retrieving available worlds" });
        }
    }

    public async Task<ApiResponse<WorldDto>> GetWorldByIdAsync(int worldId)
    {
        try
        {
            var cacheKey = RedisKeys.WorldKey(worldId);
            var cachedWorld = await _cache.GetAsync<WorldDto>(cacheKey);
            if (cachedWorld != null)
            {
                _logger.LogInformation("Retrieved world {WorldId} from cache", worldId);
                return ApiResponse<WorldDto>.SuccessResponse(cachedWorld);
            }

            var world = await _context.Worlds
                .Include(w => w.Statistics)
                .FirstOrDefaultAsync(w => w.Id == worldId);

            if (world == null)
            {
                return ApiResponse<WorldDto>.ErrorResponse(
                    "World not found",
                    new List<string> { $"World with ID {worldId} does not exist" });
            }

            var worldDto = MapToDto(world);
            await _cache.SetAsync(cacheKey, worldDto, TimeSpan.FromMinutes(5));

            _logger.LogInformation("Retrieved world {WorldId}: {WorldName}", worldId, world.Name);
            return ApiResponse<WorldDto>.SuccessResponse(worldDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting world {WorldId}", worldId);
            return ApiResponse<WorldDto>.ErrorResponse(
                "Failed to retrieve world",
                new List<string> { "An error occurred while retrieving the world" });
        }
    }

    public async Task<ApiResponse<WorldDto>> CreateWorldAsync(CreateWorldRequest request)
    {
        try
        {
            // Check if world name already exists
            if (await _context.Worlds.AnyAsync(w => w.Name == request.Name))
            {
                return ApiResponse<WorldDto>.ErrorResponse(
                    "World name already exists",
                    new List<string> { "A world with this name already exists" });
            }

            var world = new Models.World
            {
                Name = request.Name,
                Description = request.Description ?? string.Empty,
                MaxCapacity = request.MaxCapacity,
                CurrentPlayers = 0,
                IsActive = true,
                Region = request.Region ?? "US-East",
                KubernetesNamespace = $"world-{request.Name.ToLower().Replace(" ", "-")}",
                RedisConnectionString = $"redis-world-{request.Name.ToLower().Replace(" ", "-")}:6379"
            };

            _context.Worlds.Add(world);

            // Create statistics record
            var statistics = new WorldStatistics
            {
                WorldId = world.Id,
                TotalGamesPlayed = 0,
                TotalPlayersJoined = 0,
                PeakConcurrentPlayers = 0
            };

            _context.WorldStatistics.Add(statistics);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Created new world: {WorldId} - {WorldName}", world.Id, world.Name);

            // Invalidate cache
            await InvalidateWorldCacheAsync();

            var worldDto = MapToDto(world);
            worldDto.Statistics = new WorldStatisticsDto
            {
                TotalGamesPlayed = 0,
                TotalPlayersJoined = 0,
                PeakConcurrentPlayers = 0
            };

            return ApiResponse<WorldDto>.SuccessResponse(worldDto, "World created successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating world");
            return ApiResponse<WorldDto>.ErrorResponse(
                "Failed to create world",
                new List<string> { "An error occurred while creating the world" });
        }
    }

    public async Task<ApiResponse<WorldDto>> UpdateWorldAsync(int worldId, UpdateWorldRequest request)
    {
        try
        {
            var world = await _context.Worlds
                .Include(w => w.Statistics)
                .FirstOrDefaultAsync(w => w.Id == worldId);

            if (world == null)
            {
                return ApiResponse<WorldDto>.ErrorResponse(
                    "World not found",
                    new List<string> { $"World with ID {worldId} does not exist" });
            }

            // Update properties
            if (!string.IsNullOrEmpty(request.Description))
            {
                world.Description = request.Description;
            }

            if (request.MaxCapacity.HasValue && request.MaxCapacity.Value > 0)
            {
                world.MaxCapacity = request.MaxCapacity.Value;
            }

            if (request.IsActive.HasValue)
            {
                world.IsActive = request.IsActive.Value;
            }

            world.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Updated world {WorldId}: {WorldName}", worldId, world.Name);

            // Invalidate cache
            await InvalidateWorldCacheAsync(worldId);

            return ApiResponse<WorldDto>.SuccessResponse(MapToDto(world), "World updated successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating world {WorldId}", worldId);
            return ApiResponse<WorldDto>.ErrorResponse(
                "Failed to update world",
                new List<string> { "An error occurred while updating the world" });
        }
    }

    public async Task<ApiResponse<bool>> IncrementPlayerCountAsync(int worldId)
    {
        try
        {
            var world = await _context.Worlds
                .Include(w => w.Statistics)
                .FirstOrDefaultAsync(w => w.Id == worldId);

            if (world == null)
            {
                return ApiResponse<bool>.ErrorResponse(
                    "World not found",
                    new List<string> { $"World with ID {worldId} does not exist" });
            }

            if (world.IsFull)
            {
                return ApiResponse<bool>.ErrorResponse(
                    "World is full",
                    new List<string> { "Cannot join - world has reached maximum capacity" });
            }

            world.CurrentPlayers++;
            
            // Update statistics
            if (world.Statistics != null)
            {
                world.Statistics.TotalPlayersJoined++;
                world.Statistics.LastPlayerJoinedAt = DateTime.UtcNow;
                
                if (world.CurrentPlayers > world.Statistics.PeakConcurrentPlayers)
                {
                    world.Statistics.PeakConcurrentPlayers = world.CurrentPlayers;
                }
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation("Player joined world {WorldId}: {WorldName}. Current: {CurrentPlayers}/{MaxCapacity}",
                worldId, world.Name, world.CurrentPlayers, world.MaxCapacity);

            // Update cache
            await InvalidateWorldCacheAsync(worldId);

            return ApiResponse<bool>.SuccessResponse(true, "Player count incremented");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error incrementing player count for world {WorldId}", worldId);
            return ApiResponse<bool>.ErrorResponse(
                "Failed to increment player count",
                new List<string> { "An error occurred while updating player count" });
        }
    }

    public async Task<ApiResponse<bool>> DecrementPlayerCountAsync(int worldId)
    {
        try
        {
            var world = await _context.Worlds.FirstOrDefaultAsync(w => w.Id == worldId);

            if (world == null)
            {
                return ApiResponse<bool>.ErrorResponse(
                    "World not found",
                    new List<string> { $"World with ID {worldId} does not exist" });
            }

            if (world.CurrentPlayers > 0)
            {
                world.CurrentPlayers--;
                await _context.SaveChangesAsync();

                _logger.LogInformation("Player left world {WorldId}: {WorldName}. Current: {CurrentPlayers}/{MaxCapacity}",
                    worldId, world.Name, world.CurrentPlayers, world.MaxCapacity);

                // Update cache
                await InvalidateWorldCacheAsync(worldId);
            }

            return ApiResponse<bool>.SuccessResponse(true, "Player count decremented");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error decrementing player count for world {WorldId}", worldId);
            return ApiResponse<bool>.ErrorResponse(
                "Failed to decrement player count",
                new List<string> { "An error occurred while updating player count" });
        }
    }

    private WorldDto MapToDto(Models.World world)
    {
        return new WorldDto
        {
            Id = world.Id,
            Name = world.Name,
            Description = world.Description,
            MaxCapacity = world.MaxCapacity,
            CurrentPlayers = world.CurrentPlayers,
            IsActive = world.IsActive,
            IsFull = world.IsFull,
            AvailableSlots = world.AvailableSlots,
            CapacityPercentage = world.CapacityPercentage,
            Region = world.Region,
            KubernetesNamespace = world.KubernetesNamespace,
            Status = world.IsActive ? WorldStatus.Active : WorldStatus.Inactive,
            CreatedAt = world.CreatedAt,
            Statistics = world.Statistics != null ? new WorldStatisticsDto
            {
                TotalGamesPlayed = world.Statistics.TotalGamesPlayed,
                TotalPlayersJoined = world.Statistics.TotalPlayersJoined,
                PeakConcurrentPlayers = world.Statistics.PeakConcurrentPlayers,
                LastGameStartedAt = world.Statistics.LastGameStartedAt,
                LastPlayerJoinedAt = world.Statistics.LastPlayerJoinedAt
            } : null
        };
    }

    private async Task InvalidateWorldCacheAsync(int? worldId = null)
    {
        // Invalidate list caches
        await _cache.RemoveAsync(RedisKeys.WorldListKey());
        await _cache.RemoveAsync(RedisKeys.WorldAvailableListKey());

        // Invalidate specific world cache if provided
        if (worldId.HasValue)
        {
            await _cache.RemoveAsync(RedisKeys.WorldKey(worldId.Value));
        }
    }
}
