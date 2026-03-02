namespace GamePlatform.Contracts.World;

/// <summary>
/// World information
/// </summary>
public class WorldDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int MaxCapacity { get; set; }
    public int CurrentPlayers { get; set; }
    public bool IsActive { get; set; }
    public bool IsFull { get; set; }
    public int AvailableSlots { get; set; }
    public decimal CapacityPercentage { get; set; }
    public string Region { get; set; } = string.Empty;
    public string KubernetesNamespace { get; set; } = string.Empty;
    public WorldStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public WorldStatisticsDto? Statistics { get; set; }
}

/// <summary>
/// World statistics
/// </summary>
public class WorldStatisticsDto
{
    public int TotalGamesPlayed { get; set; }
    public int TotalPlayersJoined { get; set; }
    public int PeakConcurrentPlayers { get; set; }
    public DateTime? LastGameStartedAt { get; set; }
    public DateTime? LastPlayerJoinedAt { get; set; }
}

/// <summary>
/// World status enum
/// </summary>
public enum WorldStatus
{
    Active,
    Inactive,
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
    public int MaxCapacity { get; set; } = 1000;
    public string Region { get; set; } = string.Empty;
}

/// <summary>
/// Update world request
/// </summary>
public class UpdateWorldRequest
{
    public string? Description { get; set; }
    public int? MaxCapacity { get; set; }
    public bool? IsActive { get; set; }
}
