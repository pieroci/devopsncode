# Testing Guide

## Overview
Comprehensive test suite for all GamePlatform microservices using xUnit, Moq, and FluentAssertions.

## Test Structure

```
src/backend/tests/
├── Shared.Tests.Lib/              # Shared test utilities
│   ├── Factories/                 # Test factories (DB, Redis)
│   ├── Generators/                # Fake data generators (Bogus)
│   ├── TestConstants.cs           # Shared constants
│   └── AssertionExtensions.cs     # Custom assertions
├── Auth.Service.Tests/
│   ├── Unit/                      # Business logic tests
│   └── Integration/               # API endpoint tests
├── World.Service.Tests/
│   ├── Unit/
│   └── Integration/
└── Player.Service.Tests/
    ├── Unit/
    └── Integration/
```

## Test Stack

### Core Frameworks
- **xUnit** - Test framework
- **Moq** - Mocking framework
- **FluentAssertions** - Fluent assertion library
- **Bogus** - Fake data generation

### Integration Testing
- **Microsoft.AspNetCore.Mvc.Testing** - WebApplicationFactory
- **Microsoft.EntityFrameworkCore.InMemory** - In-memory database

### Coverage
- **coverlet.collector** - Code coverage collection

## Running Tests

### Run All Tests
```bash
cd src/backend
dotnet test
```

### Run Specific Service Tests
```bash
dotnet test tests/Auth.Service.Tests/
dotnet test tests/World.Service.Tests/
dotnet test tests/Player.Service.Tests/
```

### Run Unit Tests Only
```bash
dotnet test --filter "FullyQualifiedName~Unit"
```

### Run Integration Tests Only
```bash
dotnet test --filter "FullyQualifiedName~Integration"
```

### With Code Coverage
```bash
dotnet test /p:CollectCoverage=true /p:CoverletOutputFormat=opencover
```

### Verbose Output
```bash
dotnet test --logger "console;verbosity=detailed"
```

## Test Categories

### Unit Tests
- **Purpose**: Test business logic in isolation
- **Dependencies**: Mocked (Redis, Logger, etc.)
- **Database**: In-memory EF Core
- **Speed**: <100ms per test
- **Coverage**: 80%+ target

### Integration Tests
- **Purpose**: Test full API endpoints
- **Dependencies**: Real (except external services)
- **Database**: In-memory per test
- **Speed**: <500ms per test
- **Coverage**: All endpoints

## Shared Test Utilities

### TestDbContextFactory
```csharp
// Create in-memory database
var context = TestDbContextFactory.CreateInMemoryDbContext<AuthDbContext>();

// Seed test data
await TestDbContextFactory.SeedDatabaseAsync(context, ctx =>
{
    ctx.Users.Add(new User { Email = "test@test.com" });
});
```

### TestRedisFactory
```csharp
// Create mock Redis service
var mockCache = TestRedisFactory.CreateMockRedisCacheService();

// With cached data
var mockCache = TestRedisFactory.CreateMockRedisCacheServiceWithData("key", value);
```

### Fake Data Generators
```csharp
// Generate fake user
var user = FakeUserGenerator.GenerateFakeUser();

// Generate fake player
var player = FakePlayerGenerator.GenerateFakePlayer(userId: 100, worldId: 1);

// Generate fake world
var world = FakeWorldGenerator.GenerateFakeWorld();
```

### JWT Token Generator
```csharp
// Generate valid JWT token for testing
var token = JwtTokenGenerator.GenerateToken(
    userId: 1,
    email: "test@test.com",
    username: "testuser",
    worldId: 1
);

// Use in HTTP client
client.DefaultRequestHeaders.Authorization = 
    new AuthenticationHeaderValue("Bearer", token);
```

## Custom Assertions

### API Response Assertions
```csharp
// Assert successful response
response.ShouldBeSuccessfulResponse();

// Assert response has data
var data = response.ShouldHaveData<ApiResponse<PlayerDto>, PlayerDto>();

// Assert error response
response.ShouldBeErrorResponse();
response.ShouldHaveErrorMessage("expected error");
```

### Collection Assertions
```csharp
// Assert not null or empty
collection.ShouldNotBeNullOrEmpty();
```

### DateTime Assertions
```csharp
// Assert recent (within last minute)
dateTime.ShouldBeRecent();
```

### Async Assertions
```csharp
// Assert completes within timeout
await task.ShouldCompleteWithin(TimeSpan.FromSeconds(5));
```

## Test Naming Convention

Format: `[ClassName]_[MethodName]_[ExpectedBehavior]`

Examples:
```csharp
AuthService_Register_ReturnsSuccessWithToken()
PlayerService_AddExperience_IncrementsLevelWhenThresholdReached()
WorldService_GetAvailable_FiltersByCapacity()
```

## Test Organization

