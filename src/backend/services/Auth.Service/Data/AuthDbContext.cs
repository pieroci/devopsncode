using GamePlatform.Auth.Service.Models;
using GamePlatform.Infrastructure.Database;
using Microsoft.EntityFrameworkCore;

namespace GamePlatform.Auth.Service.Data;

/// <summary>
/// Authentication database context
/// Implements Dependency Inversion Principle - depends on abstractions
/// </summary>
public class AuthDbContext : BaseDbContext
{
    public AuthDbContext(DbContextOptions<AuthDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User configuration
        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("Users");
            entity.HasKey(e => e.Id);
            
            entity.Property(e => e.Username)
                .IsRequired()
                .HasMaxLength(20);
            
            entity.Property(e => e.Email)
                .IsRequired()
                .HasMaxLength(100);
            
            entity.Property(e => e.PasswordHash)
                .IsRequired();

            entity.HasIndex(e => e.Username).IsUnique();
            entity.HasIndex(e => e.Email).IsUnique();
            entity.HasIndex(e => e.WorldId);

            // One-to-many relationship with RefreshTokens
            entity.HasMany(e => e.RefreshTokens)
                .WithOne(e => e.User)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // RefreshToken configuration
        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.ToTable("RefreshTokens");
            entity.HasKey(e => e.Id);
            
            entity.Property(e => e.Token)
                .IsRequired()
                .HasMaxLength(200);

            entity.HasIndex(e => e.Token).IsUnique();
            entity.HasIndex(e => e.UserId);
        });
    }
}
