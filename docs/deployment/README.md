# WeConnect Deployment Guide

## Overview

WeConnect supports multiple deployment strategies, from local development to production-grade containerized deployments. This guide covers all deployment scenarios with detailed configuration and best practices.

## Deployment Options

### 1. Local Development
### 2. Docker Development
### 3. Docker Production
### 4. Cloud Deployment (AWS/Azure/GCP)
### 5. Kubernetes Deployment

## Prerequisites

### System Requirements
- **Node.js**: 18.0.0 or higher
- **PostgreSQL**: 12.0 or higher
- **Redis**: 6.0 or higher
- **Docker**: 20.10.0 or higher (for containerized deployments)

### Hardware Requirements

**Minimum (Development):**
- CPU: 2 cores
- RAM: 4 GB
- Storage: 10 GB

**Recommended (Production):**
- CPU: 4 cores
- RAM: 8 GB
- Storage: 50 GB SSD

## Local Development Deployment

### Prerequisites Installation

```bash
# Install Node.js (using nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# Install PostgreSQL (Ubuntu/Debian)
sudo apt update
sudo apt install postgresql postgresql-contrib

# Install Redis (Ubuntu/Debian)
sudo apt install redis-server

# Install pnpm (alternative package manager)
npm install -g pnpm
```

### Database Setup

```bash
# Create database and user
sudo -u postgres psql
CREATE DATABASE weconnect;
CREATE USER weconnect WITH PASSWORD 'weconnect123';
GRANT ALL PRIVILEGES ON DATABASE weconnect TO weconnect;
\q
```

### Application Setup

```bash
# Clone repository
git clone <repository-url>
cd weconnect

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
npm run db:migrate

# Seed initial data (optional)
npm run db:seed

# Start development server
npm run start:dev
```

### Environment Configuration (.env)

```env
# Application
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=weconnect
DB_PASSWORD=weconnect123
DB_DATABASE=weconnect

# JWT
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long
JWT_EXPIRES_IN=7d

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Encryption
ENCRYPTION_KEY=your-encryption-key-32-chars-long

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Cloud Storage (optional)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-west-2
AWS_S3_BUCKET=weconnect-storage
```

## Docker Development Deployment

### Using Docker Compose (Development)

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up --build

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop services
docker-compose -f docker-compose.dev.yml down

# Rebuild specific service
docker-compose -f docker-compose.dev.yml up --build app
```

### Docker Compose Development Configuration

```yaml
# docker-compose.dev.yml
version: '3.8'
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
      target: development
    container_name: weconnect-app-dev
    volumes:
      - .:/app
      - /app/node_modules
    ports:
      - '3000:3000'
      - '9229:9229' # Debug port
    environment:
      - NODE_ENV=development
      - DB_HOST=postgres
      - REDIS_HOST=redis
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  postgres:
    image: postgres:16-alpine
    container_name: weconnect-postgres-dev
    environment:
      POSTGRES_DB: weconnect
      POSTGRES_USER: weconnect
      POSTGRES_PASSWORD: weconnect123
    ports:
      - '5432:5432'
    volumes:
      - postgres_dev_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: weconnect-redis-dev
    ports:
      - '6379:6379'
    volumes:
      - redis_dev_data:/data
    restart: unless-stopped

volumes:
  postgres_dev_data:
  redis_dev_data:
```

## Docker Production Deployment

### Production Docker Compose

The production setup uses multi-stage Docker builds, secrets management, and includes Nginx as a reverse proxy.

```yaml
# docker-compose.yml (Production)
services:
  nginx:
    image: nginx:1.27-alpine
    container_name: weconnect-nginx-prod
    ports:
      - '80:80'
      - '443:443' # HTTPS
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro # SSL certificates
    networks:
      - weconnect-network
    depends_on:
      app:
        condition: service_healthy
    restart: unless-stopped

  app:
    build:
      context: .
      dockerfile: Dockerfile
      target: production
    container_name: weconnect-app-prod
    restart: unless-stopped
    secrets:
      - db_password
      - jwt_secret
    env_file:
      - .env.prod
    environment:
      DB_HOST: postgres
      REDIS_HOST: redis
      DB_PASSWORD_FILE: /run/secrets/db_password
      JWT_SECRET_FILE: /run/secrets/jwt_secret
    networks:
      - weconnect-network
    healthcheck:
      test: 'node -e "require(''http'').get(''http://localhost:3000/health'', { timeout: 2000 }, (res) => res.statusCode === 200 ? process.exit(0) : process.exit(1)).on(''error'', () => process.exit(1))"'
      interval: 30s
      timeout: 5s
      retries: 5
      start_period: 15s
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

secrets:
  db_password:
    file: ./secrets/db_password.txt
  jwt_secret:
    file: ./secrets/jwt_secret.txt
```

### Production Dockerfile

```dockerfile
# Multi-stage production Dockerfile
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./

FROM base AS development
ENV NODE_ENV=development
RUN npm ci && npm cache clean --force
COPY . .
CMD ["npm", "run", "start:dev"]

FROM base AS builder
RUN npm ci && npm cache clean --force
COPY . .
RUN npm run build

FROM node:20-alpine AS production
ENV NODE_ENV=production
WORKDIR /app

# Add dumb-init for better signal handling
RUN apk add --no-cache dumb-init

# Copy only production dependencies and built code
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=builder /app/dist ./dist

