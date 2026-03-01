using Xunit;
using Moq;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using GamePlatform.Player.Service.Data;
using GamePlatform.Player.Service.Services;
using GamePlatform.Player.Service.Models;
using GamePlatform.Infrastructure.Redis;
using GamePlatform.Tests.Shared.Factories;

namespace GamePlatform.Player.Service.Tests.Unit;

/// <summary>
/// Unit tests for PlayerService
/// Tests player management, progression, achievements, and inventory
/// </summary>
public class PlayerServiceTests : IDisposable
{
    private readonly PlayerDbContext _context;
    private readonly Mock<IRedisCacheService> _mockCache;
    private readonly Mock<ILogger<PlayerService>> _mockLogger;
    private readonly PlayerService _playerService;

    public PlayerServiceTests()
    {
        var options = new DbContextOptionsBuilder<PlayerDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new PlayerDbContext(options);

        _mockCache = TestRedisFactory.CreateMockRedisCacheService();
        _mockLogger = new Mock<ILogger<PlayerService>>();

        _playerService = new PlayerService(_context, _mockCache.Object, _mockLogger.Object);

        // Seed achievements for testing
        SeedAchievements();
    }

    private void SeedAchievements()
    {
        var achievements = new[]
        {
            new Achievement { Id = 1, Name = "First Steps", Description = "Complete first game", Points = 10, Category = "General" },
            new Achievement { Id = 2, Name = "Warrior", Description = "Win 10 games", Points = 25, Category = "Combat" },
            new Achievement { Id = 3, Name = "Champion", Description = "Win 100 games", Points = 100, Category = "Combat" }
        };
        _context.Achievements.AddRange(achievements);
        _context.SaveChanges();
    }

    [Fact]
    public async Task CreatePlayerAsync_ValidRequest_ReturnsSuccess()
    {
        // Arrange
        var request = new CreatePlayerRequest
        {
            UserId = 100,
            WorldId = 1,
            DisplayName = "TestPlayer"
        };

        // Act
        var result = await _playerService.CreatePlayerAsync(request);

        // Assert
        result.Success.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.DisplayName.Should().Be("TestPlayer");
        result.Data.Level.Should().Be(1);
        result.Data.Experience.Should().Be(0);
        result.Data.Coins.Should().Be(1000); // Starting amount
        result.Data.Statistics.Should().NotBeNull();
    }

    [Fact]
    public async Task CreatePlayerAsync_DuplicateUserId_ReturnsFailed()
    {
        // Arrange
        var player = new Player
        {
            UserId = 100,
            WorldId = 1,
            DisplayName = "Existing",
            Level = 1
        };
        _context.Players.Add(player);
        await _context.SaveChangesAsync();

        var request = new CreatePlayerRequest
        {
            UserId = 100, // Duplicate
            WorldId = 1,
            DisplayName = "NewPlayer"
        };

        // Act
        var result = await _playerService.CreatePlayerAsync(request);

        // Assert
        result.Success.Should().BeFalse();
        result.Message.Should().Contain("already exists");
    }

    [Fact]
    public async Task CreatePlayerAsync_DuplicateDisplayName_ReturnsFailed()
    {
        // Arrange
        var player = new Player
        {
            UserId = 100,
            WorldId = 1,
            DisplayName = "TakenName",
            Level = 1
        };
        _context.Players.Add(player);
        await _context.SaveChangesAsync();

        var request = new CreatePlayerRequest
        {
            UserId = 200,
            WorldId = 1,
            DisplayName = "TakenName" // Duplicate
        };

        // Act
        var result = await _playerService.CreatePlayerAsync(request);

        // Assert
        result.Success.Should().BeFalse();
        result.Message.Should().Contain("already in use");
    }

    [Fact]
    public async Task GetPlayerByIdAsync_ExistingPlayer_ReturnsPlayer()
    {
        // Arrange
        var player = new Player
        {
            Id = 1,
            UserId = 100,
            WorldId = 1,
            DisplayName = "TestPlayer",
            Level = 5,
            Experience = 2500,
            Coins = 5000
        };
        var stats = new PlayerStatistics
        {
            PlayerId = 1,
            GamesPlayed = 10,
            GamesWon = 6
        };
        _context.Players.Add(player);
        _context.PlayerStatistics.Add(stats);
        await _context.SaveChangesAsync();

        // Act
        var result = await _playerService.GetPlayerByIdAsync(1);

        // Assert
        result.Success.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.DisplayName.Should().Be("TestPlayer");
        result.Data.Level.Should().Be(5);
        result.Data.Statistics.Should().NotBeNull();
        result.Data.Statistics!.GamesPlayed.Should().Be(10);
    }

    [Fact]
    public async Task GetPlayerByIdAsync_NonExistentPlayer_ReturnsFailed()
    {
        // Act
        var result = await _playerService.GetPlayerByIdAsync(999);

        // Assert
        result.Success.Should().BeFalse();
        result.Message.Should().Contain("not found");
    }

