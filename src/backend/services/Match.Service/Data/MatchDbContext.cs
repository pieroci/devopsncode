using GamePlatform.Match.Service.Models;
using Microsoft.EntityFrameworkCore;

namespace GamePlatform.Match.Service.Data;

/// <summary>
/// Database context for Match service
/// </summary>
public class MatchDbContext : DbContext
{
    public MatchDbContext(DbContextOptions<MatchDbContext> options) : base(options)
    {
    }

    public DbSet<MatchEntity> Matches => Set<MatchEntity>();
    public DbSet<MatchPlayer> MatchPlayers => Set<MatchPlayer>();
    public DbSet<PlayerElo> PlayerElos => Set<PlayerElo>();
    public DbSet<MatchQueue> MatchQueues => Set<MatchQueue>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Match configuration
        modelBuilder.Entity<MatchEntity>(entity =>
        {
            entity.ToTable("matches");
            entity.HasKey(e => e.Id);
            
            entity.HasIndex(e => e.WorldId);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.CreatedAt);
            
            entity.Property(e => e.Status).HasConversion<int>();
        });

        // MatchPlayer configuration
        modelBuilder.Entity<MatchPlayer>(entity =>
        {
            entity.ToTable("match_players");
            entity.HasKey(e => e.Id);
            
            entity.HasIndex(e => e.MatchId);
            entity.HasIndex(e => e.PlayerId);
            entity.HasIndex(e => new { e.MatchId, e.PlayerId }).IsUnique();
            
            entity.HasOne(e => e.Match)
                  .WithMany(m => m.Players)
                  .HasForeignKey(e => e.MatchId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // PlayerElo configuration
        modelBuilder.Entity<PlayerElo>(entity =>
        {
            entity.ToTable("player_elos");
            entity.HasKey(e => e.Id);
            
            entity.HasIndex(e => e.PlayerId).IsUnique();
            entity.HasIndex(e => e.CurrentElo);
            entity.HasIndex(e => e.Rank);
            
            entity.Property(e => e.Rank).IsRequired().HasMaxLength(50);
        });

        // MatchQueue configuration
        modelBuilder.Entity<MatchQueue>(entity =>
        {
            entity.ToTable("match_queues");
            entity.HasKey(e => e.Id);
            
            entity.HasIndex(e => e.PlayerId).IsUnique();
            entity.HasIndex(e => e.CurrentElo);
            entity.HasIndex(e => new { e.Status, e.JoinedAt });
            
            entity.Property(e => e.PreferredMode).HasConversion<int>();
            entity.Property(e => e.Status).HasConversion<int>();
        });
    }
}
