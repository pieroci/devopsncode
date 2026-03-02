# Auth.Service - Authentication & User Management

## Overview
Microservice responsible for user authentication, registration, and JWT token management for the Game Platform.

## Features
- ✅ User registration with world selection
- ✅ User login with JWT authentication
- ✅ Refresh token flow for seamless re-authentication
- ✅ Token revocation
- ✅ Password hashing with BCrypt (12 rounds)
- ✅ Redis caching for user data
- ✅ PostgreSQL database with EF Core
- ✅ FluentValidation for input validation
- ✅ Serilog with Application Insights
- ✅ Swagger/OpenAPI documentation
- ✅ Health checks

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

### POST /api/auth/register
Register a new user

**Request:**
```json
{
  "username": "player1",
  "email": "player1@example.com",
  "password": "SecurePassword123",
  "selectedWorldId": 1
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "abc123...",
    "expiresAt": "2026-03-01T17:00:00Z",
    "user": {
      "id": "guid",
      "username": "player1",
      "email": "player1@example.com",
      "worldId": 1,
      "worldName": "World-1",
      "createdAt": "2026-03-01T16:00:00Z"
    }
  },
  "message": "Registration successful"
}
```

### POST /api/auth/login
Login with username/email and password

**Request:**
```json
{
  "emailOrUsername": "player1",
  "password": "SecurePassword123"
}
```

### POST /api/auth/refresh
Refresh access token using refresh token

**Request:**
```json
{
  "refreshToken": "abc123..."
}
```

### POST /api/auth/revoke
Revoke a refresh token (requires authentication)

**Request:**
```json
{
  "refreshToken": "abc123..."
}
```

## Configuration

### appsettings.json
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=postgres;Port=5432;Database=gameplatform_auth;Username=postgres;Password=<password>",
    "Redis": "redis:6379"
  },
  "Jwt": {
    "SecretKey": "<your-secret-key>",
    "Issuer": "GamePlatform.Auth",
    "Audience": "GamePlatform",
    "AccessTokenExpirationMinutes": "60",
    "RefreshTokenExpirationDays": "7"
  },
  "ApplicationInsights": {
    "InstrumentationKey": "<your-key>"
  }
}
```

## Database Schema

### Users Table
- Id (UUID, PK)
- Username (string, unique, indexed)
- Email (string, unique, indexed)
- PasswordHash (string)
- WorldId (int, indexed)
- IsActive (bool)
- EmailVerified (bool)
- LastLoginAt (datetime, nullable)
- CreatedAt (datetime)
- UpdatedAt (datetime)

### RefreshTokens Table
- Id (UUID, PK)
- UserId (UUID, FK to Users)
- Token (string, unique, indexed)
- ExpiresAt (datetime)
- IsRevoked (bool)
- RevokedAt (datetime, nullable)
- ReplacedByToken (string, nullable)
- CreatedAt (datetime)
- UpdatedAt (datetime)

## Validation Rules

### Username
- Required
- 3-20 characters
- Only letters, numbers, underscores, hyphens

### Email
- Required
- Valid email format

### Password
- Required
- 8-100 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

## Security Features
- BCrypt password hashing (12 rounds)
- JWT with configurable expiration
- Refresh token rotation
- Token revocation support
- Non-root Docker user
- Input validation
- CORS configuration

## Running Locally

### Prerequisites
- .NET 8.0 SDK
- PostgreSQL
- Redis

### Run
```bash
cd src/backend/services/Auth.Service
dotnet run
```

API will be available at: http://localhost:5000
Swagger UI: http://localhost:5000

## Docker

### Build
```bash
docker build -t auth-service:latest -f src/backend/services/Auth.Service/Dockerfile .
```

### Run
```bash
docker run -p 8080:8080 \
  -e ConnectionStrings__DefaultConnection="Host=postgres;Port=5432;Database=gameplatform_auth;Username=postgres;Password=postgres" \
  -e ConnectionStrings__Redis="redis:6379" \
  -e Jwt__SecretKey="YourSecretKey" \
  auth-service:latest
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

## Design Patterns
- **Repository Pattern**: Database access abstraction
- **Unit of Work**: Transaction management
- **Dependency Injection**: All services use DI
- **SOLID Principles**: Applied throughout
- **Clean Architecture**: Separation of concerns

## Dependencies
- Contracts.Lib: Shared DTOs
- Infrastructure.Lib: Redis, Database, Telemetry
- Security.Lib: JWT, Password hashing
- Common.Lib: Constants, Extensions

## Future Enhancements
- [ ] Email verification
- [ ] Password reset
- [ ] Two-factor authentication
- [ ] Social login (Google, Facebook)
- [ ] Account lockout after failed attempts
- [ ] Password history
- [ ] User profile management
