using GamePlatform.Game.Service.Models;
using Microsoft.EntityFrameworkCore;

namespace GamePlatform.Game.Service.Data;

/// <summary>
/// Database context for Game.Service
/// </summary>
public class GameDbContext : DbContext
{
    public GameDbContext(DbContextOptions<GameDbContext> options) : base(options)
    {
    }

    public DbSet<GameSession> GameSessions => Set<GameSession>();
    public DbSet<PlayerGameState> PlayerGameStates => Set<PlayerGameState>();
    public DbSet<GameEvent> GameEvents => Set<GameEvent>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // GameSession configuration
        modelBuilder.Entity<GameSession>(entity =>
        {
            entity.ToTable("game_sessions");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.WorldName).HasMaxLength(200).IsRequired();
            entity.Property(e => e.State).IsRequired();
            entity.Property(e => e.MaxPlayers).IsRequired().HasDefaultValue(10);
            entity.Property(e => e.CurrentPlayers).IsRequired().HasDefaultValue(0);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.HasIndex(e => e.WorldId);
            entity.HasIndex(e => e.State);
            entity.HasIndex(e => e.StartedAt);

            // Relationships
            entity.HasMany(e => e.Players)
                .WithOne(p => p.Session)
                .HasForeignKey(p => p.SessionId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(e => e.Events)
                .WithOne(ev => ev.Session)
                .HasForeignKey(ev => ev.SessionId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // PlayerGameState configuration
        modelBuilder.Entity<PlayerGameState>(entity =>
        {
            entity.ToTable("player_game_states");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Username).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Health).IsRequired().HasDefaultValue(100);
            entity.Property(e => e.MaxHealth).IsRequired().HasDefaultValue(100);
            entity.Property(e => e.Score).IsRequired().HasDefaultValue(0);
            entity.Property(e => e.Level).IsRequired().HasDefaultValue(1);
            entity.Property(e => e.IsAlive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.IsReady).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.Status).IsRequired().HasDefaultValue(PlayerStatus.Connected);
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.HasIndex(e => e.SessionId);
            entity.HasIndex(e => e.PlayerId);
            entity.HasIndex(e => new { e.SessionId, e.PlayerId }).IsUnique();
        });

        // GameEvent configuration
        modelBuilder.Entity<GameEvent>(entity =>
        {
            entity.ToTable("game_events");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Type).IsRequired();
            entity.Property(e => e.Action).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Data).HasColumnType("jsonb");
            entity.Property(e => e.OccurredAt).HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.HasIndex(e => e.SessionId);
            entity.HasIndex(e => e.PlayerId);
            entity.HasIndex(e => e.Type);
            entity.HasIndex(e => e.OccurredAt);
        });
    }
}
