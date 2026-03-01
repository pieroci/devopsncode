using GamePlatform.Infrastructure.Database;

namespace GamePlatform.Player.Service.Models;

/// <summary>
/// Player entity - represents a game player
/// Follows Single Responsibility Principle
/// </summary>
public class Player : BaseEntity
{
    public int Id { get; set; }
    public int UserId { get; set; } // Foreign key to Auth.Service User
    public int WorldId { get; set; } // Foreign key to World.Service World
    public string DisplayName { get; set; } = string.Empty;
    public int Level { get; set; } = 1;
    public long Experience { get; set; } = 0;
    public int Coins { get; set; } = 1000; // Starting currency
    public int Gems { get; set; } = 0; // Premium currency
    public string AvatarUrl { get; set; } = string.Empty;
    public DateTime LastLoginAt { get; set; } = DateTime.UtcNow;
    public bool IsBanned { get; set; } = false;
    public string? BanReason { get; set; }

    // Navigation properties
    public virtual PlayerStatistics? Statistics { get; set; }
    public virtual ICollection<PlayerAchievement> Achievements { get; set; } = new List<PlayerAchievement>();
    public virtual ICollection<InventoryItem> Inventory { get; set; } = new List<InventoryItem>();

    // Computed properties
    public long ExperienceToNextLevel => Level * 1000; // Simple formula: level * 1000
    public int ExperienceProgress => (int)((double)Experience / ExperienceToNextLevel * 100);
}

/// <summary>
/// Player statistics entity for tracking gameplay metrics
/// </summary>
public class PlayerStatistics : BaseEntity
{
    public int Id { get; set; }
    public int PlayerId { get; set; }
    public int GamesPlayed { get; set; } = 0;
    public int GamesWon { get; set; } = 0;
    public int GamesLost { get; set; } = 0;
    public int TotalKills { get; set; } = 0;
    public int TotalDeaths { get; set; } = 0;
    public long TotalPlayTimeSeconds { get; set; } = 0;
    public int HighestLevel { get; set; } = 1;
    public int CurrentWinStreak { get; set; } = 0;
    public int BestWinStreak { get; set; } = 0;
    public DateTime? LastGamePlayedAt { get; set; }

    // Navigation property
    public virtual Player Player { get; set; } = null!;

    // Computed properties
    public double WinRate => GamesPlayed > 0 ? (double)GamesWon / GamesPlayed * 100 : 0;
    public double KillDeathRatio => TotalDeaths > 0 ? (double)TotalKills / TotalDeaths : TotalKills;
    public TimeSpan TotalPlayTime => TimeSpan.FromSeconds(TotalPlayTimeSeconds);
}

/// <summary>
/// Achievement definition entity
/// </summary>
public class Achievement : BaseEntity
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string IconUrl { get; set; } = string.Empty;
    public int Points { get; set; } = 10;
    public string Category { get; set; } = "General"; // General, Combat, Social, etc.
    public bool IsSecret { get; set; } = false;

    // Navigation property
    public virtual ICollection<PlayerAchievement> PlayerAchievements { get; set; } = new List<PlayerAchievement>();
}

/// <summary>
/// Player-Achievement many-to-many relationship
/// </summary>
public class PlayerAchievement : BaseEntity
{
    public int Id { get; set; }
    public int PlayerId { get; set; }
    public int AchievementId { get; set; }
    public DateTime EarnedAt { get; set; } = DateTime.UtcNow;
    public int Progress { get; set; } = 100; // Percentage: 0-100

    // Navigation properties
    public virtual Player Player { get; set; } = null!;
    public virtual Achievement Achievement { get; set; } = null!;
}

/// <summary>
/// Player inventory item entity
/// </summary>
public class InventoryItem : BaseEntity
{
    public int Id { get; set; }
    public int PlayerId { get; set; }
    public string ItemType { get; set; } = string.Empty; // Weapon, Armor, Consumable, etc.
    public string ItemId { get; set; } = string.Empty; // Unique item identifier
    public string ItemName { get; set; } = string.Empty;
    public int Quantity { get; set; } = 1;
    public bool IsEquipped { get; set; } = false;
    public DateTime? AcquiredAt { get; set; } = DateTime.UtcNow;

    // Navigation property
    public virtual Player Player { get; set; } = null!;
}
