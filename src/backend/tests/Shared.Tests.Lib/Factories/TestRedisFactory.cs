using Moq;
using GamePlatform.Infrastructure.Redis;
using StackExchange.Redis;

namespace GamePlatform.Tests.Shared.Factories;

/// <summary>
/// Factory for creating mock Redis clients for testing
/// </summary>
public static class TestRedisFactory
{
    /// <summary>
    /// Create a mock Redis cache service
    /// </summary>
    public static Mock<IRedisCacheService> CreateMockRedisCacheService()
    {
        var mockCache = new Mock<IRedisCacheService>();
        
        // Setup common Redis operations
        mockCache.Setup(x => x.GetAsync<It.IsAnyType>(It.IsAny<string>()))
            .ReturnsAsync((It.IsAnyType?)null);
        
        mockCache.Setup(x => x.SetAsync(It.IsAny<string>(), It.IsAny<object>(), It.IsAny<TimeSpan?>()))
            .Returns(Task.CompletedTask);
        
        mockCache.Setup(x => x.RemoveAsync(It.IsAny<string>()))
            .Returns(Task.CompletedTask);
        
        mockCache.Setup(x => x.ExistsAsync(It.IsAny<string>()))
            .ReturnsAsync(false);

        return mockCache;
    }

    /// <summary>
    /// Create a mock Redis cache service with specific cached values
    /// </summary>
    public static Mock<IRedisCacheService> CreateMockRedisCacheServiceWithData<T>(string key, T value)
    {
        var mockCache = CreateMockRedisCacheService();
        
        mockCache.Setup(x => x.GetAsync<T>(key))
            .ReturnsAsync(value);
        
        mockCache.Setup(x => x.ExistsAsync(key))
            .ReturnsAsync(true);

        return mockCache;
    }

    /// <summary>
    /// Create a mock ConnectionMultiplexer
    /// </summary>
    public static Mock<IConnectionMultiplexer> CreateMockConnectionMultiplexer()
    {
        var mockMultiplexer = new Mock<IConnectionMultiplexer>();
        var mockDatabase = new Mock<IDatabase>();
        
        mockMultiplexer.Setup(x => x.GetDatabase(It.IsAny<int>(), It.IsAny<object>()))
            .Returns(mockDatabase.Object);

        return mockMultiplexer;
    }
}
