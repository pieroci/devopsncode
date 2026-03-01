# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy shared libraries
COPY ["src/backend/shared/Common.Lib/Common.Lib.csproj", "src/backend/shared/Common.Lib/"]
COPY ["src/backend/shared/Contracts.Lib/Contracts.Lib.csproj", "src/backend/shared/Contracts.Lib/"]
COPY ["src/backend/shared/Infrastructure.Lib/Infrastructure.Lib.csproj", "src/backend/shared/Infrastructure.Lib/"]
COPY ["src/backend/shared/Security.Lib/Security.Lib.csproj", "src/backend/shared/Security.Lib/"]

# Copy service project
COPY ["src/backend/services/World.Service/World.Service.csproj", "src/backend/services/World.Service/"]

# Restore dependencies
RUN dotnet restore "src/backend/services/World.Service/World.Service.csproj"

# Copy all source files
COPY src/backend/ src/backend/

# Build
WORKDIR "/src/src/backend/services/World.Service"
RUN dotnet build "World.Service.csproj" -c Release -o /app/build

# Publish stage
FROM build AS publish
RUN dotnet publish "World.Service.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

# Create non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Copy published files
COPY --from=publish /app/publish .

# Set ownership
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Set environment variables
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

ENTRYPOINT ["dotnet", "World.Service.dll"]
