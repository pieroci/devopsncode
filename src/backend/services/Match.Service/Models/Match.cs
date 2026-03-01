namespace GamePlatform.Match.Service.Models;

/// <summary>
/// Represents a competitive match between players
/// </summary>
public class MatchEntity
{
    public Guid Id { get; set; }
    public Guid WorldId { get; set; }
    public MatchStatus Status { get; set; }
    public DateTime? StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public int? DurationSeconds { get; set; }
    public int? WinningTeamId { get; set; }
    public DateTime CreatedAt { get; set; }
    
    // Navigation properties
    public ICollection<MatchPlayer> Players { get; set; } = new List<MatchPlayer>();
}

/// <summary>
/// Match status enumeration
/// </summary>
public enum MatchStatus
{
    Pending = 0,
    InProgress = 1,
    Completed = 2,
    Cancelled = 3
}
