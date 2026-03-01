namespace GamePlatform.Game.Service.Models;

/// <summary>
/// Game event entity
/// Records all actions and events during a game session
/// </summary>
public class GameEvent
{
    public Guid Id { get; set; }
    public Guid SessionId { get; set; }
    public Guid? PlayerId { get; set; }
    public GameEventType Type { get; set; }
    public string Action { get; set; } = string.Empty;
    public string Data { get; set; } = string.Empty; // JSON serialized data
    public DateTime OccurredAt { get; set; }

    // Navigation property
    public GameSession Session { get; set; } = null!;
}

/// <summary>
/// Game event types
/// </summary>
public enum GameEventType
{
    SessionCreated = 0,
    SessionStarted = 1,
    SessionEnded = 2,
    PlayerJoined = 10,
    PlayerLeft = 11,
    PlayerReady = 12,
    PlayerMove = 20,
    PlayerAttack = 21,
    PlayerDamaged = 22,
    PlayerDied = 23,
    PlayerRespawned = 24,
    ScoreChanged = 30,
    LevelUp = 31,
    ItemCollected = 40,
    ItemUsed = 41,
    BuildingPlaced = 50,
    BuildingDestroyed = 51,
    ResourceGathered = 60,
    SystemMessage = 100
}
