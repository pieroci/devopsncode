using Microsoft.EntityFrameworkCore;
using GamePlatform.Infrastructure.Database;

namespace GamePlatform.Tests.Shared.Factories;

/// <summary>
/// Factory for creating in-memory database contexts for testing
/// </summary>
public static class TestDbContextFactory
{
    /// <summary>
    /// Create an in-memory database context for testing
    /// </summary>
    public static TContext CreateInMemoryDbContext<TContext>() where TContext : DbContext
    {
        var options = new DbContextOptionsBuilder<TContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return (TContext)Activator.CreateInstance(typeof(TContext), options)!;
    }

    /// <summary>
    /// Create an in-memory database context with specific name for testing
    /// </summary>
    public static TContext CreateInMemoryDbContext<TContext>(string databaseName) where TContext : DbContext
    {
        var options = new DbContextOptionsBuilder<TContext>()
            .UseInMemoryDatabase(databaseName: databaseName)
            .Options;

        return (TContext)Activator.CreateInstance(typeof(TContext), options)!;
    }

    /// <summary>
    /// Seed database with test data
    /// </summary>
    public static async Task SeedDatabaseAsync<TContext>(TContext context, Action<TContext> seedAction) 
        where TContext : DbContext
    {
        seedAction(context);
        await context.SaveChangesAsync();
    }
}
