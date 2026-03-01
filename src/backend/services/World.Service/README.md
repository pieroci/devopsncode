# World.Service - World Management & Capacity Control

## Overview
Microservice responsible for managing game worlds, capacity control (1000 users per world), and world selection for the Game Platform.

## Features
- ✅ World CRUD operations
- ✅ Capacity management (configurable max 1000-10,000 users)
- ✅ World selection based on availability
- ✅ Player count tracking (increment/decrement)
- ✅ World statistics (total games, peak players)
- ✅ Redis caching per world
- ✅ PostgreSQL database with EF Core
- ✅ FluentValidation for input validation
- ✅ Serilog with Application Insights
- ✅ Swagger/OpenAPI documentation
- ✅ Health checks
- ✅ JWT authentication
- ✅ Kubernetes namespace support per world

## Technology Stack
- .NET 8.0
- ASP.NET Core Web API
- Entity Framework Core 8.0
- PostgreSQL
- Redis
- JWT Bearer Authentication
- FluentValidation
- Serilog
- Swagger/OpenAPI

## API Endpoints

### GET /api/world
Get all worlds

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "World-Alpha",
      "description": "The first world - perfect for newcomers",
      "maxCapacity": 1000,
      "currentPlayers": 245,
      "isActive": true,
      "isFull": false,
      "availableSlots": 755,
      "capacityPercentage": 24.5,
      "region": "US-East",
      "kubernetesNamespace": "world-alpha",
      "status": "Active",
      "statistics": {
        "totalGamesPlayed": 1250,
        "totalPlayersJoined": 5400,
        "peakConcurrentPlayers": 892,
        "lastGameStartedAt": "2026-03-01T16:00:00Z",
        "lastPlayerJoinedAt": "2026-03-01T17:00:00Z"
      }
    }
  ]
}
```

### GET /api/world/available
Get available worlds (not full and active)

Returns worlds sorted by lowest player count first.

### GET /api/world/{worldId}
Get world by ID

### POST /api/world
Create a new world (Admin only)

**Request:**
```json
{
  "name": "World-Delta",
  "description": "Asian region server",
  "maxCapacity": 1000,
  "region": "Asia-East"
}
```

**Validation:**
- Name: 3-100 chars, alphanumeric + spaces/hyphens
- Max capacity: 1-10,000, multiple of 100
- Description: Max 500 chars

### PUT /api/world/{worldId}
Update world settings (Admin only)

**Request:**
```json
{
  "description": "Updated description",
  "maxCapacity": 2000,
  "isActive": true
}
```

### POST /api/world/{worldId}/increment-players
Increment player count (authenticated users)

Used when a player joins a world. Returns error if world is full.

### POST /api/world/{worldId}/decrement-players
Decrement player count (authenticated users)

Used when a player leaves a world.

## Configuration

### appsettings.json
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=postgres;Port=5432;Database=gameplatform_world;Username=postgres;Password=***",
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

## Database Schema

### Worlds Table
- Id (int, PK)
- Name (string, unique, indexed)
- Description (string)
- MaxCapacity (int) - default 1000
- CurrentPlayers (int) - default 0
- IsActive (bool, indexed) - default true
- Region (string, indexed)
- KubernetesNamespace (string) - for K8s deployment
- RedisConnectionString (string) - per-world Redis
- CreatedAt (datetime)
- UpdatedAt (datetime)

### WorldStatistics Table
- Id (int, PK)
- WorldId (int, FK to Worlds, unique indexed)
- TotalGamesPlayed (int)
- TotalPlayersJoined (int)
- PeakConcurrentPlayers (int)
- LastGameStartedAt (datetime, nullable)
- LastPlayerJoinedAt (datetime, nullable)
- CreatedAt (datetime)
- UpdatedAt (datetime)

### Seed Data
3 initial worlds are seeded:
1. **World-Alpha** (US-East) - 1000 capacity
2. **World-Beta** (US-West) - 1000 capacity
3. **World-Gamma** (EU-West) - 1000 capacity

## Validation Rules

### Create World
- **Name**: Required, 3-100 characters, alphanumeric + spaces/hyphens
- **Description**: Optional, max 500 characters
- **MaxCapacity**: Required, 1-10,000, must be multiple of 100
- **Region**: Optional, max 50 characters

### Update World
- **Description**: Optional, max 500 characters
- **MaxCapacity**: Optional, 1-10,000, must be multiple of 100
- **IsActive**: Optional boolean

## Caching Strategy

### Redis Keys
- `world:list` - All worlds (TTL: 5 minutes)
- `world:available:list` - Available worlds (TTL: 2 minutes)
- `world:{worldId}` - Specific world (TTL: 5 minutes)

### Cache Invalidation
Caches are invalidated on:
- World create
- World update
- Player count changes (increment/decrement)

## Capacity Management

### Per-World Limits
- Default: 1000 players
- Configurable: 100-10,000 (in increments of 100)
- Enforced at join time

### World Selection Logic
1. Get available worlds (active + not full)
2. Sort by current player count (ascending)
3. Return worlds with available slots
4. Client selects world
5. Increment player count
6. World marked full when CurrentPlayers >= MaxCapacity

## Kubernetes Integration

### Namespace Per World
Each world has its own Kubernetes namespace:
- `world-alpha` for World-Alpha
- `world-beta` for World-Beta
- Pattern: `world-{name-lowercase}`

### Redis Per World
Each world can have dedicated Redis instance:
- `redis-world-alpha:6379`
- Stored in `RedisConnectionString` field
- Enables per-world scaling

## Security Features
- JWT authentication required for player count operations
- Admin role required for create/update operations
- Non-root Docker user (appuser)
- Input validation on all endpoints
- CORS configuration
- Health checks for monitoring

## Running Locally

### Prerequisites
- .NET 8.0 SDK
- PostgreSQL
- Redis

### Run
```bash
cd src/backend/services/World.Service
dotnet run
```

API will be available at: http://localhost:5000
Swagger UI: http://localhost:5000

## Docker

### Build
```bash
docker build -t world-service:latest -f src/backend/services/World.Service/Dockerfile .
```

### Run
```bash
docker run -p 8080:8080 \
  -e ConnectionStrings__DefaultConnection="Host=postgres;Port=5432;Database=gameplatform_world;Username=postgres;Password=***" \
  -e ConnectionStrings__Redis="redis:6379" \
  -e Jwt__SecretKey="YourSecretKey" \
  world-service:latest
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
- Player count metrics

## Design Patterns
- **Repository Pattern**: Database access abstraction
- **Unit of Work**: Transaction management
- **Dependency Injection**: All services use DI
- **SOLID Principles**: Applied throughout
- **Clean Architecture**: Separation of concerns

## Dependencies
- Contracts.Lib: Shared DTOs
- Infrastructure.Lib: Redis, Database, Telemetry
- Security.Lib: JWT (for authentication)
- Common.Lib: Constants, Extensions

## Integration with Other Services

### Auth.Service
- Users select world during registration
- World ID stored in user profile
- JWT token includes worldId claim

### Player.Service
- Players belong to a world
- Player count synced with World.Service

### Game.Service
- Game sessions run in specific world
- Game uses world's Redis connection
- Statistics updated after each game

## Future Enhancements
- [ ] Dynamic world scaling (auto-create when full)
- [ ] World merge/split operations
- [ ] Cross-world transfers
- [ ] World events and seasons
- [ ] World leaderboards
- [ ] Geographic routing (nearest world)
- [ ] World chat/communication
