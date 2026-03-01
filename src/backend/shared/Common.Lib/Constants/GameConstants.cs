namespace GamePlatform.Common.Constants;

/// <summary>
/// Game constants
/// </summary>
public static class GameConstants
{
    // World Configuration
    public const int DefaultMaxPlayersPerWorld = 1000;
    public const int MinPlayersPerMatch = 2;
    public const int MaxPlayersPerMatch = 50;

    // Timeouts (milliseconds)
    public const int DefaultMatchTimeoutMs = 1800000; // 30 minutes
    public const int DefaultConnectionTimeoutMs = 30000; // 30 seconds

    // Caching (seconds)
    public const int PlayerCacheDurationSeconds = 300; // 5 minutes
    public const int WorldStatsCacheDurationSeconds = 60; // 1 minute
    public const int LeaderboardCacheDurationSeconds = 120; // 2 minutes

    // Rate Limiting
    public const int MaxApiRequestsPerMinute = 100;
    public const int MaxWebSocketMessagesPerSecond = 20;

    // Validation
    public const int MinUsernameLength = 3;
    public const int MaxUsernameLength = 20;
    public const int MinPasswordLength = 8;
    public const int MaxPasswordLength = 100;

    // Game Settings
    public const int DefaultStartingHealth = 100;
    public const int DefaultStartingResources = 1000;
    public const float DefaultMovementSpeed = 5.0f;
}

/// <summary>
/// Redis key prefixes
/// </summary>
public static class RedisKeys
{
    public const string PlayerPrefix = "player:";
    public const string WorldPrefix = "world:";
    public const string SessionPrefix = "session:";
    public const string LeaderboardPrefix = "leaderboard:";
    public const string MatchPrefix = "match:";

    public static string PlayerKey(Guid playerId) => $"{PlayerPrefix}{playerId}";
    public static string WorldKey(int worldId) => $"{WorldPrefix}{worldId}";
    public static string SessionKey(Guid sessionId) => $"{SessionPrefix}{sessionId}";
    public static string LeaderboardKey(int worldId) => $"{LeaderboardPrefix}{worldId}";
    public static string MatchKey(Guid matchId) => $"{MatchPrefix}{matchId}";
}

/// <summary>
/// Event names for telemetry
/// </summary>
public static class TelemetryEvents
{
    public const string UserRegistered = "UserRegistered";
    public const string UserLoggedIn = "UserLoggedIn";
    public const string GameSessionStarted = "GameSessionStarted";
    public const string GameSessionEnded = "GameSessionEnded";
    public const string PurchaseCompleted = "PurchaseCompleted";
    public const string WorldCapacityReached = "WorldCapacityReached";
    public const string MatchmakingStarted = "MatchmakingStarted";
    public const string MatchmakingCompleted = "MatchmakingCompleted";
}
