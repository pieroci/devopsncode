using Xunit;
using Moq;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using GamePlatform.World.Service.Data;
using GamePlatform.World.Service.Services;
using GamePlatform.World.Service.Models;
using GamePlatform.Infrastructure.Redis;
using GamePlatform.Contracts.World;
using GamePlatform.Tests.Shared.Factories;

namespace GamePlatform.World.Service.Tests.Unit;

/// <summary>
/// Unit tests for WorldService
/// Tests world management, player count, and caching
/// </summary>
public class WorldServiceTests : IDisposable
{
    private readonly WorldDbContext _context;
    private readonly Mock<IRedisCacheService> _mockCache;
    private readonly Mock<ILogger<WorldService>> _mockLogger;
    private readonly WorldService _worldService;

    public WorldServiceTests()
    {
        var options = new DbContextOptionsBuilder<WorldDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new WorldDbContext(options);

        _mockCache = TestRedisFactory.CreateMockRedisCacheService();
        _mockLogger = new Mock<ILogger<WorldService>>();

        _worldService = new WorldService(_context, _mockCache.Object, _mockLogger.Object);
    }

    [Fact]
    public async Task CreateWorldAsync_ValidRequest_ReturnsSuccess()
    {
        // Arrange
        var request = new CreateWorldRequest
        {
            Name = "Test World",
            Description = "A test world",
            MaxCapacity = 1000,
            Region = "US-East"
        };

        // Act
        var result = await _worldService.CreateWorldAsync(request);

        // Assert
        result.Success.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.Name.Should().Be("Test World");
        result.Data.MaxCapacity.Should().Be(1000);
        result.Data.CurrentPlayers.Should().Be(0);
        result.Data.IsActive.Should().BeTrue();
        result.Data.Region.Should().Be("US-East");
        result.Data.Statistics.Should().NotBeNull();
    }

    [Fact]
    public async Task CreateWorldAsync_DuplicateName_ReturnsFailed()
    {
        // Arrange
        var existingWorld = new Models.World
        {
            Name = "Existing World",
            Description = "Test",
            MaxCapacity = 1000,
            CurrentPlayers = 0,
            IsActive = true,
            Region = "US-East",
            KubernetesNamespace = "world-existing",
            RedisConnectionString = "redis-world-existing:6379"
        };
        _context.Worlds.Add(existingWorld);
        await _context.SaveChangesAsync();

        var request = new CreateWorldRequest
        {
            Name = "Existing World", // Duplicate
            Description = "Another test world",
            MaxCapacity = 500
        };

        // Act
        var result = await _worldService.CreateWorldAsync(request);

        // Assert
        result.Success.Should().BeFalse();
        result.Message.Should().Contain("already exists");
    }

    [Fact]
    public async Task GetWorldByIdAsync_ExistingWorld_ReturnsWorld()
    {
        // Arrange
        var world = new Models.World
        {
            Name = "Test World",
            Description = "Test Description",
            MaxCapacity = 1000,
            CurrentPlayers = 100,
            IsActive = true,
            Region = "US-East",
            KubernetesNamespace = "world-test",
            RedisConnectionString = "redis-world-test:6379"
        };
        var statistics = new WorldStatistics
        {
            WorldId = world.Id,
            TotalGamesPlayed = 50,
            TotalPlayersJoined = 500,
            PeakConcurrentPlayers = 200
        };
        _context.Worlds.Add(world);
        _context.WorldStatistics.Add(statistics);
        await _context.SaveChangesAsync();

        // Act
        var result = await _worldService.GetWorldByIdAsync(world.Id);

        // Assert
        result.Success.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.Name.Should().Be("Test World");
        result.Data.CurrentPlayers.Should().Be(100);
        result.Data.Statistics.Should().NotBeNull();
        result.Data.Statistics!.TotalGamesPlayed.Should().Be(50);
    }

    [Fact]
    public async Task GetWorldByIdAsync_NonExistentWorld_ReturnsFailed()
    {
        // Act
        var result = await _worldService.GetWorldByIdAsync(999);

        // Assert
        result.Success.Should().BeFalse();
        result.Message.Should().Contain("not found");
    }

