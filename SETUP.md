# WeConnect - Development Setup

WeConnect now runs natively on your machine while using Docker only for external services like MongoDB and Redis.

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start services and application:**
   ```bash
   npm run dev:full
   ```
   This will:
   - Start MongoDB and Redis in Docker containers
   - Create `.env` from template if it doesn't exist
   - Start the NestJS application in development mode

3. **Access the application:**
   - API: http://localhost:3000
   - MongoDB GUI: http://localhost:8080 (admin/admin)
   - Redis GUI: http://localhost:8081

## Manual Setup

If you prefer to control each step:

1. **Start external services:**
   ```bash
   npm run services:up
   # or
   make services-up
   ```

2. **Configure environment:**
   ```bash
   cp .env.local .env
   # Edit .env with your configuration
   ```

3. **Start the application:**
   ```bash
   npm run start:dev
   ```

## Available Commands

### Application Commands
- `npm run start:dev` - Start in development mode with hot reload
- `npm run start:debug` - Start with debugging enabled
- `npm run start:prod` - Start in production mode
- `npm run build` - Build the application
- `npm run test` - Run tests

### Service Commands
- `npm run services:up` - Start external services (MongoDB, Redis)
- `npm run services:down` - Stop external services
- `npm run services:logs` - View service logs
- `npm run services:restart` - Restart services

### Development Commands
- `npm run dev:full` - Start everything (services + app)
- `npm run lint` - Run linter
- `npm run format` - Format code
- `npm run typecheck` - Type checking

## Services

### MongoDB
- **Host:** localhost:27017
- **Database:** weconnect
- **Username:** weconnect
- **Password:** weconnect123
- **GUI:** http://localhost:8080 (admin/admin)

### Redis
- **Host:** localhost:6379
- **GUI:** http://localhost:8081

## Environment Configuration

Copy `.env.local` to `.env` and update the following:

```env
# Required for basic functionality
JWT_SECRET=your-super-secret-jwt-key
DB_HOST=localhost
REDIS_HOST=localhost

# Optional API keys for integrations
OPENAI_API_KEY=your-openai-key
SLACK_BOT_TOKEN=your-slack-token
# ... etc
```

## Database Operations

```bash
# Connect to MongoDB
make mongo
# or
docker-compose exec mongodb mongosh -u weconnect -p weconnect123 --authenticationDatabase admin weconnect

# Connect to Redis
make redis
# or
docker-compose exec redis redis-cli

# Seed database
npm run db:seed

# Reset database
npm run db:reset
```

## Troubleshooting

### Services won't start
```bash
# Check if ports are in use
netstat -an | grep :27017
netstat -an | grep :6379

# Stop any existing containers
docker-compose down
docker container prune
```

### Application won't connect to services
```bash
# Check service status
docker-compose ps

# View service logs
docker-compose logs mongodb
docker-compose logs redis
```

### Reset everything
```bash
# Stop services and remove data
docker-compose down -v

# Clean and reinstall
npm run clean:all
npm install
```

## Production Deployment

For production, you can still use the services in Docker:

```bash
# Start services
docker-compose up -d

# Build and start application
npm run build
npm run start:prod
```

Or deploy the application to your preferred platform while keeping the services containerized locally or in the cloud.