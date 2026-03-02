# Deployment Guide - Racing Game

This guide covers deploying the racing game application to production.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Docker Deployment](#docker-deployment)
- [CI/CD Pipeline](#cicd-pipeline)
- [Health Checks](#health-checks)
- [Monitoring](#monitoring)

## Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- Node.js 18+ (for local development)
- PostgreSQL 15+ (if not using Docker)

## Environment Configuration

### Frontend Environment Variables

Create a `.env` file in `src/frontend/`:

```env
# API Configuration
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_WS_URL=wss://api.yourdomain.com

# Feature Flags
VITE_ENABLE_SOUND=true
VITE_ENABLE_PARTICLES=true
VITE_ENABLE_TOUCH_CONTROLS=true

# Game Configuration
VITE_MAX_PLAYERS=10
VITE_GAME_TICK_RATE=60
```

### Backend Environment Variables

Create a `.env` file in the project root for Docker Compose:

```env
# Database Configuration
DB_NAME=racingame
DB_USER=gameuser
DB_PASSWORD=<secure-password>
DB_CONNECTION_STRING=Host=database;Database=racingame;Username=gameuser;Password=<secure-password>

# Application
ASPNETCORE_ENVIRONMENT=Production
```

## Docker Deployment

### Option 1: Frontend Only (Static Hosting)

Build and deploy the frontend as static files:

```bash
cd src/frontend
npm ci
npm run build

# The built files are in dist/ directory
# Deploy to any static hosting service (Netlify, Vercel, S3, etc.)
```

### Option 2: Docker Container

Build and run the frontend in a Docker container:

```bash
cd src/frontend
docker build -f Dockerfile.production -t racing-game-frontend:latest .
docker run -d -p 80:80 --name racing-game racing-game-frontend:latest
```

### Option 3: Full Stack with Docker Compose

Deploy the entire application stack:

```bash
# Production deployment
docker-compose -f docker-compose.production.yml up -d

# Check status
docker-compose -f docker-compose.production.yml ps

# View logs
docker-compose -f docker-compose.production.yml logs -f

# Stop services
docker-compose -f docker-compose.production.yml down
```

## CI/CD Pipeline

### GitHub Actions

The project includes a GitHub Actions workflow (`.github/workflows/frontend-ci.yml`) that:

1. **On Pull Request:**
   - Runs linting
   - Runs type checking
   - Runs all tests
   - Builds the application
   - Scans for security vulnerabilities

2. **On Push to Main/Develop:**
   - All of the above, plus:
   - Builds Docker image
   - Tests Docker container
   - Uploads build artifacts

### Manual Deployment

To manually trigger a deployment:

```bash
# Build production image
docker-compose -f docker-compose.production.yml build

# Deploy
docker-compose -f docker-compose.production.yml up -d

# Verify health
curl http://localhost/health
curl http://localhost:8080/health
```

## Health Checks

### Frontend Health Check

```bash
curl http://localhost/health
# Expected: 200 OK "healthy"
```

### Backend Health Check

```bash
curl http://localhost:8080/health
# Expected: 200 OK with JSON health status
```

### Database Health Check

```bash
docker exec racing-game-db pg_isready -U gameuser
# Expected: "accepting connections"
```

### Docker Health Status

```bash
docker ps --format "table {{.Names}}\t{{.Status}}"
```

## Monitoring

### Application Logs

```bash
# Frontend logs
docker logs racing-game-frontend -f

# Backend logs
docker logs racing-game-backend -f

# Database logs
docker logs racing-game-db -f
```

### Resource Usage

```bash
# Monitor container resource usage
docker stats

# Specific container
docker stats racing-game-frontend
```

### Performance Metrics

The application includes:
- **Health check endpoints** for uptime monitoring
- **Nginx access logs** for request tracking
- **Built-in error logging** in the frontend

## Scaling

### Horizontal Scaling

To scale the frontend:

```bash
docker-compose -f docker-compose.production.yml up -d --scale frontend=3
```

### Load Balancing

For production, use a load balancer (e.g., nginx, HAProxy) in front of multiple frontend instances.

## Security Best Practices

1. **Use HTTPS** in production (configure SSL certificates in nginx)
2. **Set secure environment variables** (never commit secrets)
3. **Enable security headers** (already configured in nginx.conf)
4. **Regular security updates** (`docker-compose pull` to update base images)
5. **Limit exposed ports** (only expose what's necessary)
6. **Use secrets management** (Docker Secrets, Kubernetes Secrets, AWS Secrets Manager)

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker logs racing-game-frontend

# Inspect container
docker inspect racing-game-frontend

# Check health
docker exec racing-game-frontend wget --spider http://localhost/health
```

### Build Failures

```bash
# Clear build cache
docker builder prune

# Rebuild without cache
docker-compose build --no-cache
```

### Port Already in Use

```bash
# Find process using port 80
lsof -i :80

# Or use different port in docker-compose.yml
ports:
  - "8080:80"  # Host port 8080, container port 80
```

## Rollback

To rollback to a previous version:

```bash
# Tag current version
docker tag racing-game-frontend:latest racing-game-frontend:backup

# Pull/build previous version
docker pull racing-game-frontend:v1.2.3
docker tag racing-game-frontend:v1.2.3 racing-game-frontend:latest

# Restart
docker-compose -f docker-compose.production.yml up -d
```

## Support

For issues or questions:
1. Check logs: `docker-compose logs`
2. Verify health checks: `curl http://localhost/health`
3. Review this guide
4. Check GitHub Issues
