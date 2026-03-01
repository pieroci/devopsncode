using GamePlatform.Auth.Service.Data;
using GamePlatform.Auth.Service.Models;
using GamePlatform.Common.Constants;
using GamePlatform.Contracts.Auth;
using GamePlatform.Contracts.Common;
using GamePlatform.Infrastructure.Redis;
using GamePlatform.Security.Encryption;
using GamePlatform.Security.JWT;
using Microsoft.EntityFrameworkCore;

namespace GamePlatform.Auth.Service.Services;

/// <summary>
/// Authentication service interface
/// Follows Interface Segregation Principle
/// </summary>
public interface IAuthService
{
    Task<ApiResponse<AuthResponse>> RegisterAsync(RegisterRequest request);
    Task<ApiResponse<AuthResponse>> LoginAsync(LoginRequest request);
    Task<ApiResponse<AuthResponse>> RefreshTokenAsync(RefreshTokenRequest request);
    Task<ApiResponse<bool>> RevokeTokenAsync(string token);
}

/// <summary>
/// Authentication service implementation
/// Implements SOLID principles and uses Repository pattern
/// </summary>
public class AuthService : IAuthService
{
    private readonly AuthDbContext _context;
    private readonly IJwtTokenService _jwtService;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IRedisCacheService _cache;
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        AuthDbContext context,
        IJwtTokenService jwtService,
        IPasswordHasher passwordHasher,
        IRedisCacheService cache,
        ILogger<AuthService> logger)
    {
        _context = context;
        _jwtService = jwtService;
        _passwordHasher = passwordHasher;
        _cache = cache;
        _logger = logger;
    }

    public async Task<ApiResponse<AuthResponse>> RegisterAsync(RegisterRequest request)
    {
        try
        {
            // Check if username already exists
            if (await _context.Users.AnyAsync(u => u.Username == request.Username))
            {
                return ApiResponse<AuthResponse>.ErrorResponse(
                    "Username already exists",
                    new List<string> { "Username must be unique" });
            }

            // Check if email already exists
            if (await _context.Users.AnyAsync(u => u.Email == request.Email))
            {
                return ApiResponse<AuthResponse>.ErrorResponse(
                    "Email already exists",
                    new List<string> { "Email must be unique" });
            }

            // Create new user
            var user = new User
            {
                Id = Guid.NewGuid(),
                Username = request.Username,
                Email = request.Email,
                PasswordHash = _passwordHasher.HashPassword(request.Password),
                WorldId = request.SelectedWorldId,
                IsActive = true,
                EmailVerified = false
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            _logger.LogInformation("User registered: {UserId}, Username: {Username}, WorldId: {WorldId}",
                user.Id, user.Username, user.WorldId);

            // Generate tokens
            var accessToken = _jwtService.GenerateAccessToken(
                user.Id, user.Username, user.Email, user.WorldId);
            var refreshToken = _jwtService.GenerateRefreshToken();

            // Save refresh token
            var refreshTokenEntity = new RefreshToken
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                Token = refreshToken,
                ExpiresAt = DateTime.UtcNow.AddDays(7)
            };

            _context.RefreshTokens.Add(refreshTokenEntity);
            await _context.SaveChangesAsync();

            // Cache user data
            await CacheUserAsync(user);

            var response = new AuthResponse
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                ExpiresAt = DateTime.UtcNow.AddHours(1),
                User = MapToUserDto(user)
            };

            return ApiResponse<AuthResponse>.SuccessResponse(response, "Registration successful");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during registration for username: {Username}", request.Username);
            return ApiResponse<AuthResponse>.ErrorResponse(
                "Registration failed",
                new List<string> { "An error occurred during registration" });
        }
    }

    public async Task<ApiResponse<AuthResponse>> LoginAsync(LoginRequest request)
    {
        try
        {
            // Find user by email or username
            var user = await _context.Users
                .FirstOrDefaultAsync(u =>
                    u.Email == request.EmailOrUsername ||
                    u.Username == request.EmailOrUsername);

            if (user == null)
            {
                return ApiResponse<AuthResponse>.ErrorResponse(
                    "Invalid credentials",
                    new List<string> { "Email/Username or password is incorrect" });
            }

            // Verify password
            if (!_passwordHasher.VerifyPassword(request.Password, user.PasswordHash))
            {
                return ApiResponse<AuthResponse>.ErrorResponse(
                    "Invalid credentials",
                    new List<string> { "Email/Username or password is incorrect" });
            }

            if (!user.IsActive)
            {
                return ApiResponse<AuthResponse>.ErrorResponse(
                    "Account is disabled",
                    new List<string> { "Please contact support" });
            }

            // Update last login
            user.LastLoginAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            _logger.LogInformation("User logged in: {UserId}, Username: {Username}", user.Id, user.Username);

            // Generate tokens
            var accessToken = _jwtService.GenerateAccessToken(
                user.Id, user.Username, user.Email, user.WorldId);
            var refreshToken = _jwtService.GenerateRefreshToken();

            // Save refresh token
            var refreshTokenEntity = new RefreshToken
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                Token = refreshToken,
                ExpiresAt = DateTime.UtcNow.AddDays(7)
            };

            _context.RefreshTokens.Add(refreshTokenEntity);
            await _context.SaveChangesAsync();

            // Cache user data
            await CacheUserAsync(user);

            var response = new AuthResponse
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                ExpiresAt = DateTime.UtcNow.AddHours(1),
                User = MapToUserDto(user)
            };

            return ApiResponse<AuthResponse>.SuccessResponse(response, "Login successful");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during login for: {EmailOrUsername}", request.EmailOrUsername);
            return ApiResponse<AuthResponse>.ErrorResponse(
                "Login failed",
                new List<string> { "An error occurred during login" });
        }
    }

    public async Task<ApiResponse<AuthResponse>> RefreshTokenAsync(RefreshTokenRequest request)
    {
        try
        {
            var refreshToken = await _context.RefreshTokens
                .Include(rt => rt.User)
                .FirstOrDefaultAsync(rt => rt.Token == request.RefreshToken);

            if (refreshToken == null || !refreshToken.IsActive)
            {
                return ApiResponse<AuthResponse>.ErrorResponse(
                    "Invalid refresh token",
                    new List<string> { "Refresh token is invalid or expired" });
            }

            var user = refreshToken.User;

            // Revoke old token
            refreshToken.IsRevoked = true;
            refreshToken.RevokedAt = DateTime.UtcNow;

            // Generate new tokens
            var newAccessToken = _jwtService.GenerateAccessToken(
                user.Id, user.Username, user.Email, user.WorldId);
            var newRefreshToken = _jwtService.GenerateRefreshToken();

            // Save new refresh token
            var newRefreshTokenEntity = new RefreshToken
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                Token = newRefreshToken,
                ExpiresAt = DateTime.UtcNow.AddDays(7)
            };

            refreshToken.ReplacedByToken = newRefreshToken;
            _context.RefreshTokens.Add(newRefreshTokenEntity);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Token refreshed for user: {UserId}", user.Id);

            var response = new AuthResponse
            {
                AccessToken = newAccessToken,
                RefreshToken = newRefreshToken,
                ExpiresAt = DateTime.UtcNow.AddHours(1),
                User = MapToUserDto(user)
            };

            return ApiResponse<AuthResponse>.SuccessResponse(response, "Token refreshed successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during token refresh");
            return ApiResponse<AuthResponse>.ErrorResponse(
                "Token refresh failed",
                new List<string> { "An error occurred during token refresh" });
        }
    }

    public async Task<ApiResponse<bool>> RevokeTokenAsync(string token)
    {
        try
        {
            var refreshToken = await _context.RefreshTokens
                .FirstOrDefaultAsync(rt => rt.Token == token);

            if (refreshToken == null)
            {
                return ApiResponse<bool>.ErrorResponse(
                    "Token not found",
                    new List<string> { "Refresh token not found" });
            }

            refreshToken.IsRevoked = true;
            refreshToken.RevokedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Token revoked: {TokenId}", refreshToken.Id);

            return ApiResponse<bool>.SuccessResponse(true, "Token revoked successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during token revocation");
            return ApiResponse<bool>.ErrorResponse(
                "Token revocation failed",
                new List<string> { "An error occurred during token revocation" });
        }
    }

    private async Task CacheUserAsync(User user)
    {
        var cacheKey = RedisKeys.PlayerKey(user.Id);
        await _cache.SetAsync(cacheKey, user, TimeSpan.FromMinutes(GameConstants.PlayerCacheDurationSeconds / 60));
    }

    private UserDto MapToUserDto(User user)
    {
        return new UserDto
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            WorldId = user.WorldId,
            WorldName = $"World-{user.WorldId}", // TODO: Get from World service
            CreatedAt = user.CreatedAt
        };
    }
}
