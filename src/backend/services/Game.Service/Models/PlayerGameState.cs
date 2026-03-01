namespace GamePlatform.Game.Service.Models;

/// <summary>
/// Player state within a game session
/// Tracks player position, stats, and status
/// </summary>
public class PlayerGameState
{
    public Guid Id { get; set; }
    public Guid SessionId { get; set; }
    public Guid PlayerId { get; set; }
    public string Username { get; set; } = string.Empty;
    
    // Position and movement
    public float PositionX { get; set; }
    public float PositionY { get; set; }
    public float PositionZ { get; set; }
    public float Rotation { get; set; }
    public float VelocityX { get; set; }
    public float VelocityY { get; set; }
    public float VelocityZ { get; set; }

    // Player stats
    public int Health { get; set; } = 100;
    public int MaxHealth { get; set; } = 100;
    public int Score { get; set; }
    public int Level { get; set; } = 1;
    
    // Status
    public bool IsAlive { get; set; } = true;
    public bool IsReady { get; set; }
    public PlayerStatus Status { get; set; } = PlayerStatus.Connected;
    
    // Timestamps
    public DateTime JoinedAt { get; set; }
    public DateTime? LeftAt { get; set; }
    public DateTime LastActionAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation property
    public GameSession Session { get; set; } = null!;
}

/// <summary>
/// Player status in game
/// </summary>
public enum PlayerStatus
{
    Connected = 0,
    Ready = 1,
    Playing = 2,
    Disconnected = 3,
    Spectating = 4
}
