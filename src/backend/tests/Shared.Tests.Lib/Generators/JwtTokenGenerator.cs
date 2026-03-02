using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace GamePlatform.Tests.Shared.Generators;

/// <summary>
/// JWT token generator for testing authentication
/// </summary>
public static class JwtTokenGenerator
{
    private const string DefaultSecretKey = "TestSecretKeyForJWTTokenGeneration12345678901234567890";
    private const string DefaultIssuer = "GamePlatform.Auth.Test";
    private const string DefaultAudience = "GamePlatform.Test";

    /// <summary>
    /// Generate a valid JWT token for testing
    /// </summary>
    public static string GenerateToken(
        int userId, 
        string email, 
        string? username = null,
        int? worldId = null,
        TimeSpan? expiresIn = null)
    {
        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(DefaultSecretKey));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(ClaimTypes.Email, email),
            new Claim(JwtRegisteredClaimNames.Sub, userId.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, email),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        if (!string.IsNullOrEmpty(username))
        {
            claims.Add(new Claim(ClaimTypes.Name, username));
            claims.Add(new Claim(JwtRegisteredClaimNames.UniqueName, username));
        }

        if (worldId.HasValue)
        {
            claims.Add(new Claim("WorldId", worldId.Value.ToString()));
        }

        var token = new JwtSecurityToken(
            issuer: DefaultIssuer,
            audience: DefaultAudience,
            claims: claims,
            expires: DateTime.UtcNow.Add(expiresIn ?? TimeSpan.FromHours(1)),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    /// <summary>
    /// Generate token validation parameters for testing
    /// </summary>
    public static TokenValidationParameters GetTokenValidationParameters()
    {
        return new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = DefaultIssuer,
            ValidAudience = DefaultAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(DefaultSecretKey)),
            ClockSkew = TimeSpan.Zero
        };
    }

    /// <summary>
    /// Get secret key for testing
    /// </summary>
    public static string GetSecretKey() => DefaultSecretKey;

    /// <summary>
    /// Get issuer for testing
    /// </summary>
    public static string GetIssuer() => DefaultIssuer;

    /// <summary>
    /// Get audience for testing
    /// </summary>
    public static string GetAudience() => DefaultAudience;
}
