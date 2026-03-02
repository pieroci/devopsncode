using Xunit;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using System.Net;
using System.Net.Http.Json;
using System.Net.Http.Headers;
using GamePlatform.Player.Service;
using GamePlatform.Player.Service.Data;
using GamePlatform.Player.Service.Services;
using GamePlatform.Tests.Shared;
using GamePlatform.Tests.Shared.Generators;

namespace GamePlatform.Player.Service.Tests.Integration;

/// <summary>
/// Integration tests for Player API endpoints
/// </summary>
public class PlayerControllerTests : IClassFixture<WebApplicationFactory<Program>>, IDisposable
{
    private readonly HttpClient _client;
    private readonly WebApplicationFactory<Program> _factory;
    private readonly IServiceScope _scope;
    private readonly PlayerDbContext _context;

    public PlayerControllerTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                var descriptor = services.SingleOrDefault(
                    d => d.ServiceType == typeof(DbContextOptions<PlayerDbContext>));
                if (descriptor != null)
                {
                    services.Remove(descriptor);
                }

                services.AddDbContext<PlayerDbContext>(options =>
                {
                    options.UseInMemoryDatabase("TestPlayerDb_" + Guid.NewGuid());
                });
            });
        });

        _client = _factory.CreateClient();
        _scope = _factory.Services.CreateScope();
        _context = _scope.ServiceProvider.GetRequiredService<PlayerDbContext>();
        _context.Database.EnsureCreated();

        // Add JWT token for authentication
        var token = JwtTokenGenerator.GenerateToken(1, "test@test.com", "testuser", 1);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
    }

    [Fact]
    public async Task POST_CreatePlayer_ValidRequest_ReturnsCreated()
    {
        // Arrange
        var request = new CreatePlayerRequest
        {
            UserId = 100,
            WorldId = 1,
            DisplayName = "TestPlayer"
        };

        // Act
        var response = await _client.PostAsJsonAsync(TestConstants.ApiEndpoints.PlayerCreate, request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
    }

    [Fact]
    public async Task GET_GetPlayerById_ExistingPlayer_ReturnsOk()
    {
        // Arrange
        var player = new GamePlatform.Player.Service.Models.Player
        {
            UserId = 100,
            WorldId = 1,
            DisplayName = "TestPlayer",
            Level = 5,
            Experience = 2500
        };
        _context.Players.Add(player);
        await _context.SaveChangesAsync();

        // Act
        var response = await _client.GetAsync(string.Format(TestConstants.ApiEndpoints.PlayerGetById, player.Id));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task POST_AddExperience_ValidRequest_ReturnsOk()
    {
        // Arrange
        var player = new GamePlatform.Player.Service.Models.Player
        {
            UserId = 100,
            WorldId = 1,
            DisplayName = "TestPlayer",
            Level = 1,
            Experience = 0
        };
        _context.Players.Add(player);
        await _context.SaveChangesAsync();

        var request = new AddExperienceRequest { Amount = 500 };

        // Act
        var response = await _client.PostAsJsonAsync(
            string.Format(TestConstants.ApiEndpoints.PlayerAddExperience, player.Id), 
            request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GET_GetAchievements_ReturnsOk()
    {
        // Arrange
        var player = new GamePlatform.Player.Service.Models.Player
        {
            UserId = 100,
            WorldId = 1,
            DisplayName = "TestPlayer",
            Level = 1
        };
        _context.Players.Add(player);
        await _context.SaveChangesAsync();

        // Act
        var response = await _client.GetAsync(
            string.Format(TestConstants.ApiEndpoints.PlayerGetAchievements, player.Id));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task POST_AddInventoryItem_ValidRequest_ReturnsOk()
    {
        // Arrange
        var player = new GamePlatform.Player.Service.Models.Player
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
        var response = await _client.PostAsJsonAsync(
            string.Format(TestConstants.ApiEndpoints.PlayerAddInventoryItem, player.Id),
            request);

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
