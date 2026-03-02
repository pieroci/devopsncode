using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Ocelot.DependencyInjection;
using Ocelot.Middleware;
using Ocelot.Provider.Polly;
using Serilog;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .WriteTo.File("logs/gateway-.txt", rollingInterval: RollingInterval.Day)
    .CreateLogger();

builder.Host.UseSerilog();

// Load Ocelot configuration
builder.Configuration.AddJsonFile("ocelot.json", optional: false, reloadOnChange: true);

// JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"] ?? "your-super-secret-key-min-32-characters-long-for-security";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer("Bearer", options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "GamePlatform",
            ValidAudience = builder.Configuration["Jwt:Audience"] ?? "GamePlatformUsers",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
        
        // For SignalR WebSocket authentication
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                {
                    context.Token = accessToken;
                }
                return Task.CompletedTask;
            }
        };
    });

// CORS Configuration
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
    
    options.AddPolicy("SignalRPolicy", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "http://localhost:4200")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

// Add Ocelot with Polly for resilience
builder.Services.AddOcelot()
                .AddPolly();

// Health checks
builder.Services.AddHealthChecks();

var app = builder.Build();

// Use CORS
app.UseCors("AllowAll");

// Use authentication
app.UseAuthentication();

// Use Ocelot middleware
await app.UseOcelot();

// Health check endpoint
app.MapHealthChecks("/health");

// Root endpoint
app.MapGet("/", () => new
{
    service = "Game Platform API Gateway",
    version = "1.0.0",
    status = "healthy",
    timestamp = DateTime.UtcNow,
    routes = new
    {
        auth = "/api/auth/*",
        player = "/api/player/*",
        world = "/api/world/*",
        game = "/api/game/*",
        notification = "/api/notification/*",
        match = "/api/match/*",
        matchmaking = "/api/matchmaking/*",
        leaderboard = "/api/leaderboard/*",
        hubs = "/hubs/*"
    }
});

Log.Information("Gateway.Service starting on port 5000...");
app.Run();
Log.Information("Gateway.Service shutting down...");
