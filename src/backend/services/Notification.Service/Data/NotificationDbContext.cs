using GamePlatform.Notification.Service.Models;
using Microsoft.EntityFrameworkCore;

namespace GamePlatform.Notification.Service.Data;

/// <summary>
/// Database context for Notification service
/// </summary>
public class NotificationDbContext : DbContext
{
    public NotificationDbContext(DbContextOptions<NotificationDbContext> options) : base(options)
    {
    }

    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<UserConnection> UserConnections => Set<UserConnection>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Notification configuration
        modelBuilder.Entity<Notification>(entity =>
        {
            entity.ToTable("notifications");
            entity.HasKey(e => e.Id);
            
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => new { e.UserId, e.IsRead });
            entity.HasIndex(e => e.CreatedAt);
            
            entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Message).IsRequired().HasMaxLength(1000);
            entity.Property(e => e.Data).HasColumnType("jsonb");
        });

        // UserConnection configuration
        modelBuilder.Entity<UserConnection>(entity =>
        {
            entity.ToTable("user_connections");
            entity.HasKey(e => e.Id);
            
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.ConnectionId).IsUnique();
            
            entity.Property(e => e.ConnectionId).IsRequired().HasMaxLength(100);
            entity.Property(e => e.UserAgent).HasMaxLength(500);
        });
    }
}