    [Fact]
    public async Task GetPlayerByUserIdAsync_ExistingPlayer_ReturnsPlayer()
    {
        // Arrange
        var player = new Player
        {
            UserId = 100,
            WorldId = 1,
            DisplayName = "TestPlayer",
            Level = 1
        };
        _context.Players.Add(player);
        await _context.SaveChangesAsync();

        // Act
        var result = await _playerService.GetPlayerByUserIdAsync(100);

        // Assert
        result.Success.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.UserId.Should().Be(100);
    }

    [Fact]
    public async Task UpdatePlayerAsync_ValidUpdate_ReturnsSuccess()
    {
        // Arrange
        var player = new Player
        {
            UserId = 100,
            WorldId = 1,
            DisplayName = "OldName",
            Level = 1
        };
        _context.Players.Add(player);
        await _context.SaveChangesAsync();

        var request = new UpdatePlayerRequest
        {
            DisplayName = "NewName",
            AvatarUrl = "https://example.com/avatar.png"
        };

        // Act
        var result = await _playerService.UpdatePlayerAsync(player.Id, request);

        // Assert
        result.Success.Should().BeTrue();
        result.Data!.DisplayName.Should().Be("NewName");
        result.Data.AvatarUrl.Should().Be("https://example.com/avatar.png");
    }

    [Fact]
    public async Task AddExperienceAsync_SimpleGain_UpdatesExperience()
    {
        // Arrange
        var player = new Player
        {
            UserId = 100,
            WorldId = 1,
            DisplayName = "TestPlayer",
            Level = 1,
            Experience = 0
        };
        var stats = new PlayerStatistics { PlayerId = player.Id };
        _context.Players.Add(player);
        _context.PlayerStatistics.Add(stats);
        await _context.SaveChangesAsync();

        // Act
        var result = await _playerService.AddExperienceAsync(player.Id, 500);

        // Assert
        result.Success.Should().BeTrue();
        result.Data!.Experience.Should().Be(500);
        result.Data.Level.Should().Be(1); // Not enough to level up
    }

    [Fact]
    public async Task AddExperienceAsync_LevelUp_IncrementsLevel()
    {
        // Arrange
        var player = new Player
        {
            UserId = 100,
            WorldId = 1,
            DisplayName = "TestPlayer",
            Level = 1,
            Experience = 0
        };
        var stats = new PlayerStatistics { PlayerId = player.Id, HighestLevel = 1 };
        _context.Players.Add(player);
        _context.PlayerStatistics.Add(stats);
        await _context.SaveChangesAsync();

        // Act - Add 1500 XP (level 1 needs 1000, level 2 needs 2000)
        var result = await _playerService.AddExperienceAsync(player.Id, 1500);

        // Assert
        result.Success.Should().BeTrue();
        result.Data!.Level.Should().Be(2); // Should level up to 2
        result.Data.Experience.Should().Be(500); // 1500 - 1000 = 500 remaining
    }

    [Fact]
    public async Task AddExperienceAsync_MultipleLevelUps_HandlesCorrectly()
    {
        // Arrange
        var player = new Player
        {
            UserId = 100,
            WorldId = 1,
            DisplayName = "TestPlayer",
            Level = 1,
            Experience = 0
        };
        var stats = new PlayerStatistics { PlayerId = player.Id, HighestLevel = 1 };
        _context.Players.Add(player);
        _context.PlayerStatistics.Add(stats);
        await _context.SaveChangesAsync();

        // Act - Add 5000 XP (enough for multiple level ups)
        // Level 1->2: 1000 XP, Level 2->3: 2000 XP, Level 3->4: 3000 XP = 6000 total needed
        var result = await _playerService.AddExperienceAsync(player.Id, 5000);

        // Assert
        result.Success.Should().BeTrue();
        result.Data!.Level.Should().Be(3); // 1000 + 2000 = 3000, leaves 2000 for level 3
        result.Data.Experience.Should().Be(2000);
    }

    [Fact]
    public async Task EarnAchievementAsync_ValidAchievement_ReturnsSuccess()
    {
        // Arrange
        var player = new Player
        {
            UserId = 100,
            WorldId = 1,
            DisplayName = "TestPlayer",
            Level = 1
        };
        _context.Players.Add(player);
        await _context.SaveChangesAsync();

        // Act
        var result = await _playerService.EarnAchievementAsync(player.Id, 1); // "First Steps"

        // Assert
        result.Success.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.Name.Should().Be("First Steps");
        result.Data.Points.Should().Be(10);
    }