# Create and use a non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 3000
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "dist/main"]
```

### Nginx Configuration

```nginx
# nginx/nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:3000;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    
    server {
        listen 80;
        server_name yourdomain.com;
        
        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

        # Rate limiting
        limit_req zone=api burst=20 nodelay;

        location / {
            proxy_pass http://app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            
            # Timeouts
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # Health check endpoint
        location /health {
            proxy_pass http://app/health;
            access_log off;
        }

        # Static assets with caching
        location /assets/ {
            proxy_pass http://app;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # HTTPS configuration (add SSL certificates)
    server {
        listen 443 ssl http2;
        server_name yourdomain.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;

        # ... rest of configuration similar to HTTP
    }
}
```

### Secrets Management

```bash
# Create secrets directory
mkdir -p secrets

# Generate secure passwords
openssl rand -base64 32 > secrets/db_password.txt
openssl rand -base64 64 > secrets/jwt_secret.txt
openssl rand -base64 32 > secrets/encryption_key.txt

# Set proper permissions
chmod 600 secrets/*
```

### Production Deployment Commands

```bash
# Build and start production environment
docker-compose up --build -d

# View logs
docker-compose logs -f app

# Update application (zero-downtime)
docker-compose pull
docker-compose up --build -d --no-deps app

# Database backup
docker exec weconnect-postgres-prod pg_dump -U weconnect weconnect > backup.sql

# Database restore
docker exec -i weconnect-postgres-prod psql -U weconnect weconnect < backup.sql

# Monitor container health
docker-compose ps
```

## Environment-Specific Configuration

### Development (.env.dev)
```env
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug
ENABLE_LOGGING=true
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

### Production (.env.prod)
```env
NODE_ENV=production
PORT=3000
LOG_LEVEL=info
ENABLE_LOGGING=true
CORS_ORIGINS=https://yourdomain.com
TRUST_PROXY=1
```

## Database Migration & Management

### Migration Commands

```bash
# Create new migration
npm run typeorm migration:create -- -n MigrationName

# Generate migration from entity changes
npm run typeorm migration:generate -- -n AutoGeneratedMigration

# Run migrations
npm run db:migrate

# Revert last migration
npm run db:migrate:revert

# Show migration status
npm run typeorm migration:show
```

### Seed Data

```bash
# Run seeders
npm run db:seed

# Create custom seeder
npm run typeorm seed:create -- -n UserSeeder
```

## Monitoring & Health Checks

### Health Check Endpoints

```typescript
// health-check.js
const http = require('http');

const healthCheck = () => {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/health',
    timeout: 2000,
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      if (res.statusCode === 200) {
        resolve('Health check passed');
      } else {
        reject(new Error(`Health check failed with status ${res.statusCode}`));
      }
    });

    req.on('error', reject);
    req.on('timeout', () => reject(new Error('Health check timeout')));
    req.end();
  });
};
```

### Application Metrics

```bash
# View container stats
docker stats weconnect-app-prod

# Check application logs
docker logs -f weconnect-app-prod

# Database performance
docker exec weconnect-postgres-prod pg_stat_activity

# Redis monitoring
docker exec weconnect-redis-prod redis-cli monitor
```

## Backup & Recovery

### Automated Backup Script

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
DB_CONTAINER="weconnect-postgres-prod"

# Create backup directory
mkdir -p $BACKUP_DIR

# Database backup
docker exec $DB_CONTAINER pg_dump -U weconnect weconnect > $BACKUP_DIR/db_backup_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/db_backup_$DATE.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: db_backup_$DATE.sql.gz"
```

### Restore Process

```bash
# Stop application
docker-compose stop app

# Restore database
docker exec -i weconnect-postgres-prod psql -U weconnect weconnect < backup.sql

# Start application
docker-compose start app
```

## Security Considerations

### Production Security Checklist

- [ ] Use HTTPS with valid SSL certificates
- [ ] Implement proper authentication and authorization
- [ ] Enable rate limiting and DDoS protection
- [ ] Use secrets management for sensitive data
- [ ] Enable database encryption at rest
- [ ] Implement proper logging and monitoring
- [ ] Use non-root containers
- [ ] Keep dependencies updated
- [ ] Enable firewall rules
- [ ] Implement backup and disaster recovery

### Security Headers

```typescript
// security.middleware.ts
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

## Troubleshooting

### Common Issues

**Container Won't Start:**
```bash
# Check container logs
docker logs weconnect-app-prod

# Check container health
docker inspect weconnect-app-prod | grep Health

# Restart container
docker-compose restart app
```

**Database Connection Issues:**
```bash
# Check database status
docker exec weconnect-postgres-prod pg_isready -U weconnect

# Check network connectivity
docker exec weconnect-app-prod ping postgres

# View database logs
docker logs weconnect-postgres-prod
```

**Performance Issues:**
```bash
# Monitor resource usage
docker stats

# Check application metrics
docker exec weconnect-app-prod ps aux

# Monitor database performance
docker exec weconnect-postgres-prod pg_stat_activity
```

## Scaling & High Availability

### Horizontal Scaling

```yaml
# docker-compose.scale.yml
version: '3.8'
services:
  app:
    deploy:
      replicas: 3
      restart_policy:
        condition: on-failure
        max_attempts: 3
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M

  nginx:
    deploy:
      replicas: 2
```

### Load Balancing

```nginx
# nginx load balancing
upstream app_servers {
    least_conn;
    server app1:3000;
    server app2:3000;
    server app3:3000;
}

server {
    location / {
        proxy_pass http://app_servers;
    }
}
```

This comprehensive deployment guide covers all aspects of deploying WeConnect from development to production environments with proper security, monitoring, and scalability considerations.
