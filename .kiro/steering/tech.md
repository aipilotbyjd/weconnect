# WeConnect - Technology Stack

## Framework & Runtime
- **NestJS**: Progressive Node.js framework with TypeScript
- **Node.js**: v20 (Alpine Linux in containers)
- **TypeScript**: v5.7+ with strict configuration

## Database & Storage
- **PostgreSQL**: Primary database (v16)
- **TypeORM**: Database ORM with migrations support
- **Redis**: Caching and job queue backend (v7)
- **MongoDB**: Document storage for specific use cases

## Queue & Background Jobs
- **Bull/BullMQ**: Job queue management
- **Bull Board**: Queue monitoring dashboard
- **Node-cron**: Scheduled task execution

## Authentication & Security
- **JWT**: Token-based authentication
- **Passport**: Authentication middleware (JWT, Local, Custom strategies)
- **bcryptjs**: Password hashing
- **crypto-js**: Data encryption
- **Throttler**: Rate limiting

## External Integrations
- **AWS SDK**: S3 storage integration
- **LangChain**: AI/LLM orchestration framework
- **Multiple LLM Providers**: OpenAI, Anthropic, Google GenAI, Azure OpenAI
- **Slack Web API**: Slack integration
- **Notion Client**: Notion integration
- **Airtable**: Database integration
- **Firebase**: Authentication and real-time features
- **Google APIs**: Various Google service integrations

## Development Tools
- **ESLint**: Code linting with TypeScript support
- **Prettier**: Code formatting (single quotes, trailing commas)
- **Jest**: Testing framework
- **Husky**: Git hooks
- **lint-staged**: Pre-commit code quality checks

## Containerization & Deployment
- **Docker**: Multi-stage builds (development, production)
- **Docker Compose**: Local development and production orchestration
- **Nginx**: Reverse proxy and load balancing
- **Health Checks**: Application and service health monitoring

## Common Commands

### Development
```bash
# Start development server with hot reload
npm run start:dev

# Run tests
npm run test
npm run test:e2e
npm run test:cov

# Code quality
npm run lint
npm run format
npm run typecheck
```

### Docker Development
```bash
# Start development environment
make up
# or: docker-compose up --build -d

# View logs
make logs
# or: docker-compose logs -f app

# Stop environment
make down

# Get shell access
make shell
# or: docker-compose exec app sh
```

### Production Deployment
```bash
# Start production environment
make prod-up
# or: docker-compose -f docker-compose.yml up --build -d

# Stop production environment
make prod-down
```

### Database Operations
```bash
# Run migrations
npm run db:migrate

# Revert migration
npm run db:migrate:revert

# Seed database
npm run db:seed
```

### Dependency Management
```bash
# Check dependencies
npm run deps:check

# Security audit
npm run deps:audit
npm run deps:audit:fix
```

## Build Configuration
- **Target**: ES2023
- **Module**: CommonJS
- **Decorators**: Enabled (experimental)
- **Source Maps**: Enabled for debugging
- **Output**: `./dist` directory