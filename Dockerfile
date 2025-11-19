# Development stage
FROM node:20-alpine AS development

# Install dependencies for database operations
RUN apk add --no-cache postgresql-client curl

# Set the working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies)
RUN npm ci

# Copy source code
COPY . .

# Create non-root user for development
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001
RUN chown -R nestjs:nodejs /app

# Expose the port the app runs on
EXPOSE 3000

# Default command for development (can be overridden)
CMD ["npm", "run", "start:dev"]

# Builder stage
FROM node:20-alpine AS builder

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install all dependencies (including dev dependencies for building)
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

# Install dependencies for database operations and health checks
RUN apk add --no-cache postgresql-client curl dumb-init

# Create app directory
WORKDIR /app

# Create a non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

# Copy package.json and package-lock.json
COPY package*.json ./

    # Install only production dependencies
    RUN npm ci --omit=dev && npm cache clean --force# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Change ownership to the nodejs user
RUN chown -R nestjs:nodejs /app

# Add health check script
COPY --chown=nestjs:nodejs <<EOF /app/health-check.sh
#!/bin/sh
curl -f http://localhost:\${PORT:-3000}/health || exit 1
EOF

RUN chmod +x /app/health-check.sh

# Switch to non-root user
USER nestjs

# Expose the port the app runs on
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD /app/health-check.sh

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Default command for production (can be overridden by SERVICE_TYPE env var)
CMD ["sh", "-c", "case \"$SERVICE_TYPE\" in \
  \"worker\") npm run start:worker ;; \
  \"migration\") npm run migration:run ;; \
  *) node dist/main.js ;; \
esac"]