    [Fact]
    public async Task EarnAchievementAsync_DuplicateAchievement_ReturnsFailed()
    {
        // Arrange
        var player = new Player
        {
            UserId = 100,
            WorldId = 1,
            DisplayName = "TestPlayer",
            Level = 1
        };
        _context.Players.Add(player);
        var playerAchievement = new PlayerAchievement
        {
            PlayerId = player.Id,
            AchievementId = 1,
            EarnedAt = DateTime.UtcNow
        };
        _context.PlayerAchievements.Add(playerAchievement);
        await _context.SaveChangesAsync();

        // Act
        var result = await _playerService.EarnAchievementAsync(player.Id, 1);

        // Assert
        result.Success.Should().BeFalse();
        result.Message.Should().Contain("already");
    }

    [Fact]
    public async Task GetPlayerAchievementsAsync_ReturnsEarnedAchievements()
    {
        // Arrange
        var player = new Player
        {
            UserId = 100,
            WorldId = 1,
            DisplayName = "TestPlayer",
            Level = 1
        };
        _context.Players.Add(player);
        
        var playerAchievement = new PlayerAchievement
        {
            PlayerId = player.Id,
            AchievementId = 1,
            EarnedAt = DateTime.UtcNow,
            Progress = 100
        };
        _context.PlayerAchievements.Add(playerAchievement);
        await _context.SaveChangesAsync();

        // Act
        var result = await _playerService.GetPlayerAchievementsAsync(player.Id);

        // Assert
        result.Success.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.Should().HaveCount(1);
        result.Data!.First().Name.Should().Be("First Steps");
    }

    [Fact]
    public async Task AddInventoryItemAsync_NewItem_AddsSuccessfully()
    {
        // Arrange
        var player = new Player
        {
            UserId = 100,
            WorldId = 1,
            DisplayName = "TestPlayer",
            Level = 1
        };
        _context.Players.Add(player);
        await _context.SaveChangesAsync();

        var request = new AddInventoryItemRequest
        {
            ItemType = "Weapon",
            ItemId = "sword_001",
            ItemName = "Iron Sword",
            Quantity = 1
        };

        // Act
        var result = await _playerService.AddInventoryItemAsync(player.Id, request);

        // Assert
        result.Success.Should().BeTrue();
        result.Data!.ItemName.Should().Be("Iron Sword");
        result.Data.Quantity.Should().Be(1);
    }

    [Fact]
    public async Task AddInventoryItemAsync_ExistingItem_IncrementsQuantity()
    {
        // Arrange
        var player = new Player
        {
            UserId = 100,
            WorldId = 1,
            DisplayName = "TestPlayer",
            Level = 1
        };
        _context.Players.Add(player);
        
        var existingItem = new InventoryItem
        {
            PlayerId = player.Id,
            ItemType = "Weapon",
            ItemId = "sword_001",
            ItemName = "Iron Sword",
            Quantity = 1
        };
        _context.InventoryItems.Add(existingItem);
        await _context.SaveChangesAsync();

        var request = new AddInventoryItemRequest
        {
            ItemType = "Weapon",
            ItemId = "sword_001",
            ItemName = "Iron Sword",
            Quantity = 2
        };

        // Act
        var result = await _playerService.AddInventoryItemAsync(player.Id, request);

        // Assert
        result.Success.Should().BeTrue();
        result.Data!.Quantity.Should().Be(3); // 1 + 2 = 3
    }

    [Fact]
    public async Task GetPlayerInventoryAsync_ReturnsAllItems()
    {
        // Arrange
        var player = new Player
        {
            UserId = 100,
            WorldId = 1,
            DisplayName = "TestPlayer",
            Level = 1
        };
        _context.Players.Add(player);
        
        var items = new[]
        {
            new InventoryItem { PlayerId = player.Id, ItemType = "Weapon", ItemId = "sword_001", ItemName = "Sword", Quantity = 1 },
            new InventoryItem { PlayerId = player.Id, ItemType = "Armor", ItemId = "armor_001", ItemName = "Armor", Quantity = 1 }
        };
        _context.InventoryItems.AddRange(items);
        await _context.SaveChangesAsync();

        // Act
        var result = await _playerService.GetPlayerInventoryAsync(player.Id);

        // Assert
        result.Success.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.Should().HaveCount(2);
    }

    [Fact]
    public async Task UpdateLastLoginAsync_UpdatesTimestamp()
    {
        // Arrange
        var oldLoginTime = DateTime.UtcNow.AddDays(-1);
        var player = new Player
        {
            UserId = 100,
            WorldId = 1,
            DisplayName = "TestPlayer",
            Level = 1,
            LastLoginAt = oldLoginTime
        };
        _context.Players.Add(player);
        await _context.SaveChangesAsync();

        // Act
        var result = await _playerService.UpdateLastLoginAsync(player.Id);

        // Assert
        result.Success.Should().BeTrue();
        
        var updatedPlayer = await _context.Players.FindAsync(player.Id);
        updatedPlayer!.LastLoginAt.Should().BeAfter(oldLoginTime);
    }

    public void Dispose()
    {
        _context.Dispose();
    }
}
