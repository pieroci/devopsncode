namespace GamePlatform.Contracts.World;

/// <summary>
/// World information
/// </summary>
public class WorldDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int MaxPlayers { get; set; }
    public int CurrentPlayers { get; set; }
    public WorldStatus Status { get; set; }
    public string Region { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// World status enum
/// </summary>
public enum WorldStatus
{
    Active,
    Maintenance,
    Full,
    Offline
}

/// <summary>
/// Create world request
/// </summary>
public class CreateWorldRequest
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int MaxPlayers { get; set; } = 1000;
    public string Region { get; set; } = string.Empty;
}
