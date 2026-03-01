namespace GamePlatform.Notification.Service.Models;

/// <summary>
/// Tracks SignalR connections for users
/// </summary>
public class UserConnection
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string ConnectionId { get; set; } = string.Empty;
    public string? UserAgent { get; set; }
    public DateTime ConnectedAt { get; set; }
    public DateTime LastActivityAt { get; set; }
}
