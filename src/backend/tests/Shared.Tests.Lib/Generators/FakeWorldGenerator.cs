using Bogus;

namespace GamePlatform.Tests.Shared.Generators;

/// <summary>
/// Fake data generator for World entities (World.Service)
/// </summary>
public static class FakeWorldGenerator
{
    private static readonly Faker _faker = new Faker();

    /// <summary>
    /// Generate a fake world with random data
    /// </summary>
    public static dynamic GenerateFakeWorld(int? id = null)
    {
        var maxPlayers = _faker.Random.Int(100, 10000);
        var currentPlayers = _faker.Random.Int(0, maxPlayers - 1);

        return new
        {
            Id = id ?? _faker.Random.Int(1, 100),
            Name = _faker.Address.City() + " World",
            Region = _faker.PickRandom(new[] { "US-East", "US-West", "EU-West", "EU-Central", "Asia-Pacific" }),
            MaxPlayers = maxPlayers,
            CurrentPlayers = currentPlayers,
            Status = _faker.PickRandom(new[] { "Active", "Maintenance", "Full" }),
            KubernetesNamespace = $"world-{_faker.Random.Int(1, 100)}",
            RedisConnectionString = $"redis-world-{_faker.Random.Int(1, 100)}:6379",
            CreatedAt = DateTime.UtcNow.AddDays(-30),
            UpdatedAt = DateTime.UtcNow
        };
    }

    /// <summary>
    /// Generate a list of fake worlds
    /// </summary>
    public static List<dynamic> GenerateFakeWorlds(int count)
    {
        var worlds = new List<dynamic>();
        for (int i = 0; i < count; i++)
        {
            worlds.Add(GenerateFakeWorld());
        }
        return worlds;
    }

    /// <summary>
    /// Generate fake world statistics
    /// </summary>
    public static dynamic GenerateFakeWorldStatistics(int worldId)
    {
        return new
        {
            Id = _faker.Random.Int(1, 1000),
            WorldId = worldId,
            TotalGamesPlayed = _faker.Random.Int(0, 100000),
            PeakPlayers = _faker.Random.Int(0, 10000),
            AveragePlayersPerDay = _faker.Random.Int(0, 5000),
            TotalPlayTimeHours = _faker.Random.Long(0, 1000000),
            LastResetAt = DateTime.UtcNow.AddDays(-7),
            CreatedAt = DateTime.UtcNow.AddDays(-30),
            UpdatedAt = DateTime.UtcNow
        };
    }

    /// <summary>
    /// Generate fake create world request
    /// </summary>
    public static dynamic GenerateCreateWorldRequest()
    {
        return new
        {
            Name = _faker.Address.City() + " World",
            Region = _faker.PickRandom(new[] { "US-East", "US-West", "EU-West", "EU-Central", "Asia-Pacific" }),
            MaxPlayers = _faker.Random.Int(1000, 10000)
        };
    }

    /// <summary>
    /// Generate a fake available world (with capacity)
    /// </summary>
    public static dynamic GenerateAvailableWorld(int? id = null)
    {
        var maxPlayers = _faker.Random.Int(1000, 10000);
        var currentPlayers = _faker.Random.Int(0, (int)(maxPlayers * 0.8)); // 80% capacity max

        return new
        {
            Id = id ?? _faker.Random.Int(1, 100),
            Name = _faker.Address.City() + " World",
            Region = _faker.PickRandom(new[] { "US-East", "US-West", "EU-West" }),
            MaxPlayers = maxPlayers,
            CurrentPlayers = currentPlayers,
            Status = "Active",
            KubernetesNamespace = $"world-{_faker.Random.Int(1, 100)}",
            RedisConnectionString = $"redis-world-{_faker.Random.Int(1, 100)}:6379",
            CreatedAt = DateTime.UtcNow.AddDays(-30),
            UpdatedAt = DateTime.UtcNow
        };
    }
}
