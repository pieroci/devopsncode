using GamePlatform.Infrastructure.Database;

namespace GamePlatform.World.Service.Models;

/// <summary>
/// World entity - represents a game world/server
/// Follows Single Responsibility Principle
/// </summary>
public class World : BaseEntity
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int MaxCapacity { get; set; } = 1000;
    public int CurrentPlayers { get; set; } = 0;
    public bool IsActive { get; set; } = true;
    public string Region { get; set; } = "US-East";
    public string KubernetesNamespace { get; set; } = string.Empty;
    public string RedisConnectionString { get; set; } = string.Empty;

    // Navigation properties
    public virtual WorldStatistics? Statistics { get; set; }

    public bool IsFull => CurrentPlayers >= MaxCapacity;
    public int AvailableSlots => MaxCapacity - CurrentPlayers;
    public double CapacityPercentage => MaxCapacity > 0 ? (double)CurrentPlayers / MaxCapacity * 100 : 0;
}

/// <summary>
/// World statistics entity for tracking world metrics
/// </summary>
public class WorldStatistics : BaseEntity
{
    public int Id { get; set; }
    public int WorldId { get; set; }
    public int TotalGamesPlayed { get; set; } = 0;
    public int TotalPlayersJoined { get; set; } = 0;
    public int PeakConcurrentPlayers { get; set; } = 0;
    public DateTime? LastGameStartedAt { get; set; }
    public DateTime? LastPlayerJoinedAt { get; set; }

    // Navigation property
    public virtual World World { get; set; } = null!;
}
