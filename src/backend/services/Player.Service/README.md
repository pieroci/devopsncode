# Player.Service - Player Profile & Progression Management

## Overview
Microservice responsible for managing player profiles, statistics, achievements, and inventory for the Game Platform.

## Features
- ✅ Player profile management (CRUD)
- ✅ Player statistics tracking
- ✅ Achievement system (6 seed achievements)
- ✅ Player inventory management
- ✅ Experience & leveling system
- ✅ Integration with Auth.Service (user ID)
- ✅ Integration with World.Service (world ID)
- ✅ Redis caching for performance
- ✅ PostgreSQL database with EF Core
- ✅ FluentValidation for input validation
- ✅ Serilog with Application Insights
- ✅ Swagger/OpenAPI documentation
- ✅ Health checks
- ✅ JWT authentication

## Technology Stack
- .NET 8.0
- ASP.NET Core Web API
- Entity Framework Core 8.0
- PostgreSQL
- Redis
- JWT Authentication
- FluentValidation
- Serilog
- Swagger/OpenAPI

## Database Schema

### Players Table
```sql
CREATE TABLE Players (
    Id INT PRIMARY KEY,
    UserId INT NOT NULL UNIQUE,
    WorldId INT NOT NULL,
    DisplayName VARCHAR(50) NOT NULL UNIQUE,
    Level INT NOT NULL DEFAULT 1,
    Experience BIGINT NOT NULL DEFAULT 0,
    Coins INT NOT NULL DEFAULT 1000,
    Gems INT NOT NULL DEFAULT 0,
    AvatarUrl VARCHAR(500),
    LastLoginAt TIMESTAMP NOT NULL,
    IsBanned BOOLEAN NOT NULL DEFAULT FALSE,
    BanReason VARCHAR(500),
    CreatedAt TIMESTAMP NOT NULL,
    UpdatedAt TIMESTAMP NOT NULL
);

CREATE INDEX idx_players_userid ON Players(UserId);
CREATE INDEX idx_players_worldid ON Players(WorldId);
CREATE INDEX idx_players_displayname ON Players(DisplayName);
CREATE INDEX idx_players_level ON Players(Level);
```

### PlayerStatistics Table (1-to-1 with Players)
```sql
CREATE TABLE PlayerStatistics (
    Id INT PRIMARY KEY,
    PlayerId INT NOT NULL UNIQUE,
    GamesPlayed INT NOT NULL DEFAULT 0,
    GamesWon INT NOT NULL DEFAULT 0,
    GamesLost INT NOT NULL DEFAULT 0,
    TotalKills INT NOT NULL DEFAULT 0,
    TotalDeaths INT NOT NULL DEFAULT 0,
    TotalPlayTimeSeconds BIGINT NOT NULL DEFAULT 0,
    HighestLevel INT NOT NULL DEFAULT 1,
    CurrentWinStreak INT NOT NULL DEFAULT 0,
    BestWinStreak INT NOT NULL DEFAULT 0,
    LastGamePlayedAt TIMESTAMP,
    CreatedAt TIMESTAMP NOT NULL,
    UpdatedAt TIMESTAMP NOT NULL,
    FOREIGN KEY (PlayerId) REFERENCES Players(Id) ON DELETE CASCADE
);

CREATE INDEX idx_playerstats_gamesplayed ON PlayerStatistics(GamesPlayed);
CREATE INDEX idx_playerstats_gameswon ON PlayerStatistics(GamesWon);
```

### Achievements Table
```sql
CREATE TABLE Achievements (
    Id INT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL UNIQUE,
    Description VARCHAR(500),
    IconUrl VARCHAR(500),
    Points INT NOT NULL DEFAULT 10,
    Category VARCHAR(50) NOT NULL DEFAULT 'General',
    IsSecret BOOLEAN NOT NULL DEFAULT FALSE,
    CreatedAt TIMESTAMP NOT NULL,
    UpdatedAt TIMESTAMP NOT NULL
);

CREATE INDEX idx_achievements_category ON Achievements(Category);
```

### PlayerAchievements Table (Many-to-Many)
```sql
CREATE TABLE PlayerAchievements (
    Id INT PRIMARY KEY,
    PlayerId INT NOT NULL,
    AchievementId INT NOT NULL,
    EarnedAt TIMESTAMP NOT NULL,
    Progress INT NOT NULL DEFAULT 100,
    CreatedAt TIMESTAMP NOT NULL,
    UpdatedAt TIMESTAMP NOT NULL,
    FOREIGN KEY (PlayerId) REFERENCES Players(Id) ON DELETE CASCADE,
    FOREIGN KEY (AchievementId) REFERENCES Achievements(Id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX idx_playerachievements_player_achievement ON PlayerAchievements(PlayerId, AchievementId);
CREATE INDEX idx_playerachievements_playerid ON PlayerAchievements(PlayerId);
CREATE INDEX idx_playerachievements_achievementid ON PlayerAchievements(AchievementId);
```

