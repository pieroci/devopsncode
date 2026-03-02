using GamePlatform.Infrastructure.Database;
using GamePlatform.Player.Service.Models;
using Microsoft.EntityFrameworkCore;

namespace GamePlatform.Player.Service.Data;

/// <summary>
/// Player database context
/// Implements Dependency Inversion Principle - depends on abstractions
/// </summary>
public class PlayerDbContext : BaseDbContext
{
    public PlayerDbContext(DbContextOptions<PlayerDbContext> options) : base(options)
    {
    }

    public DbSet<Player> Players => Set<Player>();
    public DbSet<PlayerStatistics> PlayerStatistics => Set<PlayerStatistics>();
    public DbSet<Achievement> Achievements => Set<Achievement>();
    public DbSet<PlayerAchievement> PlayerAchievements => Set<PlayerAchievement>();
    public DbSet<InventoryItem> InventoryItems => Set<InventoryItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Player configuration
        modelBuilder.Entity<Player>(entity =>
        {
            entity.ToTable("Players");
            entity.HasKey(e => e.Id);
            
            entity.Property(e => e.DisplayName)
                .IsRequired()
                .HasMaxLength(50);
            
            entity.Property(e => e.AvatarUrl)
                .HasMaxLength(500);

            entity.Property(e => e.BanReason)
                .HasMaxLength(500);

            entity.HasIndex(e => e.UserId).IsUnique();
            entity.HasIndex(e => e.WorldId);
            entity.HasIndex(e => e.DisplayName);
            entity.HasIndex(e => e.Level);

            // One-to-one relationship with PlayerStatistics
            entity.HasOne(e => e.Statistics)
                .WithOne(e => e.Player)
                .HasForeignKey<PlayerStatistics>(e => e.PlayerId)
                .OnDelete(DeleteBehavior.Cascade);

            // One-to-many relationships
            entity.HasMany(e => e.Achievements)
                .WithOne(e => e.Player)
                .HasForeignKey(e => e.PlayerId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(e => e.Inventory)
                .WithOne(e => e.Player)
                .HasForeignKey(e => e.PlayerId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // PlayerStatistics configuration
        modelBuilder.Entity<PlayerStatistics>(entity =>
        {
            entity.ToTable("PlayerStatistics");
            entity.HasKey(e => e.Id);
            
            entity.HasIndex(e => e.PlayerId).IsUnique();
            entity.HasIndex(e => e.GamesPlayed);
            entity.HasIndex(e => e.GamesWon);
        });

        // Achievement configuration
        modelBuilder.Entity<Achievement>(entity =>
        {
            entity.ToTable("Achievements");
            entity.HasKey(e => e.Id);
            
            entity.Property(e => e.Name)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(e => e.Description)
                .HasMaxLength(500);

            entity.Property(e => e.IconUrl)
                .HasMaxLength(500);

            entity.Property(e => e.Category)
                .HasMaxLength(50);

            entity.HasIndex(e => e.Name).IsUnique();
            entity.HasIndex(e => e.Category);
        });

        // PlayerAchievement configuration
        modelBuilder.Entity<PlayerAchievement>(entity =>
        {
            entity.ToTable("PlayerAchievements");
            entity.HasKey(e => e.Id);

            entity.HasIndex(e => new { e.PlayerId, e.AchievementId }).IsUnique();
            entity.HasIndex(e => e.PlayerId);
            entity.HasIndex(e => e.AchievementId);

            entity.HasOne(e => e.Achievement)
                .WithMany(e => e.PlayerAchievements)
                .HasForeignKey(e => e.AchievementId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // InventoryItem configuration
        modelBuilder.Entity<InventoryItem>(entity =>
        {
            entity.ToTable("InventoryItems");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.ItemType)
                .IsRequired()
                .HasMaxLength(50);

            entity.Property(e => e.ItemId)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(e => e.ItemName)
                .IsRequired()
                .HasMaxLength(100);

            entity.HasIndex(e => e.PlayerId);
            entity.HasIndex(e => new { e.PlayerId, e.ItemId });
            entity.HasIndex(e => e.ItemType);
        });

        // Seed initial achievements
        modelBuilder.Entity<Achievement>().HasData(
            new Achievement
            {
                Id = 1,
                Name = "First Steps",
                Description = "Complete your first game",
                IconUrl = "/icons/achievements/first-steps.png",
                Points = 10,
                Category = "General",
                IsSecret = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Achievement
            {
                Id = 2,
                Name = "Warrior",
                Description = "Win 10 games",
                IconUrl = "/icons/achievements/warrior.png",
                Points = 25,
                Category = "Combat",
                IsSecret = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Achievement
            {
                Id = 3,
                Name = "Champion",
                Description = "Win 100 games",
                IconUrl = "/icons/achievements/champion.png",
                Points = 100,
                Category = "Combat",
                IsSecret = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Achievement
            {
                Id = 4,
                Name = "Collector",
                Description = "Acquire 50 different items",
                IconUrl = "/icons/achievements/collector.png",
                Points = 50,
                Category = "General",
                IsSecret = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Achievement
            {
                Id = 5,
                Name = "Veteran",
                Description = "Play for 100 hours",
                IconUrl = "/icons/achievements/veteran.png",
                Points = 75,
                Category = "General",
                IsSecret = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Achievement
            {
                Id = 6,
                Name = "Secret Master",
                Description = "Discover the hidden path",
                IconUrl = "/icons/achievements/secret.png",
                Points = 200,
                Category = "Secret",
                IsSecret = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }
        );
    }
}
