using GamePlatform.Infrastructure.Database;
using GamePlatform.World.Service.Models;
using Microsoft.EntityFrameworkCore;

namespace GamePlatform.World.Service.Data;

/// <summary>
/// World database context
/// Implements Dependency Inversion Principle - depends on abstractions
/// </summary>
public class WorldDbContext : BaseDbContext
{
    public WorldDbContext(DbContextOptions<WorldDbContext> options) : base(options)
    {
    }

    public DbSet<Models.World> Worlds => Set<Models.World>();
    public DbSet<WorldStatistics> WorldStatistics => Set<WorldStatistics>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // World configuration
        modelBuilder.Entity<Models.World>(entity =>
        {
            entity.ToTable("Worlds");
            entity.HasKey(e => e.Id);
            
            entity.Property(e => e.Name)
                .IsRequired()
                .HasMaxLength(100);
            
            entity.Property(e => e.Description)
                .HasMaxLength(500);

            entity.Property(e => e.Region)
                .IsRequired()
                .HasMaxLength(50);

            entity.Property(e => e.KubernetesNamespace)
                .HasMaxLength(100);

            entity.Property(e => e.RedisConnectionString)
                .HasMaxLength(200);

            entity.HasIndex(e => e.Name).IsUnique();
            entity.HasIndex(e => e.IsActive);
            entity.HasIndex(e => e.Region);

            // One-to-one relationship with WorldStatistics
            entity.HasOne(e => e.Statistics)
                .WithOne(e => e.World)
                .HasForeignKey<WorldStatistics>(e => e.WorldId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // WorldStatistics configuration
        modelBuilder.Entity<WorldStatistics>(entity =>
        {
            entity.ToTable("WorldStatistics");
            entity.HasKey(e => e.Id);
            
            entity.HasIndex(e => e.WorldId).IsUnique();
        });

        // Seed initial worlds
        modelBuilder.Entity<Models.World>().HasData(
            new Models.World
            {
                Id = 1,
                Name = "World-Alpha",
                Description = "The first world - perfect for newcomers",
                MaxCapacity = 1000,
                CurrentPlayers = 0,
                IsActive = true,
                Region = "US-East",
                KubernetesNamespace = "world-alpha",
                RedisConnectionString = "redis-world-alpha:6379",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Models.World
            {
                Id = 2,
                Name = "World-Beta",
                Description = "Competitive world for experienced players",
                MaxCapacity = 1000,
                CurrentPlayers = 0,
                IsActive = true,
                Region = "US-West",
                KubernetesNamespace = "world-beta",
                RedisConnectionString = "redis-world-beta:6379",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Models.World
            {
                Id = 3,
                Name = "World-Gamma",
                Description = "European world server",
                MaxCapacity = 1000,
                CurrentPlayers = 0,
                IsActive = true,
                Region = "EU-West",
                KubernetesNamespace = "world-gamma",
                RedisConnectionString = "redis-world-gamma:6379",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }
        );
    }
}
