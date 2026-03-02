namespace GamePlatform.Game.Service.Models;

/// <summary>
/// Game session entity
/// Represents an active or completed game session
/// </summary>
public class GameSession
{
    public Guid Id { get; set; }
    public int WorldId { get; set; }
    public string WorldName { get; set; } = string.Empty;
    public GameSessionState State { get; set; }
    public int MaxPlayers { get; set; } = 10;
    public int CurrentPlayers { get; set; }
    public DateTime StartedAt { get; set; }
    public DateTime? EndedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation properties
    public ICollection<PlayerGameState> Players { get; set; } = new List<PlayerGameState>();
    public ICollection<GameEvent> Events { get; set; } = new List<GameEvent>();

    // Computed properties
    public bool IsFull => CurrentPlayers >= MaxPlayers;
    public bool IsActive => State == GameSessionState.InProgress || State == GameSessionState.Starting;
    public TimeSpan? Duration => EndedAt.HasValue ? EndedAt.Value - StartedAt : DateTime.UtcNow - StartedAt;
}

/// <summary>
/// Game session state enum
/// </summary>
public enum GameSessionState
{
    Waiting = 0,
    Starting = 1,
    InProgress = 2,
    Paused = 3,
    Ended = 4,
    Cancelled = 5
}
