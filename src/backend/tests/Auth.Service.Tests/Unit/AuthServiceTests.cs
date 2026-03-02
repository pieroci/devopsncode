using Xunit;
using Moq;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using GamePlatform.Auth.Service.Data;
using GamePlatform.Auth.Service.Services;
using GamePlatform.Auth.Service.Models;
using GamePlatform.Infrastructure.Redis;
using GamePlatform.Security.Services;
using GamePlatform.Tests.Shared.Generators;
using GamePlatform.Tests.Shared.Factories;

namespace GamePlatform.Auth.Service.Tests.Unit;

/// <summary>
/// Unit tests for AuthService
/// Tests business logic in isolation using mocks
/// </summary>
public class AuthServiceTests : IDisposable
{
    private readonly AuthDbContext _context;
    private readonly Mock<IRedisCacheService> _mockCache;
    private readonly Mock<ILogger<AuthService>> _mockLogger;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly AuthService _authService;

    public AuthServiceTests()
    {
        // Setup in-memory database
        var options = new DbContextOptionsBuilder<AuthDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new AuthDbContext(options);

        // Setup mocks
        _mockCache = TestRedisFactory.CreateMockRedisCacheService();
        _mockLogger = new Mock<ILogger<AuthService>>();
        
        // Real implementations for password and JWT
        _passwordHasher = new PasswordHasher();
        _jwtTokenService = new JwtTokenService(
            JwtTokenGenerator.GetSecretKey(),
            JwtTokenGenerator.GetIssuer(),
            JwtTokenGenerator.GetAudience());

        // Create service under test
        _authService = new AuthService(
            _context,
            _mockCache.Object,
            _passwordHasher,
            _jwtTokenService,
            _mockLogger.Object);
    }

    [Fact]
    public async Task RegisterAsync_ValidRequest_ReturnsSuccessWithToken()
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
        var result = await _authService.RegisterAsync(request);

        // Assert
        result.Success.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.Token.Should().NotBeNullOrEmpty();
        result.Data.RefreshToken.Should().NotBeNullOrEmpty();
        result.Data.User.Should().NotBeNull();
        result.Data.User.Email.Should().Be(request.Email);
        result.Data.User.Username.Should().Be(request.Username);