    [Fact]
    public async Task GetAllWorldsAsync_ReturnsAllWorlds()
    {
        // Arrange
        var worlds = new[]
        {
            new Models.World
            {
                Name = "World 1",
                Description = "Test",
                MaxCapacity = 1000,
                CurrentPlayers = 100,
                IsActive = true,
                Region = "US-East",
                KubernetesNamespace = "world-1",
                RedisConnectionString = "redis-world-1:6379"
            },
            new Models.World
            {
                Name = "World 2",
                Description = "Test",
                MaxCapacity = 2000,
                CurrentPlayers = 500,
                IsActive = true,
                Region = "EU-West",
                KubernetesNamespace = "world-2",
                RedisConnectionString = "redis-world-2:6379"
            }
        };
        _context.Worlds.AddRange(worlds);
        await _context.SaveChangesAsync();

        // Act
        var result = await _worldService.GetAllWorldsAsync();

        // Assert
        result.Success.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.Should().HaveCount(2);
    }

    [Fact]
    public async Task GetAvailableWorldsAsync_ReturnsOnlyActiveNonFullWorlds()
    {
        // Arrange
        var worlds = new[]
        {
            new Models.World
            {
                Name = "Available World",
                Description = "Test",
                MaxCapacity = 1000,
                CurrentPlayers = 100,
                IsActive = true, // Active and not full
                Region = "US-East",
                KubernetesNamespace = "world-available",
                RedisConnectionString = "redis-world-available:6379"
            },
            new Models.World
            {
                Name = "Full World",
                Description = "Test",
                MaxCapacity = 1000,
                CurrentPlayers = 1000, // Full
                IsActive = true,
                Region = "US-West",
                KubernetesNamespace = "world-full",
                RedisConnectionString = "redis-world-full:6379"
            },
            new Models.World
            {
                Name = "Inactive World",
                Description = "Test",
                MaxCapacity = 1000,
                CurrentPlayers = 50,
                IsActive = false, // Inactive
                Region = "EU-West",
                KubernetesNamespace = "world-inactive",
                RedisConnectionString = "redis-world-inactive:6379"
            }
        };
        _context.Worlds.AddRange(worlds);
        await _context.SaveChangesAsync();

        // Act
        var result = await _worldService.GetAvailableWorldsAsync();

        // Assert
        result.Success.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.Should().HaveCount(1);
        result.Data!.First().Name.Should().Be("Available World");
    }

    [Fact]
    public async Task UpdateWorldAsync_ValidUpdate_ReturnsSuccess()
    {
        // Arrange
        var world = new Models.World
        {
            Name = "Test World",
            Description = "Old Description",
            MaxCapacity = 1000,
            CurrentPlayers = 100,
            IsActive = true,
            Region = "US-East",
            KubernetesNamespace = "world-test",
            RedisConnectionString = "redis-world-test:6379"
        };
        _context.Worlds.Add(world);
        await _context.SaveChangesAsync();

        var request = new UpdateWorldRequest
        {
            Description = "New Description",
            MaxCapacity = 2000,
            IsActive = false
        };

        // Act
        var result = await _worldService.UpdateWorldAsync(world.Id, request);

        // Assert
        result.Success.Should().BeTrue();
        result.Data!.Description.Should().Be("New Description");
        result.Data.MaxCapacity.Should().Be(2000);
        result.Data.IsActive.Should().BeFalse();
    }

    [Fact]
    public async Task UpdateWorldAsync_NonExistentWorld_ReturnsFailed()
    {
        // Arrange
        var request = new UpdateWorldRequest
        {
            Description = "New Description"
        };

        // Act
        var result = await _worldService.UpdateWorldAsync(999, request);

        // Assert
        result.Success.Should().BeFalse();
        result.Message.Should().Contain("not found");
    }

    [Fact]
    public async Task IncrementPlayerCountAsync_ValidWorld_IncrementsCount()
    {
        // Arrange
        var world = new Models.World
        {
            Name = "Test World",
            Description = "Test",
            MaxCapacity = 1000,
            CurrentPlayers = 100,
            IsActive = true,
            Region = "US-East",
            KubernetesNamespace = "world-test",
            RedisConnectionString = "redis-world-test:6379"
        };
        var statistics = new WorldStatistics
        {
            WorldId = world.Id,
            TotalGamesPlayed = 0,
            TotalPlayersJoined = 100,
            PeakConcurrentPlayers = 100
        };
        _context.Worlds.Add(world);
        _context.WorldStatistics.Add(statistics);
        await _context.SaveChangesAsync();

        // Act
        var result = await _worldService.IncrementPlayerCountAsync(world.Id);

        // Assert
        result.Success.Should().BeTrue();
        
        var updatedWorld = await _context.Worlds.FindAsync(world.Id);
        updatedWorld!.CurrentPlayers.Should().Be(101);

        var updatedStats = await _context.WorldStatistics.FirstOrDefaultAsync(s => s.WorldId == world.Id);
        updatedStats!.TotalPlayersJoined.Should().Be(101);
        updatedStats.LastPlayerJoinedAt.Should().NotBeNull();
    }

