using GamePlatform.Common.Constants;
using GamePlatform.Contracts.Common;
using GamePlatform.Infrastructure.Redis;
using GamePlatform.Player.Service.Data;
using GamePlatform.Player.Service.Models;
using Microsoft.EntityFrameworkCore;

namespace GamePlatform.Player.Service.Services;

/// <summary>
/// Player DTOs
/// </summary>
public class PlayerDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int WorldId { get; set; }
    public string DisplayName { get; set; } = string.Empty;
    public int Level { get; set; }
    public long Experience { get; set; }
    public int Coins { get; set; }
    public int Gems { get; set; }
    public string AvatarUrl { get; set; } = string.Empty;
    public DateTime LastLoginAt { get; set; }
    public long ExperienceToNextLevel { get; set; }
    public int ExperienceProgress { get; set; }
    public PlayerStatisticsDto? Statistics { get; set; }
}

public class PlayerStatisticsDto
{
    public int GamesPlayed { get; set; }
    public int GamesWon { get; set; }
    public int GamesLost { get; set; }
    public int TotalKills { get; set; }
    public int TotalDeaths { get; set; }
    public double WinRate { get; set; }
    public double KillDeathRatio { get; set; }
    public TimeSpan TotalPlayTime { get; set; }
    public int CurrentWinStreak { get; set; }
    public int BestWinStreak { get; set; }
}

public class AchievementDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string IconUrl { get; set; } = string.Empty;
    public int Points { get; set; }
    public string Category { get; set; } = string.Empty;
    public bool IsSecret { get; set; }
    public DateTime? EarnedAt { get; set; }
    public int Progress { get; set; }
}

public class InventoryItemDto
{
    public int Id { get; set; }
    public string ItemType { get; set; } = string.Empty;
    public string ItemId { get; set; } = string.Empty;
    public string ItemName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public bool IsEquipped { get; set; }
    public DateTime? AcquiredAt { get; set; }
}

public class CreatePlayerRequest
{
    public int UserId { get; set; }
    public int WorldId { get; set; }
    public string DisplayName { get; set; } = string.Empty;
}

public class UpdatePlayerRequest
{
    public string? DisplayName { get; set; }
    public string? AvatarUrl { get; set; }
}

public class AddExperienceRequest
{
    public long Amount { get; set; }
}

public class AddInventoryItemRequest
{
    public string ItemType { get; set; } = string.Empty;
    public string ItemId { get; set; } = string.Empty;
    public string ItemName { get; set; } = string.Empty;
    public int Quantity { get; set; } = 1;
}

/// <summary>
/// Player service interface
/// Follows Interface Segregation Principle
/// </summary>
public interface IPlayerService
{
    Task<ApiResponse<PlayerDto>> GetPlayerByIdAsync(int playerId);
    Task<ApiResponse<PlayerDto>> GetPlayerByUserIdAsync(int userId);
    Task<ApiResponse<PlayerDto>> CreatePlayerAsync(CreatePlayerRequest request);
    Task<ApiResponse<PlayerDto>> UpdatePlayerAsync(int playerId, UpdatePlayerRequest request);
    Task<ApiResponse<PlayerDto>> AddExperienceAsync(int playerId, long amount);
    Task<ApiResponse<IEnumerable<AchievementDto>>> GetPlayerAchievementsAsync(int playerId);
    Task<ApiResponse<AchievementDto>> EarnAchievementAsync(int playerId, int achievementId);
    Task<ApiResponse<IEnumerable<InventoryItemDto>>> GetPlayerInventoryAsync(int playerId);
    Task<ApiResponse<InventoryItemDto>> AddInventoryItemAsync(int playerId, AddInventoryItemRequest request);
    Task<ApiResponse<bool>> UpdateLastLoginAsync(int playerId);
}

/// <summary>
/// Player service implementation
/// Implements SOLID principles and uses Repository pattern
/// </summary>
public class PlayerService : IPlayerService
{
    private readonly PlayerDbContext _context;
    private readonly IRedisCacheService _cache;
    private readonly ILogger<PlayerService> _logger;

    public PlayerService(
        PlayerDbContext context,
        IRedisCacheService cache,
        ILogger<PlayerService> logger)
    {
        _context = context;
        _cache = cache;
        _logger = logger;
    }

