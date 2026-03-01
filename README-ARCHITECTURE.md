# Game Platform - Microservices Architecture

## Overview
Enterprise-grade microservices architecture for a multiplayer strategy game inspired by openage, built with C# backend and TypeScript frontend.

## Architecture

### Backend Services (C# .NET 8.0)
- **Gateway.Service**: API Gateway using Ocelot
- **Auth.Service**: JWT authentication and user management
- **Game.Service**: Core game logic and mechanics
- **Player.Service**: Player profiles and statistics
- **World.Service**: World instances and capacity management (1000 users per world)
- **Match.Service**: Game sessions and matchmaking
- **Leaderboard.Service**: Rankings and achievements
- **Payment.Service**: In-app purchases (Google Play, extensible to Apple Store)
- **Notification.Service**: Real-time notifications via SignalR WebSockets
- **Backoffice.Service**: Admin and management APIs

### Frontend (TypeScript)
- Phaser.js 3 game engine
- SignalR client for WebSocket communication
- Mobile-optimized UI for tablets and smartphones

### Shared Libraries
- **Common.Lib**: Utilities, extensions, helpers
- **Contracts.Lib**: DTOs, interfaces, shared models
- **Infrastructure.Lib**: Redis, logging, monitoring, database
- **Security.Lib**: JWT, encryption, authorization

### Infrastructure
- **Kubernetes**: On-premises cluster
- **Terraform**: Infrastructure as Code
- **Flux CD**: GitOps continuous deployment
- **Redis**: Cache per world/namespace
- **Azure Container Registry**: Docker image registry
- **Application Insights**: Monitoring and telemetry
- **Log Analytics**: Centralized logging
- **Strapi CMS**: Content management for game configuration

## Design Patterns & Principles

### SOLID Principles
- Single Responsibility Principle
- Open/Closed Principle
- Liskov Substitution Principle
- Interface Segregation Principle
- Dependency Inversion Principle

### Design Patterns
- **CQRS**: Command Query Responsibility Segregation
- **Repository Pattern**: Data access abstraction
- **Unit of Work**: Transaction management
- **Dependency Injection**: Loose coupling
- **Factory Pattern**: Object creation
- **Strategy Pattern**: Payment provider extensibility
- **Observer Pattern**: Event notifications

## Technology Stack

### Backend
- .NET 8.0
- ASP.NET Core Web API
- SignalR (WebSockets)
- Entity Framework Core
- Ocelot (API Gateway)
- MediatR (CQRS)
- FluentValidation
- Serilog
- xUnit / NUnit
- StackExchange.Redis

### Frontend
- TypeScript 5.0
- Phaser.js 3
- Webpack
- SignalR Client
- Mobile-first responsive design

### Infrastructure
- Kubernetes 1.28+
- Terraform 1.6+
- Flux CD 2.0+
- Redis 7.0+
- Helm 3.0+
- Docker
- Azure Container Registry
- Application Insights
- Log Analytics Workspace
- Strapi CMS

## Project Structure

```
/
├── src/
│   ├── backend/
│   │   ├── services/
│   │   │   ├── Gateway.Service/
│   │   │   ├── Auth.Service/
│   │   │   ├── Game.Service/
│   │   │   ├── Player.Service/
│   │   │   ├── World.Service/
│   │   │   ├── Match.Service/
│   │   │   ├── Leaderboard.Service/
│   │   │   ├── Payment.Service/
│   │   │   ├── Notification.Service/
│   │   │   └── Backoffice.Service/
│   │   └── shared/
│   │       ├── Common.Lib/
│   │       ├── Contracts.Lib/
│   │       ├── Infrastructure.Lib/
│   │       └── Security.Lib/
│   ├── frontend/
│   │   └── game-client/
│   └── cms/
│       └── strapi/
├── infrastructure/
│   ├── terraform/
│   │   ├── modules/
│   │   └── environments/
│   ├── flux/
│   └── helm-charts/
├── pipelines/
│   ├── github-actions/
│   └── azure-devops/
└── docs/
```

## Multi-World System

Each game world supports up to 1000 concurrent players (configurable):
- Separate Kubernetes namespace per world
- Dedicated Redis cache per world
- Isolated resources and scaling
- Players choose world during registration

## CI/CD Pipeline

### Build (GitHub Actions & Azure DevOps)
1. Code checkout
2. Restore dependencies
3. Build .NET services
4. Run unit tests
5. Build Docker images
6. Push to Azure Container Registry
7. Security scanning

### Deploy (Flux CD)
1. Monitor Git repository for changes
2. Pull latest Helm charts
3. Deploy to Kubernetes via Helm
4. Health checks
5. Gradual rollout

## Monitoring & Logging

- **Application Insights**: Performance monitoring, custom telemetry
- **Serilog**: Structured logging
- **Log Analytics**: Centralized log aggregation
- **Custom Metrics**: Game-specific KPIs
- **Purchase Events**: Google Play transactions (extensible to Apple Store)

## Security

- JWT authentication with refresh tokens
- API rate limiting per endpoint
- HTTPS/TLS everywhere
- Network policies in Kubernetes
- Azure Key Vault for secrets
- OWASP security best practices
- Input validation and sanitization
- DDoS protection

## Cost Optimization

- Efficient resource limits and requests
- Horizontal Pod Autoscaling (HPA)
- Redis connection pooling
- Smart caching strategies
- Multi-stage Docker builds
- Spot instances where applicable

## Getting Started

### Prerequisites
- .NET 8.0 SDK
- Node.js 18+ and npm
- Docker
- Kubernetes cluster (on-prem)
- Terraform
- kubectl and Helm
- Azure subscription

### Local Development
```bash
# Backend
cd src/backend/services/Game.Service
dotnet run

# Frontend
cd src/frontend/game-client
npm install
npm run dev
```

### Build Docker Images
```bash
# Build all services
./scripts/build-all.sh

# Build specific service
docker build -t game-service:latest -f src/backend/services/Game.Service/Dockerfile .
```

### Deploy to Kubernetes
```bash
# Apply Terraform
cd infrastructure/terraform/environments/dev
terraform init
terraform apply

# Install Flux
flux install

# Deploy services
kubectl apply -f infrastructure/flux/
```

## License

This project is inspired by [openage](https://github.com/SFTtech/openage) (GPL-3.0 license).
The game logic and assets are derivative works and comply with GPL-3.0 requirements.
All original code in this repository is licensed under GPL-3.0.

## Documentation

- [Architecture Design](docs/architecture.md)
- [API Documentation](docs/api.md)
- [Deployment Guide](docs/deployment.md)
- [Development Guide](docs/development.md)
- [Security Practices](docs/security.md)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Follow SOLID principles and design patterns
4. Add tests for new functionality
5. Submit a pull request

## Support

For issues and questions, please open a GitHub issue or contact the team.