### Arrange-Act-Assert Pattern
```csharp
[Fact]
public async Task CreatePlayer_ValidRequest_ReturnsSuccess()
{
    // Arrange
    var request = new CreatePlayerRequest 
    { 
        UserId = 100, 
        DisplayName = "Test" 
    };

    // Act
    var result = await _service.CreatePlayerAsync(request);

    // Assert
    result.Success.Should().BeTrue();
    result.Data.Should().NotBeNull();
}
```

### Test Cleanup
```csharp
public class MyTests : IDisposable
{
    private readonly MyDbContext _context;

    public MyTests()
    {
        // Setup
        _context = CreateContext();
    }

    public void Dispose()
    {
        // Cleanup
        _context.Dispose();
    }
}
```

## Test Coverage Goals

### Minimum Coverage
- **Unit Tests**: 80% code coverage
- **Integration Tests**: 100% endpoint coverage
- **Critical Paths**: 100% coverage

### Coverage Report
```bash
# Generate coverage report
dotnet test /p:CollectCoverage=true /p:CoverletOutput=./coverage/ /p:CoverletOutputFormat=lcov

# View HTML report (requires ReportGenerator)
reportgenerator -reports:coverage.opencover.xml -targetdir:coverage-report
```

## Best Practices

### 1. Test Isolation
- Each test runs independently
- Use unique database names
- Clean up after each test

### 2. Fast Tests
- Unit tests < 100ms
- Integration tests < 500ms
- Avoid unnecessary delays

### 3. Readable Tests
- Clear test names
- One assertion per test (mostly)
- Use descriptive variable names

### 4. Maintainable Tests
- Share common setup code
- Use test utilities
- Keep tests DRY

### 5. Reliable Tests
- No external dependencies
- No timing dependencies
- Deterministic results

## Common Patterns

### Testing Authentication
```csharp
// Setup authenticated client
var token = JwtTokenGenerator.GenerateToken(1, "test@test.com");
_client.DefaultRequestHeaders.Authorization = 
    new AuthenticationHeaderValue("Bearer", token);
```

### Testing Validation
```csharp
[Fact]
public async Task Register_InvalidEmail_ReturnsBadRequest()
{
    var request = new RegisterRequest { Email = "invalid" };
    var result = await _service.RegisterAsync(request);
    
    result.Success.Should().BeFalse();
    result.Errors.Should().Contain(e => e.Contains("email"));
}
```

### Testing Database Operations
```csharp
// Create test data
_context.Users.Add(new User { Email = "test@test.com" });
await _context.SaveChangesAsync();

// Test operation
var result = await _service.GetUserAsync("test@test.com");

// Verify
result.Should().NotBeNull();
```

### Testing Cache Operations
```csharp
// Setup mock cache
_mockCache.Setup(x => x.GetAsync<User>("key"))
    .ReturnsAsync(cachedUser);

// Test
var result = await _service.GetUserAsync("key");

// Verify cache was called
_mockCache.Verify(x => x.GetAsync<User>("key"), Times.Once);
```

## Test Data

### Constants
```csharp
TestConstants.TestUserEmail = "test@example.com"
TestConstants.TestUserPassword = "TestPassword123!"
TestConstants.TestPlayerId = 1
TestConstants.TestWorldId = 1
```

### API Endpoints
```csharp
TestConstants.ApiEndpoints.AuthRegister
TestConstants.ApiEndpoints.PlayerCreate
TestConstants.ApiEndpoints.WorldGetById
```

## Debugging Tests

### Visual Studio
1. Set breakpoint in test
2. Right-click test → Debug Test

### VS Code
1. Install C# extension
2. Use Test Explorer
3. Click "Debug Test"

### Command Line
```bash
# Run with verbose output
dotnet test --logger "console;verbosity=detailed"

# Run single test
dotnet test --filter "FullyQualifiedName~TestName"
```

## CI/CD Integration

### GitHub Actions
```yaml
- name: Run Tests
  run: dotnet test --no-build --verbosity normal

- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage.opencover.xml
```

### Azure DevOps
```yaml
- task: DotNetCoreCLI@2
  displayName: 'Run Tests'
  inputs:
    command: test
    projects: '**/*Tests.csproj'
    arguments: '--collect:"XPlat Code Coverage"'
```

## Troubleshooting

### Tests Failing Randomly
- Check for shared state
- Ensure database isolation
- Remove timing dependencies

### Slow Tests
- Profile with `dotnet test --logger trx`
- Check for unnecessary waits
- Use in-memory databases

### Flaky Tests
- Add retry logic for external services
- Increase timeouts if needed
- Check for race conditions

## Examples

See test files for examples:
- `Auth.Service.Tests/Unit/AuthServiceTests.cs`
- `Auth.Service.Tests/Integration/AuthControllerTests.cs`
- `Player.Service.Tests/Unit/PlayerServiceTests.cs`

## Resources

- [xUnit Documentation](https://xunit.net/)
- [Moq Documentation](https://github.com/moq/moq4)
- [FluentAssertions Documentation](https://fluentassertions.com/)
- [Bogus Documentation](https://github.com/bchavez/Bogus)
