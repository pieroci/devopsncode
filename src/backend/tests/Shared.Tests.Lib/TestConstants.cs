namespace GamePlatform.Tests.Shared;

/// <summary>
/// Test constants used across all test projects
/// </summary>
public static class TestConstants
{
    // Database
    public const string TestDatabaseName = "GamePlatform_Test";
    
    // Redis
    public const string TestRedisConnectionString = "localhost:6379";
    
    // JWT
    public const string TestJwtSecretKey = "TestSecretKeyForJWTTokenGeneration12345678901234567890";
    public const string TestJwtIssuer = "GamePlatform.Auth.Test";
    public const string TestJwtAudience = "GamePlatform.Test";
    
    // Test Users
    public const string TestUserEmail = "test@example.com";
    public const string TestUserUsername = "testuser";
    public const string TestUserPassword = "TestPassword123!";
    public const int TestUserId = 1;
    public const int TestWorldId = 1;
    
    // Test Players
    public const int TestPlayerId = 1;
    public const string TestPlayerDisplayName = "TestPlayer";
    
    // Test Worlds
    public const string TestWorldName = "Test World";
    public const string TestWorldRegion = "US-East";
    public const int TestWorldMaxPlayers = 1000;
    
    // Timeouts
    public const int ShortTimeoutMs = 100;
    public const int MediumTimeoutMs = 1000;
    public const int LongTimeoutMs = 5000;
    
    // Cache Keys
    public const string TestCacheKeyPrefix = "test:";
    
    // API Endpoints
    public static class ApiEndpoints
    {
        // Auth.Service
        public const string AuthRegister = "/api/auth/register";
        public const string AuthLogin = "/api/auth/login";
        public const string AuthRefresh = "/api/auth/refresh";
        public const string AuthRevoke = "/api/auth/revoke";
        
        // World.Service
        public const string WorldCreate = "/api/world";
        public const string WorldGetById = "/api/world/{0}";
        public const string WorldGetAll = "/api/world";
        public const string WorldGetAvailable = "/api/world/available";
        public const string WorldIncrementPlayers = "/api/world/{0}/increment";
        public const string WorldDecrementPlayers = "/api/world/{0}/decrement";
        
        // Player.Service
        public const string PlayerCreate = "/api/player";
        public const string PlayerGetById = "/api/player/{0}";
        public const string PlayerGetByUserId = "/api/player/user/{0}";
        public const string PlayerUpdate = "/api/player/{0}";
        public const string PlayerAddExperience = "/api/player/{0}/experience";
        public const string PlayerGetAchievements = "/api/player/{0}/achievements";
        public const string PlayerEarnAchievement = "/api/player/{0}/achievements/{1}";
        public const string PlayerGetInventory = "/api/player/{0}/inventory";
        public const string PlayerAddInventoryItem = "/api/player/{0}/inventory";
        
        // Health
        public const string Health = "/health";
    }
}
