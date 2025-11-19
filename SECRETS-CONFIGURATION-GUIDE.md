# Moved to CI-CD-GUIDE.md

This file has been consolidated into `CI-CD-GUIDE.md` for a comprehensive single guide.

Please refer to the [CI-CD-GUIDE.md](./CI-CD-GUIDE.md) file for complete secrets configuration instructions.

### Repository Secrets (Settings > Secrets and Variables > Actions > Repository secrets)

#### Database Configuration
```
DATABASE_URL=postgresql://username:password@hostname:5432/dbname
DATABASE_HOST=your-postgres-host
DATABASE_PORT=5432
DATABASE_USERNAME=your-db-username
DATABASE_PASSWORD=your-secure-db-password
DATABASE_NAME=bus_ticket_db
```

#### Redis Configuration
```
REDIS_URL=redis://username:password@hostname:6379
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
```

#### Authentication
```
JWT_SECRET=your-super-secure-jwt-secret-at-least-32-characters
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your-refresh-token-secret-at-least-32-characters
JWT_REFRESH_EXPIRES_IN=7d
```

#### Render Deployment
```
RENDER_API_KEY=your-render-api-key
RENDER_SERVICE_ID=your-backend-service-id
RENDER_STAGING_SERVICE_ID=your-staging-service-id
```

#### External Services
```
EMAIL_HOST=your-email-smtp-host
EMAIL_PORT=587
EMAIL_USER=your-email-username
EMAIL_PASS=your-email-password
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

#### Docker Registry
```
DOCKER_USERNAME=your-github-username
DOCKER_PASSWORD=your-github-personal-access-token
```

#### Testing & Monitoring
```
CODECOV_TOKEN=your-codecov-token
SENTRY_DSN=your-sentry-dsn-url
```

## Required Secrets for Bus-Ticket-Frontend

### Repository Secrets

#### API Configuration
```
NEXT_PUBLIC_API_URL=https://your-backend-api.onrender.com
NEXT_PUBLIC_API_URL_STAGING=https://your-staging-api.onrender.com
```

#### Authentication
```
NEXTAUTH_URL=https://your-frontend.onrender.com
NEXTAUTH_SECRET=your-nextauth-secret-32-chars
NEXTAUTH_URL_STAGING=https://your-staging-frontend.onrender.com
```

#### External Services
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=GA_MEASUREMENT_ID
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

#### Render Deployment
```
RENDER_API_KEY=your-render-api-key
RENDER_SERVICE_ID=your-frontend-service-id
RENDER_STAGING_SERVICE_ID=your-staging-frontend-service-id
```

#### Docker Registry
```
DOCKER_USERNAME=your-github-username
DOCKER_PASSWORD=your-github-personal-access-token
```

#### Testing & Monitoring
```
CODECOV_TOKEN=your-codecov-token
SENTRY_DSN=your-frontend-sentry-dsn
```

## Environment Configuration

### GitHub Repository Settings

1. **Environments Setup**:
   ```
   Go to: Settings > Environments
   Create environments:
   - development
   - staging  
   - production
   ```

2. **Environment Protection Rules**:
   ```
   production:
   - Required reviewers: 1-2 team members
   - Deployment branches: main only
   
   staging:
   - Required reviewers: none
   - Deployment branches: develop, main
   ```

3. **Environment Variables per Environment**:
   ```
   development:
   - NODE_ENV=development
   - LOG_LEVEL=debug
   
   staging:
   - NODE_ENV=staging
   - LOG_LEVEL=info
   
   production:
   - NODE_ENV=production
   - LOG_LEVEL=error
   ```

## Security Best Practices

### Secret Management
1. **Never commit secrets** to repository
2. **Use different secrets** for each environment
3. **Rotate secrets regularly** (quarterly recommended)
4. **Use environment-specific** database and service instances
5. **Limit secret access** to required team members only

### Database Security
```bash
# Production database should have:
- SSL/TLS encryption enabled
- Connection pooling configured
- Read-only replicas for reporting
- Regular automated backups
- Network security groups restricting access
```

### API Security
```bash
# JWT Configuration:
- Use strong, unique secrets (minimum 32 characters)
- Set appropriate token expiration times
- Implement token refresh mechanism
- Use secure HTTP-only cookies for sensitive tokens
```

## Render Service Configuration

### Backend Service Environment Variables
```
NODE_ENV=production
DATABASE_URL=${{DATABASE_URL}}
REDIS_URL=${{REDIS_URL}}
JWT_SECRET=${{JWT_SECRET}}
PORT=10000
```

### Frontend Service Environment Variables
```
NODE_ENV=production
NEXT_PUBLIC_API_URL=${{NEXT_PUBLIC_API_URL}}
NEXTAUTH_URL=${{NEXTAUTH_URL}}
NEXTAUTH_SECRET=${{NEXTAUTH_SECRET}}
```

## Testing Secrets

### Local Development Setup
```bash
# Create .env.local files (not committed):

# Backend .env.local:
DATABASE_URL=postgresql://localhost:5432/bus_ticket_test
REDIS_URL=redis://localhost:6379
JWT_SECRET=test-secret-for-local-development-only

# Frontend .env.local:
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=local-nextauth-secret
```

### CI Testing Secrets
```bash
# GitHub Actions uses these for testing:
- PostgreSQL test database (ephemeral)
- Redis test instance (ephemeral)
- Test JWT secrets (non-production)
- Mock external service credentials
```

## Validation Commands

### Backend Secret Validation
```bash
# Check required environment variables
npm run validate:env

# Test database connection
npm run db:test

# Verify JWT secret strength
npm run validate:jwt
```

### Frontend Secret Validation
```bash
# Validate Next.js configuration
npm run build -- --dry-run

# Check environment variables
npm run validate:env

# Test API connectivity
npm run test:api
```

## Troubleshooting

### Common Issues
1. **"Secret not found"**: Ensure secret name matches exactly (case-sensitive)
2. **"Invalid JWT secret"**: Use minimum 32 character random string
3. **"Database connection failed"**: Verify connection string format and credentials
4. **"Render deployment failed"**: Check service ID and API key validity

### Debug Commands
```bash
# Check GitHub Actions secrets (in workflow)
echo "Testing secret availability..."
if [ -z "$SECRET_NAME" ]; then echo "Secret not set"; exit 1; fi

# Validate Render API key
curl -H "Authorization: Bearer $RENDER_API_KEY" \
     https://api.render.com/v1/services

# Test database connection
psql $DATABASE_URL -c "SELECT version();"
```

## Security Checklist

- [ ] All production secrets are unique and strong
- [ ] No secrets committed to repository
- [ ] Environment protection rules configured
- [ ] Regular secret rotation schedule established
- [ ] Team access to secrets is limited and documented
- [ ] Backup authentication methods configured
- [ ] External service webhooks use secret validation
- [ ] Database connections use SSL/TLS
- [ ] API endpoints implement rate limiting
- [ ] Monitoring and alerting configured for security events