### InventoryItems Table
```sql
CREATE TABLE InventoryItems (
    Id INT PRIMARY KEY,
    PlayerId INT NOT NULL,
    ItemType VARCHAR(50) NOT NULL,
    ItemId VARCHAR(100) NOT NULL,
    ItemName VARCHAR(100) NOT NULL,
    Quantity INT NOT NULL DEFAULT 1,
    IsEquipped BOOLEAN NOT NULL DEFAULT FALSE,
    AcquiredAt TIMESTAMP,
    CreatedAt TIMESTAMP NOT NULL,
    UpdatedAt TIMESTAMP NOT NULL,
    FOREIGN KEY (PlayerId) REFERENCES Players(Id) ON DELETE CASCADE
);

CREATE INDEX idx_inventory_playerid ON InventoryItems(PlayerId);
CREATE INDEX idx_inventory_player_itemid ON InventoryItems(PlayerId, ItemId);
CREATE INDEX idx_inventory_itemtype ON InventoryItems(ItemType);
```

### Seed Data (6 Achievements)
1. **First Steps** - Complete your first game (10 points, General)
2. **Warrior** - Win 10 games (25 points, Combat)
3. **Champion** - Win 100 games (100 points, Combat)
4. **Collector** - Acquire 50 different items (50 points, General)
5. **Veteran** - Play for 100 hours (75 points, General)
6. **Secret Master** - Discover the hidden path (200 points, Secret/Hidden)

## API Endpoints

### Player Profile

**GET /api/player/{playerId}**
Get player by ID

**GET /api/player/user/{userId}**
Get player by user ID (links to Auth.Service)

**POST /api/player**
Create a new player

Request:
```json
{
  "userId": 1,
  "worldId": 1,
  "displayName": "DragonSlayer"
}
```

**PUT /api/player/{playerId}**
Update player profile

Request:
```json
{
  "displayName": "NewName",
  "avatarUrl": "https://cdn.example.com/avatars/123.png"
}
```

**POST /api/player/{playerId}/login**
Update last login timestamp

### Experience & Leveling

**POST /api/player/{playerId}/experience**
Add experience to player (auto-levels up)

Request:
```json
{
  "amount": 500
}
```

Level-up formula: `experienceToNextLevel = level * 1000`

### Achievements

**GET /api/player/{playerId}/achievements**
Get all earned achievements for player

**POST /api/player/{playerId}/achievements/{achievementId}**
Earn an achievement

### Inventory

**GET /api/player/{playerId}/inventory**
Get player's inventory items

**POST /api/player/{playerId}/inventory**
Add item to inventory (or increment quantity if exists)

Request:
```json
{
  "itemType": "Weapon",
  "itemId": "sword_legendary_001",
  "itemName": "Legendary Sword of Fire",
  "quantity": 1
}
```

## Response Examples

### Player Profile
```json
{
  "success": true,
  "data": {
    "id": 1,
    "userId": 100,
    "worldId": 1,
    "displayName": "DragonSlayer",
    "level": 15,
    "experience": 2500,
    "coins": 15000,
    "gems": 150,
    "avatarUrl": "https://cdn.example.com/avatars/123.png",
    "lastLoginAt": "2026-03-01T17:00:00Z",
    "experienceToNextLevel": 15000,
    "experienceProgress": 16,
    "statistics": {
      "gamesPlayed": 250,
      "gamesWon": 120,
      "gamesLost": 130,
      "totalKills": 1500,
      "totalDeaths": 800,
      "winRate": 48.0,
      "killDeathRatio": 1.875,
      "totalPlayTime": "50:30:00",
      "currentWinStreak": 3,
      "bestWinStreak": 12
    }
  }
}
```

### Achievement
```json
{
  "success": true,
  "data": {
    "id": 2,
    "name": "Warrior",
    "description": "Win 10 games",
    "iconUrl": "/icons/achievements/warrior.png",
    "points": 25,
    "category": "Combat",
    "isSecret": false,
    "earnedAt": "2026-03-01T16:30:00Z",
    "progress": 100
  },
  "message": "Achievement earned!"
}
```

### Inventory Item
```json
{
  "success": true,
  "data": {
    "id": 45,
    "itemType": "Weapon",
    "itemId": "sword_legendary_001",
    "itemName": "Legendary Sword of Fire",
    "quantity": 1,
    "isEquipped": false,
    "acquiredAt": "2026-03-01T17:00:00Z"
  },
  "message": "Item added to inventory"
}
```