    public async Task<ApiResponse<PlayerDto>> GetPlayerByIdAsync(int playerId)
    {
        try
        {
            var cacheKey = $"player:{playerId}";
            var cachedPlayer = await _cache.GetAsync<PlayerDto>(cacheKey);
            if (cachedPlayer != null)
            {
                _logger.LogInformation("Retrieved player {PlayerId} from cache", playerId);
                return ApiResponse<PlayerDto>.SuccessResponse(cachedPlayer);
            }

            var player = await _context.Players
                .Include(p => p.Statistics)
                .FirstOrDefaultAsync(p => p.Id == playerId);

            if (player == null)
            {
                return ApiResponse<PlayerDto>.ErrorResponse(
                    "Player not found",
                    new List<string> { $"Player with ID {playerId} does not exist" });
            }

            var playerDto = MapToDto(player);
            await _cache.SetAsync(cacheKey, playerDto, TimeSpan.FromMinutes(10));

            _logger.LogInformation("Retrieved player {PlayerId}: {DisplayName}", playerId, player.DisplayName);
            return ApiResponse<PlayerDto>.SuccessResponse(playerDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting player {PlayerId}", playerId);
            return ApiResponse<PlayerDto>.ErrorResponse(
                "Failed to retrieve player",
                new List<string> { "An error occurred while retrieving the player" });
        }
    }

    public async Task<ApiResponse<PlayerDto>> GetPlayerByUserIdAsync(int userId)
    {
        try
        {
            var cacheKey = $"player:user:{userId}";
            var cachedPlayer = await _cache.GetAsync<PlayerDto>(cacheKey);
            if (cachedPlayer != null)
            {
                _logger.LogInformation("Retrieved player for user {UserId} from cache", userId);
                return ApiResponse<PlayerDto>.SuccessResponse(cachedPlayer);
            }

            var player = await _context.Players
                .Include(p => p.Statistics)
                .FirstOrDefaultAsync(p => p.UserId == userId);

            if (player == null)
            {
                return ApiResponse<PlayerDto>.ErrorResponse(
                    "Player not found",
                    new List<string> { $"Player for user ID {userId} does not exist" });
            }

            var playerDto = MapToDto(player);
            await _cache.SetAsync(cacheKey, playerDto, TimeSpan.FromMinutes(10));

            _logger.LogInformation("Retrieved player for user {UserId}: {DisplayName}", userId, player.DisplayName);
            return ApiResponse<PlayerDto>.SuccessResponse(playerDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting player for user {UserId}", userId);
            return ApiResponse<PlayerDto>.ErrorResponse(
                "Failed to retrieve player",
                new List<string> { "An error occurred while retrieving the player" });
        }
    }

    public async Task<ApiResponse<PlayerDto>> CreatePlayerAsync(CreatePlayerRequest request)
    {
        try
        {
            // Check if player already exists for this user
            if (await _context.Players.AnyAsync(p => p.UserId == request.UserId))
            {
                return ApiResponse<PlayerDto>.ErrorResponse(
                    "Player already exists",
                    new List<string> { "A player already exists for this user" });
            }

            // Check if display name is taken
            if (await _context.Players.AnyAsync(p => p.DisplayName == request.DisplayName))
            {
                return ApiResponse<PlayerDto>.ErrorResponse(
                    "Display name taken",
                    new List<string> { "This display name is already in use" });
            }

            var player = new Player
            {
                UserId = request.UserId,
                WorldId = request.WorldId,
                DisplayName = request.DisplayName,
                Level = 1,
                Experience = 0,
                Coins = 1000, // Starting amount
                Gems = 0,
                LastLoginAt = DateTime.UtcNow
            };

            _context.Players.Add(player);

            // Create statistics record
            var statistics = new PlayerStatistics
            {
                PlayerId = player.Id
            };

            _context.PlayerStatistics.Add(statistics);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Created new player: {PlayerId} - {DisplayName} for user {UserId}",
                player.Id, player.DisplayName, request.UserId);

            var playerDto = MapToDto(player);
            playerDto.Statistics = new PlayerStatisticsDto();

            // Cache the new player
            await _cache.SetAsync($"player:{player.Id}", playerDto, TimeSpan.FromMinutes(10));
            await _cache.SetAsync($"player:user:{request.UserId}", playerDto, TimeSpan.FromMinutes(10));

            return ApiResponse<PlayerDto>.SuccessResponse(playerDto, "Player created successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating player");
            return ApiResponse<PlayerDto>.ErrorResponse(
                "Failed to create player",
                new List<string> { "An error occurred while creating the player" });
        }
    }

    public async Task<ApiResponse<PlayerDto>> UpdatePlayerAsync(int playerId, UpdatePlayerRequest request)
    {
        try
        {
            var player = await _context.Players
                .Include(p => p.Statistics)
                .FirstOrDefaultAsync(p => p.Id == playerId);

            if (player == null)
            {
                return ApiResponse<PlayerDto>.ErrorResponse(
                    "Player not found",
                    new List<string> { $"Player with ID {playerId} does not exist" });
            }

            // Update properties
            if (!string.IsNullOrEmpty(request.DisplayName))
            {
                // Check if new display name is taken
                if (await _context.Players.AnyAsync(p => p.DisplayName == request.DisplayName && p.Id != playerId))
                {
                    return ApiResponse<PlayerDto>.ErrorResponse(
                        "Display name taken",
                        new List<string> { "This display name is already in use" });
                }
                player.DisplayName = request.DisplayName;
            }

            if (!string.IsNullOrEmpty(request.AvatarUrl))
            {
                player.AvatarUrl = request.AvatarUrl;
            }

            player.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Updated player {PlayerId}: {DisplayName}", playerId, player.DisplayName);

            // Invalidate cache
            await _cache.RemoveAsync($"player:{playerId}");
            await _cache.RemoveAsync($"player:user:{player.UserId}");

            return ApiResponse<PlayerDto>.SuccessResponse(MapToDto(player), "Player updated successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating player {PlayerId}", playerId);
            return ApiResponse<PlayerDto>.ErrorResponse(
                "Failed to update player",
                new List<string> { "An error occurred while updating the player" });
        }
    }

    public async Task<ApiResponse<PlayerDto>> AddExperienceAsync(int playerId, long amount)
    {
        try
        {
            var player = await _context.Players
                .Include(p => p.Statistics)
                .FirstOrDefaultAsync(p => p.Id == playerId);

            if (player == null)
            {
                return ApiResponse<PlayerDto>.ErrorResponse(
                    "Player not found",
                    new List<string> { $"Player with ID {playerId} does not exist" });
            }

            player.Experience += amount;

            // Level up logic
            while (player.Experience >= player.ExperienceToNextLevel)
            {
                player.Experience -= player.ExperienceToNextLevel;
                player.Level++;
                _logger.LogInformation("Player {PlayerId} leveled up to {Level}", playerId, player.Level);
            }

            // Update highest level
            if (player.Statistics != null && player.Level > player.Statistics.HighestLevel)
            {
                player.Statistics.HighestLevel = player.Level;
            }

            await _context.SaveChangesAsync();

            // Invalidate cache
            await _cache.RemoveAsync($"player:{playerId}");
            await _cache.RemoveAsync($"player:user:{player.UserId}");

            return ApiResponse<PlayerDto>.SuccessResponse(MapToDto(player), "Experience added successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding experience to player {PlayerId}", playerId);
            return ApiResponse<PlayerDto>.ErrorResponse(
                "Failed to add experience",
                new List<string> { "An error occurred while adding experience" });
        }
    }

    public async Task<ApiResponse<IEnumerable<AchievementDto>>> GetPlayerAchievementsAsync(int playerId)
    {
        try
        {
            var cacheKey = $"player:{playerId}:achievements";
            var cachedAchievements = await _cache.GetAsync<List<AchievementDto>>(cacheKey);
            if (cachedAchievements != null)
            {
                return ApiResponse<IEnumerable<AchievementDto>>.SuccessResponse(cachedAchievements);
            }

            var playerAchievements = await _context.PlayerAchievements
                .Include(pa => pa.Achievement)
                .Where(pa => pa.PlayerId == playerId)
                .ToListAsync();

            var achievementDtos = playerAchievements.Select(pa => new AchievementDto
            {
                Id = pa.Achievement.Id,
                Name = pa.Achievement.Name,
                Description = pa.Achievement.Description,
                IconUrl = pa.Achievement.IconUrl,
                Points = pa.Achievement.Points,
                Category = pa.Achievement.Category,
                IsSecret = pa.Achievement.IsSecret,
                EarnedAt = pa.EarnedAt,
                Progress = pa.Progress
            }).ToList();

            await _cache.SetAsync(cacheKey, achievementDtos, TimeSpan.FromMinutes(15));

            return ApiResponse<IEnumerable<AchievementDto>>.SuccessResponse(achievementDtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting achievements for player {PlayerId}", playerId);
            return ApiResponse<IEnumerable<AchievementDto>>.ErrorResponse(
                "Failed to retrieve achievements",
                new List<string> { "An error occurred while retrieving achievements" });
        }
    }

    public async Task<ApiResponse<AchievementDto>> EarnAchievementAsync(int playerId, int achievementId)
    {
        try
        {
            // Check if player already has this achievement
            if (await _context.PlayerAchievements.AnyAsync(pa => pa.PlayerId == playerId && pa.AchievementId == achievementId))
            {
                return ApiResponse<AchievementDto>.ErrorResponse(
                    "Achievement already earned",
                    new List<string> { "Player already has this achievement" });
            }

            var achievement = await _context.Achievements.FindAsync(achievementId);
            if (achievement == null)
            {
                return ApiResponse<AchievementDto>.ErrorResponse(
                    "Achievement not found",
                    new List<string> { $"Achievement with ID {achievementId} does not exist" });
            }

            var playerAchievement = new PlayerAchievement
            {
                PlayerId = playerId,
                AchievementId = achievementId,
                EarnedAt = DateTime.UtcNow,
                Progress = 100
            };

            _context.PlayerAchievements.Add(playerAchievement);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Player {PlayerId} earned achievement {AchievementId}: {AchievementName}",
                playerId, achievementId, achievement.Name);

            // Invalidate cache
            await _cache.RemoveAsync($"player:{playerId}:achievements");

            var achievementDto = new AchievementDto
            {
                Id = achievement.Id,
                Name = achievement.Name,
                Description = achievement.Description,
                IconUrl = achievement.IconUrl,
                Points = achievement.Points,
                Category = achievement.Category,
                IsSecret = achievement.IsSecret,
                EarnedAt = playerAchievement.EarnedAt,
                Progress = 100
            };

            return ApiResponse<AchievementDto>.SuccessResponse(achievementDto, "Achievement earned!");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error earning achievement for player {PlayerId}", playerId);
            return ApiResponse<AchievementDto>.ErrorResponse(
                "Failed to earn achievement",
                new List<string> { "An error occurred while earning the achievement" });
        }
    }

    public async Task<ApiResponse<IEnumerable<InventoryItemDto>>> GetPlayerInventoryAsync(int playerId)
    {
        try
        {
            var cacheKey = $"player:{playerId}:inventory";
            var cachedInventory = await _cache.GetAsync<List<InventoryItemDto>>(cacheKey);
            if (cachedInventory != null)
            {
                return ApiResponse<IEnumerable<InventoryItemDto>>.SuccessResponse(cachedInventory);
            }

            var inventory = await _context.InventoryItems
                .Where(i => i.PlayerId == playerId)
                .OrderBy(i => i.ItemType)
                .ThenBy(i => i.ItemName)
                .ToListAsync();

            var inventoryDtos = inventory.Select(i => new InventoryItemDto
            {
                Id = i.Id,
                ItemType = i.ItemType,
                ItemId = i.ItemId,
                ItemName = i.ItemName,
                Quantity = i.Quantity,
                IsEquipped = i.IsEquipped,
                AcquiredAt = i.AcquiredAt
            }).ToList();

            await _cache.SetAsync(cacheKey, inventoryDtos, TimeSpan.FromMinutes(10));

            return ApiResponse<IEnumerable<InventoryItemDto>>.SuccessResponse(inventoryDtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting inventory for player {PlayerId}", playerId);
            return ApiResponse<IEnumerable<InventoryItemDto>>.ErrorResponse(
                "Failed to retrieve inventory",
                new List<string> { "An error occurred while retrieving inventory" });
        }
    }

    public async Task<ApiResponse<InventoryItemDto>> AddInventoryItemAsync(int playerId, AddInventoryItemRequest request)
    {
        try
        {
            // Check if item already exists in inventory
            var existingItem = await _context.InventoryItems
                .FirstOrDefaultAsync(i => i.PlayerId == playerId && i.ItemId == request.ItemId);

            if (existingItem != null)
            {
                // Update quantity
                existingItem.Quantity += request.Quantity;
                await _context.SaveChangesAsync();

                _logger.LogInformation("Updated inventory item for player {PlayerId}: {ItemName} (Quantity: {Quantity})",
                    playerId, request.ItemName, existingItem.Quantity);

                await _cache.RemoveAsync($"player:{playerId}:inventory");

                return ApiResponse<InventoryItemDto>.SuccessResponse(new InventoryItemDto
                {
                    Id = existingItem.Id,
                    ItemType = existingItem.ItemType,
                    ItemId = existingItem.ItemId,
                    ItemName = existingItem.ItemName,
                    Quantity = existingItem.Quantity,
                    IsEquipped = existingItem.IsEquipped,
                    AcquiredAt = existingItem.AcquiredAt
                }, "Item quantity updated");
            }

            var newItem = new InventoryItem
            {
                PlayerId = playerId,
                ItemType = request.ItemType,
                ItemId = request.ItemId,
                ItemName = request.ItemName,
                Quantity = request.Quantity,
                AcquiredAt = DateTime.UtcNow
            };

            _context.InventoryItems.Add(newItem);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Added inventory item for player {PlayerId}: {ItemName}",
                playerId, request.ItemName);

            await _cache.RemoveAsync($"player:{playerId}:inventory");

            var itemDto = new InventoryItemDto
            {
                Id = newItem.Id,
                ItemType = newItem.ItemType,
                ItemId = newItem.ItemId,
                ItemName = newItem.ItemName,
                Quantity = newItem.Quantity,
                IsEquipped = newItem.IsEquipped,
                AcquiredAt = newItem.AcquiredAt
            };

            return ApiResponse<InventoryItemDto>.SuccessResponse(itemDto, "Item added to inventory");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding inventory item for player {PlayerId}", playerId);
            return ApiResponse<InventoryItemDto>.ErrorResponse(
                "Failed to add inventory item",
                new List<string> { "An error occurred while adding the item" });
        }
    }

    public async Task<ApiResponse<bool>> UpdateLastLoginAsync(int playerId)
    {
        try
        {
            var player = await _context.Players.FindAsync(playerId);
            if (player == null)
            {
                return ApiResponse<bool>.ErrorResponse(
                    "Player not found",
                    new List<string> { $"Player with ID {playerId} does not exist" });
            }

            player.LastLoginAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            await _cache.RemoveAsync($"player:{playerId}");
            await _cache.RemoveAsync($"player:user:{player.UserId}");

            return ApiResponse<bool>.SuccessResponse(true, "Last login updated");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating last login for player {PlayerId}", playerId);
            return ApiResponse<bool>.ErrorResponse(
                "Failed to update last login",
                new List<string> { "An error occurred while updating last login" });
        }
    }

    private PlayerDto MapToDto(Player player)
    {
        return new PlayerDto
        {
            Id = player.Id,
            UserId = player.UserId,
            WorldId = player.WorldId,
            DisplayName = player.DisplayName,
            Level = player.Level,
            Experience = player.Experience,
            Coins = player.Coins,
            Gems = player.Gems,
            AvatarUrl = player.AvatarUrl,
            LastLoginAt = player.LastLoginAt,
            ExperienceToNextLevel = player.ExperienceToNextLevel,
            ExperienceProgress = player.ExperienceProgress,
            Statistics = player.Statistics != null ? new PlayerStatisticsDto
            {
                GamesPlayed = player.Statistics.GamesPlayed,
                GamesWon = player.Statistics.GamesWon,
                GamesLost = player.Statistics.GamesLost,
                TotalKills = player.Statistics.TotalKills,
                TotalDeaths = player.Statistics.TotalDeaths,
                WinRate = player.Statistics.WinRate,
                KillDeathRatio = player.Statistics.KillDeathRatio,
                TotalPlayTime = player.Statistics.TotalPlayTime,
                CurrentWinStreak = player.Statistics.CurrentWinStreak,
                BestWinStreak = player.Statistics.BestWinStreak
            } : null
        };
    }
}