        // Verify user was saved to database
        var savedUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        savedUser.Should().NotBeNull();
        savedUser!.Email.Should().Be(request.Email);
    }

    [Fact]
    public async Task RegisterAsync_DuplicateEmail_ReturnsFailed()
    {
        // Arrange
        var existingUser = new User
        {
            Email = "existing@test.com",
            Username = "existing",
            PasswordHash = _passwordHasher.HashPassword("Password123!"),
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
        var result = await _authService.RegisterAsync(request);

        // Assert
        result.Success.Should().BeFalse();
        result.Message.Should().Contain("already exists");
    }

    [Fact]
    public async Task RegisterAsync_DuplicateUsername_ReturnsFailed()
    {
        // Arrange
        var existingUser = new User
        {
            Email = "existing@test.com",
            Username = "existinguser",
            PasswordHash = _passwordHasher.HashPassword("Password123!"),
            WorldId = 1,
            IsActive = true
        };
        _context.Users.Add(existingUser);
        await _context.SaveChangesAsync();

        var request = new RegisterRequest
        {
            Email = "newuser@test.com",
            Username = "existinguser",
            Password = "Password123!",
            ConfirmPassword = "Password123!",
            WorldId = 1
        };

        // Act
        var result = await _authService.RegisterAsync(request);

        // Assert
        result.Success.Should().BeFalse();
        result.Message.Should().Contain("already exists");
    }

    [Fact]
    public async Task LoginAsync_ValidCredentials_ReturnsSuccessWithToken()
    {
        // Arrange
        var password = "Password123!";
        var user = new User
        {
            Email = "test@test.com",
            Username = "testuser",
            PasswordHash = _passwordHasher.HashPassword(password),
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
        var result = await _authService.LoginAsync(request);

        // Assert
        result.Success.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.Token.Should().NotBeNullOrEmpty();
        result.Data.RefreshToken.Should().NotBeNullOrEmpty();
        result.Data.User.Email.Should().Be(user.Email);
    }

    [Fact]
    public async Task LoginAsync_InvalidEmail_ReturnsFailed()
    {
        // Arrange
        var request = new LoginRequest
        {
            EmailOrUsername = "nonexistent@test.com",
            Password = "Password123!"
        };

        // Act
        var result = await _authService.LoginAsync(request);

        // Assert
        result.Success.Should().BeFalse();
        result.Message.Should().Contain("Invalid");
    }

    [Fact]
    public async Task LoginAsync_InvalidPassword_ReturnsFailed()
    {
        // Arrange
        var user = new User
        {
            Email = "test@test.com",
            Username = "testuser",
            PasswordHash = _passwordHasher.HashPassword("CorrectPassword123!"),
            WorldId = 1,
            IsActive = true
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var request = new LoginRequest
        {
            EmailOrUsername = "test@test.com",
            Password = "WrongPassword123!"
        };

        // Act
        var result = await _authService.LoginAsync(request);

        // Assert
        result.Success.Should().BeFalse();
        result.Message.Should().Contain("Invalid");
    }

    [Fact]
    public async Task LoginAsync_InactiveUser_ReturnsFailed()
    {
        // Arrange
        var user = new User
        {
            Email = "test@test.com",
            Username = "testuser",
            PasswordHash = _passwordHasher.HashPassword("Password123!"),
            WorldId = 1,
            IsActive = false // Inactive user
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var request = new LoginRequest
        {
            EmailOrUsername = "test@test.com",
            Password = "Password123!"
        };

        // Act
        var result = await _authService.LoginAsync(request);

        // Assert
        result.Success.Should().BeFalse();
        result.Message.Should().Contain("inactive");
    }

    [Fact]
    public async Task RefreshTokenAsync_ValidToken_ReturnsNewTokens()
    {
        // Arrange
        var user = new User
        {
            Email = "test@test.com",
            Username = "testuser",
            PasswordHash = _passwordHasher.HashPassword("Password123!"),
            WorldId = 1,
            IsActive = true
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var refreshToken = new RefreshToken
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
        var result = await _authService.RefreshTokenAsync(request);

        // Assert
        result.Success.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.Token.Should().NotBeNullOrEmpty();
        result.Data.RefreshToken.Should().NotBeNullOrEmpty();
        result.Data.RefreshToken.Should().NotBe(refreshToken.Token); // Should be a new token

        // Verify old token was revoked
        var oldToken = await _context.RefreshTokens.FindAsync(refreshToken.Id);
        oldToken!.RevokedAt.Should().NotBeNull();
        oldToken.ReplacedByToken.Should().Be(result.Data.RefreshToken);
    }

    [Fact]
    public async Task RefreshTokenAsync_ExpiredToken_ReturnsFailed()
    {
        // Arrange
        var user = new User
        {
            Email = "test@test.com",
            Username = "testuser",
            PasswordHash = _passwordHasher.HashPassword("Password123!"),
            WorldId = 1,
            IsActive = true
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var refreshToken = new RefreshToken
        {
            UserId = user.Id,
            Token = Guid.NewGuid().ToString(),
            ExpiresAt = DateTime.UtcNow.AddDays(-1), // Expired
            CreatedAt = DateTime.UtcNow.AddDays(-8)
        };
        _context.RefreshTokens.Add(refreshToken);
        await _context.SaveChangesAsync();

        var request = new RefreshTokenRequest
        {
            RefreshToken = refreshToken.Token
        };

        // Act
        var result = await _authService.RefreshTokenAsync(request);

        // Assert
        result.Success.Should().BeFalse();
        result.Message.Should().Contain("expired");
    }

    [Fact]
    public async Task RevokeTokenAsync_ValidToken_ReturnsSuccess()
    {
        // Arrange
        var user = new User
        {
            Email = "test@test.com",
            Username = "testuser",
            PasswordHash = _passwordHasher.HashPassword("Password123!"),
            WorldId = 1,
            IsActive = true
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var refreshToken = new RefreshToken
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
        var result = await _authService.RevokeTokenAsync(request);

        // Assert
        result.Success.Should().BeTrue();

        // Verify token was revoked
        var revokedToken = await _context.RefreshTokens.FindAsync(refreshToken.Id);
        revokedToken!.RevokedAt.Should().NotBeNull();
    }

    [Fact]
    public async Task RevokeTokenAsync_InvalidToken_ReturnsFailed()
    {
        // Arrange
        var request = new RevokeTokenRequest
        {
            RefreshToken = Guid.NewGuid().ToString()
        };

        // Act
        var result = await _authService.RevokeTokenAsync(request);

        // Assert
        result.Success.Should().BeFalse();
        result.Message.Should().Contain("not found");
    }

    public void Dispose()
    {
        _context.Dispose();
    }
}
