# WeConnect - Project Structure

## Root Directory Organization
```
weconnect/
├── src/                    # Source code
├── test/                   # E2E tests
├── dist/                   # Compiled output
├── scripts/                # Utility scripts
├── nginx/                  # Nginx configuration
├── .kiro/                  # Kiro AI assistant configuration
├── .github/                # GitHub workflows and templates
├── .husky/                 # Git hooks
└── node_modules/           # Dependencies
```

## Source Code Structure (`src/`)
```
src/
├── main.ts                 # Application entry point
├── app.module.ts           # Root application module
├── app.controller.ts       # Root controller
├── app.service.ts          # Root service
├── health-check.js         # Health check utility
├── config/                 # Configuration files
├── core/                   # Core infrastructure
└── modules/                # Feature modules
```

## Feature Modules (`src/modules/`)
Each feature follows NestJS module structure:
- **workflows/**: Workflow management and orchestration
- **nodes/**: Workflow node definitions and logic
- **executions/**: Workflow execution engine
- **auth/**: Authentication and authorization
- **organizations/**: Multi-tenant organization management
- **credentials/**: Secure credential storage
- **templates/**: Workflow template system
- **ai-agents/**: AI/LLM integration
- **scheduler/**: Time-based execution scheduling
- **monitoring/**: System monitoring and analytics
- **webhooks/**: External webhook handling

## Module Structure Pattern
```
module-name/
├── module-name.module.ts   # Module definition
├── module-name.controller.ts # HTTP endpoints
├── module-name.service.ts  # Business logic
├── dto/                    # Data transfer objects
├── entities/               # Database entities
├── guards/                 # Route guards
├── decorators/             # Custom decorators
└── interfaces/             # TypeScript interfaces
```

## Core Infrastructure (`src/core/`)
- **filters/**: Global exception filters
- **guards/**: Authentication and authorization guards
- **interceptors/**: Request/response interceptors
- **decorators/**: Custom decorators
- **pipes/**: Validation and transformation pipes
- **middleware/**: Custom middleware

## Configuration (`src/config/`)
- **database.config.ts**: Database connection settings
- **jwt.config.ts**: JWT authentication configuration
- **redis.config.ts**: Redis connection settings

## Testing Structure
```
test/
├── app.e2e-spec.ts        # End-to-end tests
└── jest-e2e.json          # E2E test configuration

src/
└── **/*.spec.ts           # Unit tests alongside source files
```

## Docker Structure
- **Dockerfile**: Multi-stage build (development, builder, production)
- **docker-compose.yml**: Production orchestration
- **docker-compose.override.yml**: Development overrides
- **Dockerfile.dev**: Development-specific build

## Environment Configuration
- **.env**: Production environment variables
- **.env.dev**: Development environment variables
- **.env.example**: Template for environment setup
- **.env.prod**: Production-specific overrides

## Code Organization Principles

### Module Dependencies
Modules are ordered by dependency in `app.module.ts`:
1. Core infrastructure modules first
2. Base modules (organizations, auth)
3. Feature modules that depend on base modules
4. Integration modules last

### File Naming Conventions
- **Controllers**: `*.controller.ts`
- **Services**: `*.service.ts`
- **Modules**: `*.module.ts`
- **Entities**: `*.entity.ts`
- **DTOs**: `*.dto.ts`
- **Guards**: `*.guard.ts`
- **Interfaces**: `*.interface.ts`
- **Tests**: `*.spec.ts` (unit), `*.e2e-spec.ts` (e2e)

### Import Organization
1. Node.js built-in modules
2. Third-party packages
3. NestJS framework imports
4. Local application imports (relative paths)

### Directory Guidelines
- Keep related files together in feature modules
- Use barrel exports (`index.ts`) for clean imports
- Separate concerns: controllers handle HTTP, services handle business logic
- Place shared utilities in `core/` or create dedicated shared modules