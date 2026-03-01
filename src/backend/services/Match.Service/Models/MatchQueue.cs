namespace GamePlatform.Match.Service.Models;

/// <summary>
/// Represents a player waiting in matchmaking queue
/// </summary>
public class MatchQueue
{
    public Guid Id { get; set; }
    public Guid PlayerId { get; set; }
    public int CurrentElo { get; set; }
    public GameMode PreferredMode { get; set; }
    public DateTime JoinedAt { get; set; }
    public QueueStatus Status { get; set; }
}

/// <summary>
/// Game modes for matchmaking
/// </summary>
public enum GameMode
{
    OneVsOne = 1,
    TwoVsTwo = 2,
    FourVsFour = 4
}

/// <summary>
/// Queue status
/// </summary>
public enum QueueStatus
{
    Waiting = 0,
    Matched = 1,
    TimedOut = 2,
    Cancelled = 3
}