    [Fact]
    public async Task IncrementPlayerCountAsync_FullWorld_ReturnsFailed()
    {
        // Arrange
        var world = new Models.World
        {
            Name = "Test World",
            Description = "Test",
            MaxCapacity = 1000,
            CurrentPlayers = 1000, // Full
            IsActive = true,
            Region = "US-East",
            KubernetesNamespace = "world-test",
            RedisConnectionString = "redis-world-test:6379"
        };
        _context.Worlds.Add(world);
        await _context.SaveChangesAsync();

        // Act
        var result = await _worldService.IncrementPlayerCountAsync(world.Id);

        // Assert
        result.Success.Should().BeFalse();
        result.Message.Should().Contain("full");
    }

    [Fact]
    public async Task IncrementPlayerCountAsync_UpdatesPeakPlayers()
    {
        // Arrange
        var world = new Models.World
        {
            Name = "Test World",
            Description = "Test",
            MaxCapacity = 1000,
            CurrentPlayers = 200,
            IsActive = true,
            Region = "US-East",
            KubernetesNamespace = "world-test",
            RedisConnectionString = "redis-world-test:6379"
        };
        var statistics = new WorldStatistics
        {
            WorldId = world.Id,
            TotalGamesPlayed = 0,
            TotalPlayersJoined = 200,
            PeakConcurrentPlayers = 200 // Current peak
        };
        _context.Worlds.Add(world);
        _context.WorldStatistics.Add(statistics);
        await _context.SaveChangesAsync();

        // Act
        var result = await _worldService.IncrementPlayerCountAsync(world.Id);

        // Assert
        result.Success.Should().BeTrue();

        var updatedStats = await _context.WorldStatistics.FirstOrDefaultAsync(s => s.WorldId == world.Id);
        updatedStats!.PeakConcurrentPlayers.Should().Be(201); // New peak
    }

    [Fact]
    public async Task DecrementPlayerCountAsync_ValidWorld_DecrementsCount()
    {
        // Arrange
        var world = new Models.World
        {
            Name = "Test World",
            Description = "Test",
            MaxCapacity = 1000,
            CurrentPlayers = 100,
            IsActive = true,
            Region = "US-East",
            KubernetesNamespace = "world-test",
            RedisConnectionString = "redis-world-test:6379"
        };
        _context.Worlds.Add(world);
        await _context.SaveChangesAsync();

        // Act
        var result = await _worldService.DecrementPlayerCountAsync(world.Id);

        // Assert
        result.Success.Should().BeTrue();

        var updatedWorld = await _context.Worlds.FindAsync(world.Id);
        updatedWorld!.CurrentPlayers.Should().Be(99);
    }

    [Fact]
    public async Task DecrementPlayerCountAsync_ZeroPlayers_RemainsZero()
    {
        // Arrange
        var world = new Models.World
        {
            Name = "Test World",
            Description = "Test",
            MaxCapacity = 1000,
            CurrentPlayers = 0, // Already zero
            IsActive = true,
            Region = "US-East",
            KubernetesNamespace = "world-test",
            RedisConnectionString = "redis-world-test:6379"
        };
        _context.Worlds.Add(world);
        await _context.SaveChangesAsync();

        // Act
        var result = await _worldService.DecrementPlayerCountAsync(world.Id);

        // Assert
        result.Success.Should().BeTrue();

        var updatedWorld = await _context.Worlds.FindAsync(world.Id);
        updatedWorld!.CurrentPlayers.Should().Be(0); // Stays at 0
    }

    [Fact]
    public async Task DecrementPlayerCountAsync_NonExistentWorld_ReturnsFailed()
    {
        // Act
        var result = await _worldService.DecrementPlayerCountAsync(999);

        // Assert
        result.Success.Should().BeFalse();
        result.Message.Should().Contain("not found");
    }

    public void Dispose()
    {
        _context.Dispose();
    }
}
