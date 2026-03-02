using Xunit;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using System.Net;
using System.Net.Http.Json;
using GamePlatform.Auth.Service;
using GamePlatform.Auth.Service.Data;
using GamePlatform.Auth.Service.Services;
using GamePlatform.Tests.Shared;
using GamePlatform.Tests.Shared.Generators;

namespace GamePlatform.Auth.Service.Tests.Integration;

/// <summary>
/// Integration tests for Auth API endpoints
/// Tests full HTTP request/response cycle
/// </summary>
public class AuthControllerTests : IClassFixture<WebApplicationFactory<Program>>, IDisposable
{
    private readonly HttpClient _client;
    private readonly WebApplicationFactory<Program> _factory;
    private readonly IServiceScope _scope;
    private readonly AuthDbContext _context;

    public AuthControllerTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                // Remove existing DbContext
                var descriptor = services.SingleOrDefault(
                    d => d.ServiceType == typeof(DbContextOptions<AuthDbContext>));
                if (descriptor != null)
                {
                    services.Remove(descriptor);
                }

                // Add in-memory database for testing
                services.AddDbContext<AuthDbContext>(options =>
                {
                    options.UseInMemoryDatabase("TestAuthDb_" + Guid.NewGuid());
                });
            });
        });

        _client = _factory.CreateClient();
        _scope = _factory.Services.CreateScope();
        _context = _scope.ServiceProvider.GetRequiredService<AuthDbContext>();
        _context.Database.EnsureCreated();
    }

    [Fact]
    public async Task POST_Register_ValidRequest_ReturnsCreated()
    {
        // Arrange
        var request = new RegisterRequest
        {
            Email = "newuser@test.com",
            Username = "newuser",
            Password = "Password123!",
            ConfirmPassword = "Password123!",
            WorldId = 1
        };

        // Act
        var response = await _client.PostAsJsonAsync(TestConstants.ApiEndpoints.AuthRegister, request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        
        var result = await response.Content.ReadFromJsonAsync<dynamic>();
        result.Should().NotBeNull();
    }

    [Fact]
    public async Task POST_Register_DuplicateEmail_ReturnsBadRequest()
    {
        // Arrange - Create existing user
        var existingUser = new GamePlatform.Auth.Service.Models.User
        {
            Email = "existing@test.com",
            Username = "existing",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password123!"),
            WorldId = 1,
            IsActive = true
        };
        _context.Users.Add(existingUser);
        await _context.SaveChangesAsync();

        var request = new RegisterRequest
        {
            Email = "existing@test.com",
            Username = "newuser",
            Password = "Password123!",
            ConfirmPassword = "Password123!",
            WorldId = 1
        };

        // Act
        var response = await _client.PostAsJsonAsync(TestConstants.ApiEndpoints.AuthRegister, request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task POST_Login_ValidCredentials_ReturnsOk()
    {
        // Arrange - Create user
        var password = "Password123!";
        var user = new GamePlatform.Auth.Service.Models.User
        {
            Email = "test@test.com",
            Username = "testuser",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            WorldId = 1,
            IsActive = true
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var request = new LoginRequest
        {
            EmailOrUsername = "test@test.com",
            Password = password
        };

        // Act
        var response = await _client.PostAsJsonAsync(TestConstants.ApiEndpoints.AuthLogin, request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var result = await response.Content.ReadFromJsonAsync<dynamic>();
        result.Should().NotBeNull();
    }

    [Fact]
    public async Task POST_Login_InvalidCredentials_ReturnsBadRequest()
    {
        // Arrange
        var request = new LoginRequest
        {
            EmailOrUsername = "nonexistent@test.com",
            Password = "WrongPassword123!"
        };

        // Act
        var response = await _client.PostAsJsonAsync(TestConstants.ApiEndpoints.AuthLogin, request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task POST_RefreshToken_ValidToken_ReturnsOk()
    {
        // Arrange - Create user and refresh token
        var user = new GamePlatform.Auth.Service.Models.User
        {
            Email = "test@test.com",
            Username = "testuser",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password123!"),
            WorldId = 1,
            IsActive = true
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var refreshToken = new GamePlatform.Auth.Service.Models.RefreshToken
        {
            UserId = user.Id,
            Token = Guid.NewGuid().ToString(),
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            CreatedAt = DateTime.UtcNow
        };
        _context.RefreshTokens.Add(refreshToken);
        await _context.SaveChangesAsync();

        var request = new RefreshTokenRequest
        {
            RefreshToken = refreshToken.Token
        };

        // Act
        var response = await _client.PostAsJsonAsync(TestConstants.ApiEndpoints.AuthRefresh, request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var result = await response.Content.ReadFromJsonAsync<dynamic>();
        result.Should().NotBeNull();
    }

    [Fact]
    public async Task POST_RevokeToken_ValidToken_ReturnsOk()
    {
        // Arrange - Create user and refresh token
        var user = new GamePlatform.Auth.Service.Models.User
        {
            Email = "test@test.com",
            Username = "testuser",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password123!"),
            WorldId = 1,
            IsActive = true
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var refreshToken = new GamePlatform.Auth.Service.Models.RefreshToken
        {
            UserId = user.Id,
            Token = Guid.NewGuid().ToString(),
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            CreatedAt = DateTime.UtcNow
        };
        _context.RefreshTokens.Add(refreshToken);
        await _context.SaveChangesAsync();

        var request = new RevokeTokenRequest
        {
            RefreshToken = refreshToken.Token
        };

        // Act
        var response = await _client.PostAsJsonAsync(TestConstants.ApiEndpoints.AuthRevoke, request);

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
        
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Be("Healthy");
    }

    public void Dispose()
    {
        _context.Dispose();
        _scope.Dispose();
        _client.Dispose();
    }
}
