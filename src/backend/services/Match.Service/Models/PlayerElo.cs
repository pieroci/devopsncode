namespace GamePlatform.Match.Service.Models;

/// <summary>
/// Tracks player ELO rating and competitive stats
/// </summary>
public class PlayerElo
{
    public Guid Id { get; set; }
    public Guid PlayerId { get; set; }
    public int CurrentElo { get; set; } = 1200; // Starting ELO
    public int HighestElo { get; set; } = 1200;
    public string Rank { get; set; } = "Silver";
    public int GamesPlayed { get; set; }
    public int Wins { get; set; }
    public int Losses { get; set; }
    public int Draws { get; set; }
    public int WinStreak { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime CreatedAt { get; set; }
}
