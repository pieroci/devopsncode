namespace GamePlatform.Contracts.Game;

/// <summary>
/// Game session information
/// </summary>
public class GameSessionDto
{
    public Guid Id { get; set; }
    public int WorldId { get; set; }
    public List<PlayerInGameDto> Players { get; set; } = new();
    public GameState State { get; set; }
    public DateTime StartedAt { get; set; }
    public DateTime? EndedAt { get; set; }
}

/// <summary>
/// Player in game session
/// </summary>
public class PlayerInGameDto
{
    public Guid PlayerId { get; set; }
    public string Username { get; set; } = string.Empty;
    public PlayerPosition Position { get; set; } = new();
    public int Health { get; set; }
    public int Score { get; set; }
}

/// <summary>
/// Player position in game world
/// </summary>
public class PlayerPosition
{
    public float X { get; set; }
    public float Y { get; set; }
    public float Z { get; set; }
    public float Rotation { get; set; }
}

/// <summary>
/// Game state enum
/// </summary>
public enum GameState
{
    Waiting,
    Starting,
    InProgress,
    Paused,
    Ended
}

/// <summary>
/// Game action request
/// </summary>
public class GameActionRequest
{
    public Guid SessionId { get; set; }
    public GameActionType ActionType { get; set; }
    public Dictionary<string, object> Parameters { get; set; } = new();
}

/// <summary>
/// Game action types
/// </summary>
public enum GameActionType
{
    Move,
    Attack,
    Build,
    Gather,
    UseItem,
    CastAbility
}
