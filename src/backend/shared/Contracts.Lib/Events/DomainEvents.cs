namespace GamePlatform.Contracts.Events;

/// <summary>
/// Base domain event
/// </summary>
public abstract class DomainEvent
{
    public Guid EventId { get; set; } = Guid.NewGuid();
    public DateTime OccurredAt { get; set; } = DateTime.UtcNow;
    public string EventType { get; set; } = string.Empty;
}

/// <summary>
/// User registered event
/// </summary>
public class UserRegisteredEvent : DomainEvent
{
    public Guid UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public int WorldId { get; set; }

    public UserRegisteredEvent()
    {
        EventType = nameof(UserRegisteredEvent);
    }
}

/// <summary>
/// Game session started event
/// </summary>
public class GameSessionStartedEvent : DomainEvent
{
    public Guid SessionId { get; set; }
    public int WorldId { get; set; }
    public List<Guid> PlayerIds { get; set; } = new();

    public GameSessionStartedEvent()
    {
        EventType = nameof(GameSessionStartedEvent);
    }
}

/// <summary>
/// Purchase completed event
/// </summary>
public class PurchaseCompletedEvent : DomainEvent
{
    public Guid UserId { get; set; }
    public string ProductId { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = string.Empty;
    public string Provider { get; set; } = string.Empty; // GooglePlay, AppleStore
    public string TransactionId { get; set; } = string.Empty;

    public PurchaseCompletedEvent()
    {
        EventType = nameof(PurchaseCompletedEvent);
    }
}

/// <summary>
/// World capacity reached event
/// </summary>
public class WorldCapacityReachedEvent : DomainEvent
{
    public int WorldId { get; set; }
    public int CurrentPlayers { get; set; }
    public int MaxPlayers { get; set; }

    public WorldCapacityReachedEvent()
    {
        EventType = nameof(WorldCapacityReachedEvent);
    }
}
