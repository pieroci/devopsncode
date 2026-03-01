namespace GamePlatform.Match.Service.Models;

/// <summary>
/// Represents a player's participation in a match
/// </summary>
public class MatchPlayer
{
    public Guid Id { get; set; }
    public Guid MatchId { get; set; }
    public Guid PlayerId { get; set; }
    public int TeamId { get; set; }
    public int Score { get; set; }
    public int Kills { get; set; }
    public int Deaths { get; set; }
    public int Assists { get; set; }
    public int EloBefore { get; set; }
    public int EloAfter { get; set; }
    public int EloChange { get; set; }
    public DateTime CreatedAt { get; set; }
    
    // Navigation property
    public MatchEntity? Match { get; set; }
}
