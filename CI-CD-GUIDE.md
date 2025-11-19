# Bus Ticket Backend - Complete CI/CD, Docker & Deployment Guide

> **Single comprehensive guide for NestJS backend CI/CD pipelines, Docker setup, secrets management, and deployment strategies.**

## 📋 Table of Contents

1. [🚀 CI/CD Workflows](#-cicd-workflows)
2. [🔑 Secrets Configuration](#-secrets-configuration)
3. [🐳 Docker Setup](#-docker-setup)
4. [💻 Local Development](#-local-development)
5. [🚀 Deployment Options](#-deployment-options)
6. [🔧 Useful Commands](#-useful-commands)
7. [🔍 Monitoring & Health Checks](#-monitoring--health-checks)
8. [🚨 Troubleshooting](#-troubleshooting)
9. [📈 Performance Optimizations](#-performance-optimizations)
10. [🔒 Security Best Practices](#-security-best-practices)

---

## 🚀 CI/CD Workflows

### Available Workflows

#### 1. Main CI/CD Pipeline (`.github/workflows/ci-cd.yml`)
**Triggers**: Push to `main`, `develop`, `feature/*` branches and PRs

**Features**:
- ✅ **Secrets validation** - Ensures all required secrets are available
- ✅ **PostgreSQL test database** setup with Redis
- ✅ **Comprehensive testing** - Unit tests, integration tests, linting
- ✅ **Code coverage** reporting with Codecov
- ✅ **Production builds** with artifact management
- ✅ **Staging deployment** - Develop branch → Render staging
- ✅ **Production deployment** - Main branch → production environment

**Workflow Structure**:
```yaml
Jobs:
├── validate-secrets    # Check all required secrets
├── test-and-lint      # Unit tests + ESLint + coverage
├── build-staging      # Build for develop branch
├── build-production   # Build for main branch  
├── deploy-staging     # Deploy develop → staging
└── deploy-production  # Deploy main → production
```

#### 2. Docker Pipeline (`.github/workflows/docker.yml`)
**Triggers**: Push to `main`, `develop` branches and version tags

**Features**:
- ✅ **Single Dockerfile** builds multiple service variants
- ✅ **Multi-platform builds** (amd64, arm64)
- ✅ **GitHub Container Registry** integration
- ✅ **Build caching** for faster builds
- ✅ **Security scanning** with Trivy vulnerability scanner
- ✅ **Service variants**: API, Worker, Migration

**Service Matrix**:
```yaml
Services:
├── API Service        # Main NestJS application
├── Worker Service     # Background job processing
└── Migration Service  # Database migrations
```

---

## 🔑 Secrets Configuration

### Required GitHub Repository Secrets

Add these secrets in GitHub (`Settings` → `Secrets and Variables` → `Actions` → `Repository secrets`):

#### Database Configuration
```bash
DATABASE_URL=postgresql://username:password@hostname:5432/dbname
DATABASE_HOST=your-postgres-host
DATABASE_PORT=5432
DATABASE_USERNAME=your-db-username
DATABASE_PASSWORD=your-secure-db-password
DATABASE_NAME=bus_ticket_db
```

#### Redis Configuration
```bash
REDIS_URL=redis://username:password@hostname:6379
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
```

#### Authentication
```bash
JWT_SECRET=your-super-secure-jwt-secret-at-least-32-characters
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your-refresh-token-secret-at-least-32-characters
JWT_REFRESH_EXPIRES_IN=7d
```

#### Render Deployment (Staging & Production)
```bash
RENDER_API_KEY=your-render-api-key
RENDER_SERVICE_ID=your-backend-service-id
RENDER_STAGING_SERVICE_ID=your-staging-service-id
```

#### External Services
```bash
EMAIL_HOST=your-email-smtp-host
EMAIL_PORT=587
EMAIL_USER=your-email-username
EMAIL_PASS=your-email-password
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

#### Docker Registry
```bash
DOCKER_USERNAME=your-github-username
DOCKER_PASSWORD=your-github-personal-access-token
```

#### Testing & Monitoring
```bash
CODECOV_TOKEN=your-codecov-token
SENTRY_DSN=your-sentry-dsn-url
```

### GitHub Environment Configuration

#### 1. Create Environments
Go to `Settings` → `Environments` and create:
- **development** - For feature branch testing
- **staging** - For develop branch deployment
- **production** - For main branch deployment

#### 2. Environment Protection Rules
```yaml
production:
  required_reviewers: 1-2 team members
  deployment_branches: main only
  
staging:
  required_reviewers: none
  deployment_branches: develop, main
```

#### 3. Environment Variables per Environment
```bash
# Development
NODE_ENV=development
LOG_LEVEL=debug

# Staging  
NODE_ENV=staging
LOG_LEVEL=info

# Production
NODE_ENV=production
LOG_LEVEL=error
```

### Render Service Configuration

#### Backend Service Environment Variables
```bash
NODE_ENV=production
DATABASE_URL=${{DATABASE_URL}}
REDIS_URL=${{REDIS_URL}}
JWT_SECRET=${{JWT_SECRET}}
PORT=10000
```

### Security Best Practices

1. **Never commit secrets** to repository
2. **Use different secrets** for each environment
3. **Rotate secrets regularly** (quarterly recommended)
4. **Use environment-specific** database and service instances
5. **Limit secret access** to required team members only

### Secret Validation Commands

```bash
# Check required environment variables
npm run validate:env

# Test database connection
npm run db:test

# Verify JWT secret strength
npm run validate:jwt
```

---

## 🐳 Docker Setup

### Single Dockerfile Architecture

This project uses a **single Dockerfile** with different commands controlled by environment variables. Perfect for small projects while maintaining flexibility.

```dockerfile
Architecture:
├── Development stage (local development with hot reload)
├── Builder stage (application building)
└── Production stage (all production services)
   ├── API service (main application)
   ├── Worker service (background jobs)
   └── Migration service (database migrations)
```

### Service Types

#### API Service (Default)
```bash
# Environment: SERVICE_TYPE=api (or not set)
# Command: node dist/main.js
docker-compose up api
```

#### Worker Service
```bash
# Environment: SERVICE_TYPE=worker
# Command: npm run start:worker
docker-compose up worker
```

#### Migration Service
```bash
# Environment: SERVICE_TYPE=migration
# Command: npm run migration:run
docker-compose run --rm migration
```

### Docker Compose Usage

#### Quick Start
```bash
# Start API + Database + Redis
docker-compose up

# Start with worker and migration services
docker-compose --profile worker --profile migration up
```

#### Specific Services
```bash
# Only API service
docker-compose up api postgres redis

# Only worker service
docker-compose up worker postgres redis

# Run migration once
docker-compose run --rm migration
```

#### Production Mode
```bash
# Build for production
docker-compose -f docker-compose.prod.yml up --build
```

### Available Docker Services

#### Development (`docker-compose.yml`)
- **api**: Main NestJS app with development mode (port 3001)
- **worker**: Background job processor
- **migration**: Database migration service
- **postgres**: PostgreSQL database (port 5432)
- **redis**: Redis cache (port 6379)
- **pgadmin**: Database management tool (port 5050)
- **redis-commander**: Redis management tool (port 8081)
- **nginx**: Load balancer for production (ports 80/443)

### Environment Variables

#### Required for All Services
```bash
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/db
```

#### Service-Specific
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

### Docker Profiles

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

# Management tools
docker-compose --profile tools up

# Production setup
docker-compose --profile production up
```

### Production Docker Images

The CI/CD pipeline builds multiple tagged images from the same Dockerfile:
```bash
ghcr.io/owner/bus-ticket-backend:latest           # API service
ghcr.io/owner/bus-ticket-backend:latest-worker    # Worker service  
ghcr.io/owner/bus-ticket-backend:latest-migration # Migration service
```

### Deployment Commands
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

---

## 💻 Local Development

### Setup Instructions

#### Without Docker
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your local settings

# Run development server
npm run start:dev

# Run tests
npm run test

# Build for production
npm run build
```

#### With Docker (Recommended)
```bash
# Build and start development environment
docker-compose up --build

# Run specific commands in container
docker-compose exec api npm run test
docker-compose exec api npm run lint
```

### Available Scripts
```bash
npm run build          # Build the application
npm run start         # Start production server
npm run start:dev     # Start development server with watch mode
npm run start:debug   # Start with debug mode
npm run start:worker  # Start background worker
npm run test          # Run unit tests
npm run test:watch    # Run tests in watch mode
npm run test:cov      # Run tests with coverage
npm run test:e2e      # Run end-to-end tests
npm run lint          # Run ESLint
npm run format        # Format code with Prettier
npm run migration:run # Run database migrations
npm run migration:generate # Generate new migration
```

### Environment Configuration

1. Copy environment file:
```bash
cp .env.example .env
```

2. Edit `.env` with your configuration:
```bash
# Environment variables for development
NODE_ENV=development
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=bus_ticket_dev
JWT_SECRET=your-dev-jwt-secret-key
REDIS_URL=redis://localhost:6379
PORT=3000
LOG_LEVEL=debug
CORS_ORIGIN=http://localhost:8000
```

---

## 🚀 Deployment Options

### Option 1: Render Deployment (Recommended)

#### Staging (Develop Branch)
- **Automatic deployment** when pushing to `develop` branch
- **Environment**: Staging with separate database
- **URL**: `https://bus-ticket-backend-staging.onrender.com`

#### Production (Main Branch)
- **Manual/automatic deployment** when pushing to `main` branch
- **Environment**: Production with production database
- **URL**: `https://bus-ticket-backend.onrender.com`

#### Render Setup
1. Create Render account and services
2. Add environment variables in Render dashboard
3. Configure GitHub repository secrets
4. Push to trigger deployment

### Option 2: Docker Compose Production
```bash
# Deploy using docker-compose on your server
docker-compose --profile production up -d --build
```

### Option 3: Kubernetes Deployment
```yaml
- name: Deploy to Kubernetes
  run: |
    kubectl set image deployment/backend-app backend=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
    kubectl rollout status deployment/backend-app
  env:
    KUBECONFIG: ${{ secrets.KUBECONFIG }}
```

### Option 4: AWS ECS Deployment
```yaml
- name: Deploy to AWS ECS
  run: |
    aws ecs update-service --cluster your-cluster --service your-service --force-new-deployment
  env:
    AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
    AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
    AWS_DEFAULT_REGION: us-east-1
```

### Option 5: Heroku Deployment
```yaml
- name: Deploy to Heroku
  uses: akhileshns/heroku-deploy@v3.12.12
  with:
    heroku_api_key: ${{secrets.HEROKU_API_KEY}}
    heroku_app_name: "your-backend-app-name"
    heroku_email: "your-email@example.com"
```

---

## 🔧 Useful Commands

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

### Database Operations
```bash
# Run migrations
docker-compose exec api npm run migration:run

# Generate migration
docker-compose exec api npm run migration:generate -- MigrationName

# Seed database
docker-compose exec api npm run seed

# Access database directly
docker-compose exec postgres psql -U postgres -d bus_ticket_dev
```

### Development Commands
```bash
# Execute commands in running container
docker-compose exec api npm run test
docker-compose exec api npm run lint

# View container logs
docker-compose logs api

# Clean up (removes volumes too)
docker-compose down -v

# Container shell access
docker-compose exec api sh
```

---

## 🔍 Monitoring & Health Checks

### Health Check Endpoints
- **Basic Health**: `http://localhost:3001/health`
- **Database Health**: `http://localhost:3001/health/database`
- **Ready Check**: `http://localhost:3001/health/ready`

### Debugging
- **Development**: Debug port 9229 exposed for IDE connection
- **Logs**: Use `docker-compose logs -f api`
- **Container Shell**: `docker-compose exec api sh`

### CI/CD Monitoring
- **Workflow Status**: Check Actions tab in GitHub
- **Deployment Status**: Monitor in Environments tab
- **Security Alerts**: Review in Security tab
- **Code Coverage**: View in pull request comments

### Docker Health Checks
```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD /app/health-check.sh
```

---

## 🚨 Troubleshooting

### Common Issues

#### 1. Database Connection Fails
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Verify environment variables
docker-compose exec api printenv | grep DATABASE

# Check network connectivity
docker-compose exec api ping postgres

# Check database logs
docker-compose logs postgres
```

#### 2. Tests Fail in CI
- Verify test database configuration
- Check environment variables for test environment
- Review test logs in GitHub Actions
- Ensure PostgreSQL and Redis services are healthy

#### 3. Docker Build Fails
```bash
# Verify Dockerfile syntax
docker build -t test-backend .

# Check if all dependencies are in package.json
cat package.json

# Review Docker build logs
docker-compose logs

# Clear Docker cache
docker system prune -a
```

#### 4. Port Conflicts
```bash
# Check what's using ports
netstat -tulpn | grep :3001
netstat -tulpn | grep :5432

# Stop conflicting services
docker-compose down

# Change ports in docker-compose.yml
ports:
  - "3002:3001"  # Host:Container
```

#### 5. Service Won't Start
```bash
# Check logs
docker-compose logs service-name

# Check service configuration
docker-compose config

# Restart service
docker-compose restart service-name
```

#### 6. Permission Issues
```bash
# Fix file permissions
sudo chown -R $USER:$USER .
sudo chmod -R 755 .
```

#### 7. GitHub Actions Workflow Fails
- **Secrets missing**: Verify all required secrets are set
- **Environment issues**: Check environment configurations
- **Build failures**: Review build logs and dependencies
- **Deployment failures**: Check service IDs and API keys

### Performance Issues

#### Slow Build Times
```bash
# Enable Docker BuildKit
DOCKER_BUILDKIT=1 docker-compose build

# Use multi-stage builds (already configured)
# Clear Docker cache
docker system prune -a

# Check build context size
du -sh .
```

#### Memory Issues
```bash
# Increase Docker memory limits
# Monitor container resources
docker stats

# Optimize database queries
# Check memory usage in application
```

### Debugging Steps

1. **Check Logs**: Always start with container and workflow logs
2. **Verify Environment**: Ensure all environment variables are set
3. **Test Locally**: Reproduce issues in local environment
4. **Check Dependencies**: Verify all services are running
5. **Review Configuration**: Double-check docker-compose and Dockerfile

---

## 📈 Performance Optimizations

### CI/CD Optimizations
- **Dependency Caching**: npm packages cached between runs
- **Build Caching**: Docker layer caching enabled
- **Parallel Jobs**: Tests and builds run in parallel
- **Conditional Deployment**: Only deploys on successful tests
- **Artifact Reuse**: Build artifacts shared between jobs
- **Multi-platform Builds**: Support for different architectures

### Application Optimizations
- **Connection Pooling**: PostgreSQL connection pooling configured
- **Redis Caching**: Cache frequently accessed data
- **Compression**: Enable gzip compression
- **Static Assets**: Serve static files efficiently
- **Database Indexing**: Optimize database queries with proper indexes
- **Memory Management**: Optimize memory usage in Node.js

### Docker Optimizations
- **Multi-stage Builds**: Reduce final image size
- **Layer Caching**: Optimize Dockerfile for better caching
- **Base Image**: Use Alpine Linux for smaller images
- **Health Checks**: Implement proper health checking
- **Resource Limits**: Set appropriate CPU and memory limits

---

## 🔒 Security Best Practices

### Secret Management
- **GitHub Secrets**: All secrets stored securely in GitHub
- **Environment Isolation**: Separate dev/staging/production
- **Regular Rotation**: Rotate secrets quarterly
- **Access Control**: Limit secret access to required team members
- **No Hardcoding**: Never hardcode secrets in code

### Application Security
- **Input Validation**: Validate all incoming data
- **CORS Configuration**: Properly configured CORS origins
- **Rate Limiting**: Implement API rate limiting
- **Authentication**: Strong JWT implementation
- **Authorization**: Role-based access control
- **SQL Injection**: Use parameterized queries

### Infrastructure Security
- **Vulnerability Scanning**: Automatic Docker image scanning with Trivy
- **Network Security**: Proper network isolation
- **Database Security**: Encrypted connections and access controls
- **Container Security**: Run containers as non-root users
- **SSL/TLS**: Use HTTPS for all communications

### CI/CD Security
- **Protected Branches**: Require reviews for main branches
- **Environment Protection**: Deployment approvals for production
- **Dependency Scanning**: Automated security scanning
- **Access Logging**: Monitor all access and deployments

---

## 🎯 Advantages of Single Dockerfile

✅ **Simplified maintenance** - One Dockerfile to maintain
✅ **Consistent base** - All services use same Node.js version
✅ **Shared dependencies** - Common packages installed once  
✅ **Easier CI/CD** - Single build process with different tags
✅ **Flexible deployment** - Same image for different purposes
✅ **Small project friendly** - Less complexity than microservices
✅ **Cost effective** - Reduced build times and storage

---

## 📚 Additional Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [Docker Documentation](https://docs.docker.com/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [TypeORM Documentation](https://typeorm.io/)
- [Render Documentation](https://render.com/docs)
- [Redis Documentation](https://redis.io/documentation)

---

## 🆘 Getting Help

1. **Check Logs**: Always start with container and workflow logs
2. **GitHub Issues**: Review repository issues for known problems
3. **Documentation**: Consult official documentation
4. **Community**: Ask questions in NestJS Discord/Stack Overflow
5. **Debug Mode**: Use debug mode for step-by-step troubleshooting
6. **Team Support**: Contact team members for assistance

---

**This single Dockerfile approach provides the perfect balance between simplicity and flexibility for small to medium projects! 🚀**