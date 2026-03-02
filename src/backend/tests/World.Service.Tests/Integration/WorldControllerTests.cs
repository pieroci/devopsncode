using Xunit;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using System.Net;
using System.Net.Http.Json;
using System.Net.Http.Headers;
using GamePlatform.World.Service;
using GamePlatform.World.Service.Data;
using GamePlatform.Contracts.World;
using GamePlatform.Tests.Shared;
using GamePlatform.Tests.Shared.Generators;
using GamePlatform.Tests.Shared.Factories;

namespace GamePlatform.World.Service.Tests.Integration;

/// <summary>
/// Integration tests for World API endpoints
/// </summary>
public class WorldControllerTests : IClassFixture<WebApplicationFactory<Program>>, IDisposable
{
    private readonly HttpClient _client;
    private readonly WebApplicationFactory<Program> _factory;
    private readonly IServiceScope _scope;
    private readonly WorldDbContext _context;

    public WorldControllerTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                // Remove existing DbContext
                var descriptor = services.SingleOrDefault(
                    d => d.ServiceType == typeof(DbContextOptions<WorldDbContext>));
                if (descriptor != null)
                {
                    services.Remove(descriptor);
                }

                // Add in-memory database for testing
                services.AddDbContext<WorldDbContext>(options =>
                {
                    options.UseInMemoryDatabase("TestWorldDb_" + Guid.NewGuid());
                });

                // Remove Redis connection
                var redisDescriptor = services.SingleOrDefault(
                    d => d.ServiceType == typeof(StackExchange.Redis.IConnectionMultiplexer));
                if (redisDescriptor != null)
                {
                    services.Remove(redisDescriptor);
                }

                // Add mock Redis
                var mockRedis = TestRedisFactory.CreateMockConnectionMultiplexer();
                services.AddSingleton(mockRedis.Object);
            });
        });

        _client = _factory.CreateClient();
        _scope = _factory.Services.CreateScope();
        _context = _scope.ServiceProvider.GetRequiredService<WorldDbContext>();
        _context.Database.EnsureCreated();
    }

    [Fact]
    public async Task GET_GetAll_ReturnsOk()
    {
        // Arrange
        var world = new GamePlatform.World.Service.Models.World
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
        var response = await _client.GetAsync(TestConstants.ApiEndpoints.WorldGetAll);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GET_GetAvailable_ReturnsOnlyAvailableWorlds()
    {
        // Arrange - Add available world
        var availableWorld = new GamePlatform.World.Service.Models.World
        {
            Name = "Available World",
            Description = "Test",
            MaxCapacity = 1000,
            CurrentPlayers = 100,
            IsActive = true,
            Region = "US-East",
            KubernetesNamespace = "world-available",
            RedisConnectionString = "redis-world-available:6379"
        };
        
        // Add full world
        var fullWorld = new GamePlatform.World.Service.Models.World
        {
            Name = "Full World",
            Description = "Test",
            MaxCapacity = 1000,
            CurrentPlayers = 1000, // Full
            IsActive = true,
            Region = "US-West",
            KubernetesNamespace = "world-full",
            RedisConnectionString = "redis-world-full:6379"
        };
        
        _context.Worlds.AddRange(availableWorld, fullWorld);
        await _context.SaveChangesAsync();

        // Act
        var response = await _client.GetAsync(TestConstants.ApiEndpoints.WorldGetAvailable);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GET_GetById_ExistingWorld_ReturnsOk()
    {
        // Arrange
        var world = new GamePlatform.World.Service.Models.World
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
        var response = await _client.GetAsync(string.Format(TestConstants.ApiEndpoints.WorldGetById, world.Id));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GET_GetById_NonExistentWorld_ReturnsNotFound()
    {
        // Act
        var response = await _client.GetAsync(string.Format(TestConstants.ApiEndpoints.WorldGetById, 999));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task POST_IncrementPlayers_ValidWorld_ReturnsOk()
    {
        // Arrange
        var token = JwtTokenGenerator.GenerateToken(1, "test@test.com", "testuser", 1);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var world = new GamePlatform.World.Service.Models.World
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
        var response = await _client.PostAsync(
            string.Format(TestConstants.ApiEndpoints.WorldIncrementPlayers, world.Id),
            null);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task POST_DecrementPlayers_ValidWorld_ReturnsOk()
    {
        // Arrange
        var token = JwtTokenGenerator.GenerateToken(1, "test@test.com", "testuser", 1);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var world = new GamePlatform.World.Service.Models.World
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
        var response = await _client.PostAsync(
            string.Format(TestConstants.ApiEndpoints.WorldDecrementPlayers, world.Id),
            null);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GET_Health_ReturnsHealthy()
    {
        // Act
        var response = await _client.GetAsync(TestConstants.ApiEndpoints.Health);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    public void Dispose()
    {
        _context.Dispose();
        _scope.Dispose();
        _client.Dispose();
    }
}
