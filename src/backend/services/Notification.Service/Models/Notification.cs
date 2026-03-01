namespace GamePlatform.Notification.Service.Models;

/// <summary>
/// Notification entity for persistent storage
/// </summary>
public class Notification
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public NotificationType Type { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string? Data { get; set; }  // JSON data
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ReadAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
}

/// <summary>
/// Notification types
/// </summary>
public enum NotificationType
{
    System = 0,
    GameStarted = 1,
    GameEnded = 2,
    PlayerJoined = 3,
    PlayerLeft = 4,
    PlayerKilled = 5,
    PlayerDied = 6,
    AchievementUnlocked = 7,
    LevelUp = 8,
    FriendRequest = 9,
    MatchFound = 10,
    SessionInvite = 11,
    ScoreUpdate = 12
}