## Configuration

### appsettings.json
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=postgres;Port=5432;Database=gameplatform_player;Username=postgres;Password=<from-azure-key-vault>",
    "Redis": "redis:6379"
  },
  "Jwt": {
    "SecretKey": "<from-azure-key-vault>",
    "Issuer": "GamePlatform.Auth",
    "Audience": "GamePlatform"
  },
  "ApplicationInsights": {
    "InstrumentationKey": "<your-key>"
  }
}
```

## Validation Rules

### Create Player
- **UserId**: Required, > 0
- **WorldId**: Required, > 0
- **DisplayName**: Required, 3-50 characters, alphanumeric + underscores/hyphens

### Update Player
- **DisplayName**: Optional, 3-50 characters, alphanumeric + underscores/hyphens
- **AvatarUrl**: Optional, max 500 characters

### Add Experience
- **Amount**: Required, 1-1,000,000 per request

### Add Inventory Item
- **ItemType**: Required, max 50 characters
- **ItemId**: Required, max 100 characters
- **ItemName**: Required, max 100 characters
- **Quantity**: Required, 1-9999

## Caching Strategy

### Redis Keys & TTL
- `player:{playerId}` → Player profile (10 min)
- `player:user:{userId}` → Player by user ID (10 min)
- `player:{playerId}:achievements` → Player achievements (15 min)
- `player:{playerId}:inventory` → Player inventory (10 min)

### Cache Invalidation
Triggered on:
- Player profile updates
- Experience additions
- Achievement earning
- Inventory changes
- Last login updates

## Integration Points

### With Auth.Service
- Player created when user registers
- `UserId` foreign key links to Auth.Service User
- JWT token contains userId claim

### With World.Service
- Player assigned to specific world
- `WorldId` foreign key links to World.Service World
- World capacity tracked on player join

### With Game.Service (Future)
- Game updates player statistics
- Experience rewarded after games
- Achievements earned during gameplay
- Inventory items acquired as rewards

### With Leaderboard.Service (Future)
- Player statistics used for rankings
- Level and experience for leaderboards
- Win rate calculations

## Experience & Leveling System

### Formula
```csharp
experienceToNextLevel = level * 1000
```

### Examples
- Level 1 → 2: 1,000 XP
- Level 10 → 11: 10,000 XP
- Level 50 → 51: 50,000 XP

### Auto Level-Up
When experience added:
1. Add XP to player
2. Check if `experience >= experienceToNextLevel`
3. If yes: subtract required XP, increment level, repeat
4. Update highest level in statistics

## Security Features
- JWT authentication required for all endpoints
- Non-root Docker user (appuser)
- Input validation on all endpoints
- CORS configuration
- Health checks for monitoring
- Unique constraints on userId and displayName

## Running Locally

### Prerequisites
- .NET 8.0 SDK
- PostgreSQL
- Redis

### Run
```bash
cd src/backend/services/Player.Service
dotnet run
```

API will be available at: http://localhost:5000
Swagger UI: http://localhost:5000

## Docker

### Build
```bash
docker build -t player-service:latest -f src/backend/services/Player.Service/Dockerfile .
```

### Run
```bash
docker run -p 8080:8080 \
  -e ConnectionStrings__DefaultConnection="Host=postgres;Port=5432;Database=gameplatform_player;Username=postgres;Password=postgres" \
  -e ConnectionStrings__Redis="redis:6379" \
  -e Jwt__SecretKey="YourSecretKey" \
  player-service:latest
```

## Health Checks
- Endpoint: `/health`
- Checks: Database connectivity, Redis connectivity
- Used by Kubernetes liveness/readiness probes

## Monitoring
- Application Insights integration
- Structured logging with Serilog
- Request/response logging
- Exception tracking
- Custom telemetry events
- Player activity metrics

## Design Patterns
- **Repository Pattern**: Database access abstraction
- **Unit of Work**: Transaction management
- **Dependency Injection**: All services use DI
- **SOLID Principles**: Applied throughout
- **Clean Architecture**: Separation of concerns

## Dependencies
- Contracts.Lib: Shared DTOs
- Infrastructure.Lib: Redis, Database, Telemetry
- Security.Lib: JWT authentication
- Common.Lib: Constants, Extensions

## Future Enhancements
- [ ] Player-to-player trading
- [ ] Equipment system (equip/unequip items)
- [ ] Skills & abilities
- [ ] Guild/clan membership
- [ ] Social features (friends, messaging)
- [ ] Player reports & moderation
- [ ] Achievement progress tracking (not just 0-100)
- [ ] Daily quests
- [ ] Player seasons & rankings
