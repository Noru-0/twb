# Moved to CI-CD-GUIDE.md

This file has been consolidated into `CI-CD-GUIDE.md` for a comprehensive single guide.

Please refer to the [CI-CD-GUIDE.md](./CI-CD-GUIDE.md) file for complete Docker setup and usage instructions.

## Architecture

```
Single Dockerfile
├── Development stage (for local development)
├── Builder stage (for building the app)
└── Production stage (for all production services)
   ├── API service (main application)
   ├── Worker service (background jobs)
   └── Migration service (database migrations)
```

## Quick Start

### 1. Start All Services (Development)
```bash
# Start API + Database + Redis
docker-compose up

# Start with worker and migration services
docker-compose --profile worker --profile migration up
```

### 2. Start Specific Services
```bash
# Only API service
docker-compose up api postgres redis

# Only worker service
docker-compose up worker postgres redis

# Run migration once
docker-compose up migration postgres
```

### 3. Production Mode
```bash
# Build for production
docker-compose -f docker-compose.prod.yml up --build
```

## Service Types

### API Service (Default)
```bash
# Environment: SERVICE_TYPE=api (or not set)
# Command: node dist/main.js
docker-compose up api
```

### Worker Service
```bash
# Environment: SERVICE_TYPE=worker
# Command: npm run start:worker
docker-compose up worker
```

### Migration Service
```bash
# Environment: SERVICE_TYPE=migration
# Command: npm run migration:run
docker-compose run --rm migration
```

## Development Workflow

### 1. Local Development
```bash
# Start development environment
docker-compose up

# View logs
docker-compose logs -f api
docker-compose logs -f worker

# Restart a service
docker-compose restart api
```

### 2. Adding New Services
To add a new service type, update the Dockerfile CMD section:

```dockerfile
CMD ["sh", "-c", "case \"$SERVICE_TYPE\" in \
  \"worker\") npm run start:worker ;; \
  \"migration\") npm run migration:run ;; \
  \"scheduler\") npm run start:scheduler ;; \
  *) node dist/main.js ;; \
esac"]
```

Then add to docker-compose.yml:
```yaml
scheduler:
  build:
    context: .
    dockerfile: Dockerfile
    target: production
  environment:
    - SERVICE_TYPE=scheduler
  command: ["npm", "run", "start:scheduler"]
```

## Production Deployment

### 1. Docker Images
The CI/CD pipeline builds multiple tagged images from the same Dockerfile:
```bash
ghcr.io/owner/bus-ticket-backend:latest        # API service
ghcr.io/owner/bus-ticket-backend:latest-worker # Worker service  
ghcr.io/owner/bus-ticket-backend:latest-migration # Migration service
```

### 2. Deployment Commands
```bash
# Deploy API
docker run -d \
  -e SERVICE_TYPE=api \
  -e DATABASE_URL=postgresql://... \
  -p 3000:3000 \
  ghcr.io/owner/bus-ticket-backend:latest

# Deploy Worker
docker run -d \
  -e SERVICE_TYPE=worker \
  -e DATABASE_URL=postgresql://... \
  ghcr.io/owner/bus-ticket-backend:latest-worker

# Run Migration
docker run --rm \
  -e SERVICE_TYPE=migration \
  -e DATABASE_URL=postgresql://... \
  ghcr.io/owner/bus-ticket-backend:latest-migration
```

## Available Commands

### Docker Compose Commands
```bash
# Start all services
docker-compose up -d

# Start with specific profiles
docker-compose --profile worker up -d

# View service status
docker-compose ps

# View logs
docker-compose logs api
docker-compose logs worker

# Stop services
docker-compose down

# Rebuild and start
docker-compose up --build

# Scale worker service
docker-compose up --scale worker=3
```

### Direct Docker Commands
```bash
# Build image
docker build -t bus-ticket-backend .

# Run API
docker run -e SERVICE_TYPE=api bus-ticket-backend

# Run Worker
docker run -e SERVICE_TYPE=worker bus-ticket-backend

# Run Migration
docker run -e SERVICE_TYPE=migration bus-ticket-backend
```

## Environment Variables

### Required for All Services
```bash
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/db
```

### Service-Specific
```bash
# API Service
PORT=3000
JWT_SECRET=your-secret

# Worker Service  
REDIS_URL=redis://host:6379
WORKER_CONCURRENCY=5

# Migration Service
DATABASE_URL=postgresql://user:pass@host:5432/db
```

## Profiles

Use docker-compose profiles to control which services start:

```bash
# Default (only API + databases)
docker-compose up

# Include worker service
docker-compose --profile worker up

# Include migration service  
docker-compose --profile migration up

# All services
docker-compose --profile worker --profile migration up
```

## Advantages of Single Dockerfile

✅ **Simplified maintenance** - One Dockerfile to maintain
✅ **Consistent base** - All services use same Node.js version
✅ **Shared dependencies** - Common packages installed once  
✅ **Easier CI/CD** - Single build process with different tags
✅ **Flexible deployment** - Same image for different purposes
✅ **Small project friendly** - Less complexity than microservices

## Troubleshooting

### Service Won't Start
```bash
# Check logs
docker-compose logs service-name

# Check service configuration
docker-compose config

# Restart service
docker-compose restart service-name
```

### Database Connection Issues
```bash
# Check if database is ready
docker-compose ps postgres

# Run migration manually
docker-compose run --rm migration

# Connect to database
docker-compose exec postgres psql -U postgres -d bus_ticket_dev
```

### Port Conflicts
```bash
# Change ports in docker-compose.yml
ports:
  - "3001:3000"  # Host:Container
```

This single Dockerfile approach provides the perfect balance between simplicity and flexibility for small to medium projects! 🐳