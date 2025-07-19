# Detailed WeConnect Documentation

## Entities and Models

### AI Agent Entity

The AI Agent entity represents a configurable AI agent capable of interacting with various models.

**Attributes:**
- **name**: Identifier for the agent
- **description**: Description of the agent's purpose
- **provider**: Specifies the AI provider (e.g., OpenAI, AWS)
- **model**: Indicates the model used (e.g., GPT-3)
- **configuration**: JSON object containing agent's configuration settings

**Relationships:**
- **Tools**: Associates various tools with the agent
- **Executions**: Tracks execution logs specific to this agent

```typescript
@Entity('ai_agents')
export class AIAgent extends BaseEntity {
  // Definitions
}
```

### Credential Entity

Credential entity manages secure third-party service integrations.

**Attributes:**
- **name**: Credential identification
- **type**: Enum defining credential type (API Key, OAuth2, etc.)
- **service**: Associated service name
- **encryptedData**: Encrypted credential data

**Relationships:**
- **User**: Owner of the credential
- **Organization**: Organization linked to the credential
- **Shares**: Credential sharing configurations
- **Rotations**: Credential rotation logs

```typescript
@Entity('credentials')
export class Credential extends BaseEntity {
  // Definitions
}
```

### Organization Entity

An organization entity represents a team or company, managing users and workflows.

**Attributes:**
- **name**: Organization name
- **plan**: Subscription plan (Free, Pro, etc.)
- **planLimits**: JSON object describing plan restrictions

**Relationships:**
- **Members**: Users belonging to this organization
- **Workflows**: Workflows associated with the organization
- **Credentials**: Security credentials under this organization

```typescript
@Entity('organizations')
export class Organization {
  // Definitions
}
```

## Services

### AI Agent Service

This service manages AI agents, including creation, updating, and retrieving AI agents.

**Key Methods:**
- `createAgent()`: Registers a new AI agent with given specifications.
- `updateAgent()`: Updates existing agent attributes and tools.
- `getAllAgents()`: Retrieves all AI agents.

**Interactions:**
- Utilizes AIProviderService for provider-specific operations.
- Employs AIToolService to manage tools linked to agents.

```typescript
@Injectable()
export class AIAgentService {
  // Methods
}
```

## Controllers

### AI Agent Controller

Responsible for API operations related to AI agents.

**Endpoints:**
- `GET /ai-agents`: Retrieves all AI agents or searches based on query.
- `POST /ai-agents`: Registers a new AI agent.
- `DELETE /ai-agents/{id}`: Deletes an existing AI agent.

```typescript
@Controller('ai-agents')
export class AIAgentController {
  // Endpoints
}
```

## Core Infrastructure

### Logger Service

Provides centralized logging across services with contextual details.

**Categories:**
- **AUTH**: Authentication services
- **WORKFLOW**: Workflow executions

**Usage:**
- `error()`, `warn()`, `log()`, `debug()`, `verbose()` methods to log various levels of messages.

```typescript
@Injectable()
export class LoggerService {
  // Methods
}
```

### Validation Service

Validation logic using `class-validator` to ensure data integrity across data transfer objects (DTOs).

**Validation Methods:**
- `validateDto()`: Validates that an object conforms to a DTO.
- `validateNodeConfiguration()`: Ensures correct configuration of workflow nodes.

```typescript
@Injectable()
export class ValidationService {
  // Methods
}
```

### Global Exception Filter

Catches and processes all exceptions thrown within the application, providing a uniform error response.

**Features:**
- Handles various error types (e.g., `HttpException`, `QueryFailedError`)
- Logs errors using `LoggerService`

```typescript
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  // Catch Logic
}
```

## Configuration

### Environment Setup

**Files:**
- `.env`: Base environment configuration
- `.env.dev`: Development-specific overrides
- `.env.prod`: Production-specific settings

**Key Variables:**
- **NODE_ENV**: Environment mode (development, production)
- **DB_HOST**: Database host URL
- **JWT_SECRET**: Secret key for JWT authentication

## Workflow System

### Execution Flow

Describes the end-to-end execution of workflows including node processing, error handling, and retry mechanisms.

#### Core Node - HTTP Request

Node that handles external HTTP requests, supporting multiple methods and headers.

**Configuration:**
- **method**: HTTP method (GET, POST, etc.)
- **url**: Target endpoint
- **timeout**: Request timeout in milliseconds

```typescript
class HttpRequestNodeExecutor implements INodeExecutor {
  // Execution logic
}
```

### Error & Retry Handling

Ensures robustness by retrying transient failures and applying circuit breakers to avoid system overload.

**Features:**
- **Automatic Retries**: For retryable errors
- **Circuit Breaker**: Stops execution during continuous failure

The complete documentation goes beyond the routines to include the project's strategic structure and scope. If you need even deeper details on specific sections or further clarifications, feel free to let me know!
