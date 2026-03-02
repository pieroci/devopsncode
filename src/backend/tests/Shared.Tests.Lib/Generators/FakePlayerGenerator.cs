using Bogus;

namespace GamePlatform.Tests.Shared.Generators;

/// <summary>
/// Fake data generator for Player entities (Player.Service)
/// </summary>
public static class FakePlayerGenerator
{
    private static readonly Faker _faker = new Faker();

    /// <summary>
    /// Generate a fake player with random data
    /// </summary>
    public static dynamic GenerateFakePlayer(int? id = null, int? userId = null, int? worldId = null)
    {
        return new
        {
            Id = id ?? _faker.Random.Int(1, 10000),
            UserId = userId ?? _faker.Random.Int(1, 1000),
            WorldId = worldId ?? _faker.Random.Int(1, 3),
            DisplayName = _faker.Internet.UserName(),
            Level = _faker.Random.Int(1, 50),
            Experience = _faker.Random.Long(0, 50000),
            Coins = _faker.Random.Int(100, 100000),
            Gems = _faker.Random.Int(0, 1000),
            AvatarUrl = _faker.Internet.Avatar(),
            LastLoginAt = DateTime.UtcNow,
            IsBanned = false,
            BanReason = (string?)null,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }

    /// <summary>
    /// Generate a list of fake players
    /// </summary>
    public static List<dynamic> GenerateFakePlayers(int count)
    {
        var players = new List<dynamic>();
        for (int i = 0; i < count; i++)
        {
            players.Add(GenerateFakePlayer());
        }
        return players;
    }

    /// <summary>
    /// Generate fake player statistics
    /// </summary>
    public static dynamic GenerateFakePlayerStatistics(int playerId)
    {
        var gamesPlayed = _faker.Random.Int(0, 1000);
        var gamesWon = _faker.Random.Int(0, gamesPlayed);
        
        return new
        {
            Id = _faker.Random.Int(1, 10000),
            PlayerId = playerId,
            GamesPlayed = gamesPlayed,
            GamesWon = gamesWon,
            GamesLost = gamesPlayed - gamesWon,
            TotalKills = _faker.Random.Int(0, 5000),
            TotalDeaths = _faker.Random.Int(0, 3000),
            TotalPlayTimeSeconds = _faker.Random.Long(0, 1000000),
            HighestLevel = _faker.Random.Int(1, 100),
            CurrentWinStreak = _faker.Random.Int(0, 20),
            BestWinStreak = _faker.Random.Int(0, 50),
            LastGamePlayedAt = DateTime.UtcNow.AddHours(-1),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }

    /// <summary>
    /// Generate fake create player request
    /// </summary>
    public static dynamic GenerateCreatePlayerRequest(int? userId = null, int? worldId = null)
    {
        return new
        {
            UserId = userId ?? _faker.Random.Int(1, 1000),
            WorldId = worldId ?? _faker.Random.Int(1, 3),
            DisplayName = _faker.Internet.UserName()
        };
    }

    /// <summary>
    /// Generate fake achievement
    /// </summary>
    public static dynamic GenerateFakeAchievement(int? id = null)
    {
        return new
        {
            Id = id ?? _faker.Random.Int(1, 100),
            Name = _faker.Lorem.Word(),
            Description = _faker.Lorem.Sentence(),
            IconUrl = _faker.Internet.Avatar(),
            Points = _faker.Random.Int(10, 200),
            Category = _faker.PickRandom(new[] { "General", "Combat", "Social", "Secret" }),
            IsSecret = _faker.Random.Bool(),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }

    /// <summary>
    /// Generate fake inventory item
    /// </summary>
    public static dynamic GenerateFakeInventoryItem(int playerId)
    {
        return new
        {
            Id = _faker.Random.Int(1, 10000),
            PlayerId = playerId,
            ItemType = _faker.PickRandom(new[] { "Weapon", "Armor", "Consumable", "Quest" }),
            ItemId = $"item_{_faker.Random.Int(1, 1000)}",
            ItemName = _faker.Commerce.ProductName(),
            Quantity = _faker.Random.Int(1, 99),
            IsEquipped = _faker.Random.Bool(),
            AcquiredAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }
}
