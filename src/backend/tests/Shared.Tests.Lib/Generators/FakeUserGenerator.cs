using Bogus;

namespace GamePlatform.Tests.Shared.Generators;

/// <summary>
/// Fake data generator for User entities (Auth.Service)
/// Uses Bogus library for realistic test data
/// </summary>
public static class FakeUserGenerator
{
    private static readonly Faker _faker = new Faker();

    /// <summary>
    /// Generate a fake user with random data
    /// </summary>
    public static dynamic GenerateFakeUser(int? id = null)
    {
        return new
        {
            Id = id ?? _faker.Random.Int(1, 10000),
            Email = _faker.Internet.Email(),
            Username = _faker.Internet.UserName(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("TestPassword123!"),
            WorldId = _faker.Random.Int(1, 3),
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }

    /// <summary>
    /// Generate a list of fake users
    /// </summary>
    public static List<dynamic> GenerateFakeUsers(int count)
    {
        var users = new List<dynamic>();
        for (int i = 0; i < count; i++)
        {
            users.Add(GenerateFakeUser());
        }
        return users;
    }

    /// <summary>
    /// Generate fake registration request
    /// </summary>
    public static dynamic GenerateRegisterRequest()
    {
        var password = "TestPassword123!";
        return new
        {
            Email = _faker.Internet.Email(),
            Username = _faker.Internet.UserName(),
            Password = password,
            ConfirmPassword = password,
            WorldId = _faker.Random.Int(1, 3)
        };
    }

    /// <summary>
    /// Generate fake login request
    /// </summary>
    public static dynamic GenerateLoginRequest(string? email = null, string? password = null)
    {
        return new
        {
            EmailOrUsername = email ?? _faker.Internet.Email(),
            Password = password ?? "TestPassword123!"
        };
    }

    /// <summary>
    /// Generate fake refresh token
    /// </summary>
    public static dynamic GenerateFakeRefreshToken(int userId)
    {
        return new
        {
            Id = _faker.Random.Int(1, 10000),
            UserId = userId,
            Token = Guid.NewGuid().ToString(),
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            CreatedAt = DateTime.UtcNow,
            RevokedAt = (DateTime?)null,
            ReplacedByToken = (string?)null
        };
    }
}
