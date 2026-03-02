using StackExchange.Redis;

namespace GamePlatform.Infrastructure.Redis;

/// <summary>
/// Redis cache service interface
/// </summary>
public interface IRedisCacheService
{
    Task<T?> GetAsync<T>(string key) where T : class;
    Task SetAsync<T>(string key, T value, TimeSpan? expiry = null) where T : class;
    Task<bool> DeleteAsync(string key);
    Task<bool> ExistsAsync(string key);
    Task<long> IncrementAsync(string key, long value = 1);
    Task<long> DecrementAsync(string key, long value = 1);
    Task<bool> SetNxAsync(string key, string value, TimeSpan? expiry = null);
}

/// <summary>
/// Redis cache service implementation
/// </summary>
public class RedisCacheService : IRedisCacheService
{
    private readonly IConnectionMultiplexer _redis;
    private readonly IDatabase _database;

    public RedisCacheService(IConnectionMultiplexer redis)
    {
        _redis = redis;
        _database = redis.GetDatabase();
    }

    public async Task<T?> GetAsync<T>(string key) where T : class
    {
        var value = await _database.StringGetAsync(key);
        if (value.IsNullOrEmpty)
            return null;

        return System.Text.Json.JsonSerializer.Deserialize<T>(value!);
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan? expiry = null) where T : class
    {
        var serialized = System.Text.Json.JsonSerializer.Serialize(value);
        await _database.StringSetAsync(key, serialized, expiry);
    }

    public async Task<bool> DeleteAsync(string key)
    {
        return await _database.KeyDeleteAsync(key);
    }

    public async Task<bool> ExistsAsync(string key)
    {
        return await _database.KeyExistsAsync(key);
    }

    public async Task<long> IncrementAsync(string key, long value = 1)
    {
        return await _database.StringIncrementAsync(key, value);
    }

    public async Task<long> DecrementAsync(string key, long value = 1)
    {
        return await _database.StringDecrementAsync(key, value);
    }

    public async Task<bool> SetNxAsync(string key, string value, TimeSpan? expiry = null)
    {
        return await _database.StringSetAsync(key, value, expiry, When.NotExists);
    }
}

/// <summary>
/// Redis configuration options
/// </summary>
public class RedisOptions
{
    public string ConnectionString { get; set; } = string.Empty;
    public string InstanceName { get; set; } = string.Empty;
    public int Database { get; set; } = 0;
}
