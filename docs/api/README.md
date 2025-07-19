# WeConnect API Documentation

## Overview

WeConnect provides a comprehensive RESTful API with full OpenAPI/Swagger documentation. The API follows REST principles with JSON request/response formats and standard HTTP status codes.

## Base Configuration

```typescript
// Main API Setup in main.ts
const config = new DocumentBuilder()
  .setTitle('WeConnect API')
  .setDescription('WeConnect - Workflow Automation Platform API')
  .setVersion('1.0')
  .addTag('workflows', 'Workflow management endpoints')
  .addTag('nodes', 'Node management endpoints')
  .addTag('executions', 'Workflow execution endpoints')
  .addTag('auth', 'Authentication endpoints')
  .addBearerAuth()
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api/docs', app, document);
```

## Access Points

- **API Base URL**: `http://localhost:3000`
- **Swagger Documentation**: `http://localhost:3000/api/docs`
- **Health Check**: `http://localhost:3000/health`

## Authentication

WeConnect API supports multiple authentication methods:

### 1. JWT Bearer Token Authentication

**Header Format:**
```http
Authorization: Bearer <jwt-token>
```

**Obtaining Token:**
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 604800,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user",
    "createdAt": "2023-01-01T00:00:00.000Z"
  }
}
```

### 2. API Key Authentication

**Header Format:**
```http
X-API-Key: <api-key>
```

**Query Parameter Format:**
```http
GET /workflows?api_key=<api-key>
```

## Core API Endpoints

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | User registration | No |
| POST | `/auth/login` | User login | No |
| GET | `/auth/profile` | Get current user profile | Yes |
| PUT | `/auth/profile` | Update user profile | Yes |
| POST | `/auth/logout` | User logout | Yes |

### Workflow Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/workflows` | List user workflows | Yes |
| POST | `/workflows` | Create new workflow | Yes |
| GET | `/workflows/{id}` | Get specific workflow | Yes |
| PUT | `/workflows/{id}` | Update workflow | Yes |
| DELETE | `/workflows/{id}` | Delete workflow | Yes |
| POST | `/workflows/{id}/execute` | Execute workflow | Yes |
| GET | `/workflows/{id}/executions` | Get workflow executions | Yes |

### Node Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/nodes` | List available node types | Yes |
| GET | `/nodes/{type}` | Get node type definition | Yes |
| POST | `/workflows/{id}/nodes` | Add node to workflow | Yes |
| PUT | `/workflows/{id}/nodes/{nodeId}` | Update workflow node | Yes |
| DELETE | `/workflows/{id}/nodes/{nodeId}` | Remove node from workflow | Yes |

### Execution Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/executions` | List user executions | Yes |
| GET | `/executions/{id}` | Get execution details | Yes |
| POST | `/executions/{id}/cancel` | Cancel running execution | Yes |
| GET | `/executions/{id}/logs` | Get execution logs | Yes |

### Webhook Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/webhooks` | List webhooks | Yes |
| POST | `/webhooks` | Create webhook | Yes |
| GET | `/webhooks/{id}` | Get webhook details | Yes |
| PUT | `/webhooks/{id}` | Update webhook | Yes |
| DELETE | `/webhooks/{id}` | Delete webhook | Yes |
| POST | `/webhooks/{id}/trigger` | Trigger webhook | API Key |

### Credential Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/credentials` | List credentials | Yes |
| POST | `/credentials` | Create credential | Yes |
| GET | `/credentials/{id}` | Get credential details | Yes |
| PUT | `/credentials/{id}` | Update credential | Yes |
| DELETE | `/credentials/{id}` | Delete credential | Yes |

### Organization Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/organizations` | List organizations | Yes |
| POST | `/organizations` | Create organization | Yes |
| GET | `/organizations/{id}` | Get organization details | Yes |
| PUT | `/organizations/{id}` | Update organization | Yes |
| POST | `/organizations/{id}/members` | Add member | Yes |
| DELETE | `/organizations/{id}/members/{userId}` | Remove member | Yes |

## Request/Response Formats

### Standard Request Headers

```http
Content-Type: application/json
Authorization: Bearer <token>
X-Organization-ID: <org-id> (optional)
```

### Standard Response Format

**Success Response:**
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Operation completed successfully"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "reason": "Invalid email format"
    }
  },
  "timestamp": "2023-01-01T00:00:00.000Z",
  "path": "/api/workflows"
}
```

### Pagination

For endpoints that return lists, pagination is implemented using query parameters:

```http
GET /workflows?page=1&limit=20&sortBy=createdAt&sortOrder=desc
```

**Pagination Response:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

## Data Transfer Objects (DTOs)

### Create Workflow DTO

```typescript
export class CreateWorkflowDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  configuration?: Record<string, any>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
```

### Update Workflow DTO

```typescript
export class UpdateWorkflowDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(WorkflowStatus)
  status?: WorkflowStatus;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsObject()
  configuration?: Record<string, any>;
}
```

### Execute Workflow DTO

```typescript
export class ExecuteWorkflowDto {
  @IsOptional()
  @IsObject()
  inputData?: Record<string, any>;

  @IsOptional()
  @IsEnum(ExecutionMode)
  mode?: ExecutionMode;

  @IsOptional()
  @IsNumber()
  @Min(1000)
  @Max(3600000)
  timeout?: number; // milliseconds
}
```

## HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, PUT requests |
| 201 | Created | Successful POST requests |
| 204 | No Content | Successful DELETE requests |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource conflict |
| 422 | Unprocessable Entity | Validation errors |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

## Rate Limiting

WeConnect implements rate limiting to prevent abuse:

**Default Limits:**
- **Authenticated Users**: 100 requests/minute
- **API Keys**: Configured per key
- **Unauthenticated**: 10 requests/minute

**Rate Limit Headers:**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1609459200
```

## Error Handling

### Common Error Codes

```typescript
enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  WORKFLOW_EXECUTION_ERROR = 'WORKFLOW_EXECUTION_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED'
}
```

### Error Response Examples

**Validation Error:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Email must be a valid email address"
      }
    ]
  }
}
```

**Authorization Error:**
```json
{
  "success": false,
  "error": {
    "code": "AUTHORIZATION_ERROR",
    "message": "Insufficient permissions to access this resource"
  }
}
```

## WebSocket API

WeConnect provides real-time updates via WebSocket connections:

**Connection:**
```javascript
const socket = io('http://localhost:3000', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

**Events:**
- `execution.started` - Workflow execution started
- `execution.completed` - Workflow execution completed
- `execution.failed` - Workflow execution failed
- `node.executed` - Individual node executed

## SDK and Client Libraries

### JavaScript/TypeScript

```bash
npm install @weconnect/api-client
```

```typescript
import { WeConnectClient } from '@weconnect/api-client';

const client = new WeConnectClient({
  baseURL: 'http://localhost:3000',
  token: 'your-jwt-token'
});

const workflows = await client.workflows.list();
```

### cURL Examples

**List Workflows:**
```bash
curl -X GET \
  http://localhost:3000/workflows \
  -H 'Authorization: Bearer <token>'
```

**Create Workflow:**
```bash
curl -X POST \
  http://localhost:3000/workflows \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "My Workflow",
    "description": "A sample workflow"
  }'
```

**Execute Workflow:**
```bash
curl -X POST \
  http://localhost:3000/workflows/{id}/execute \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "inputData": {
      "key": "value"
    },
    "mode": "manual"
  }'
```

## Testing the API

### Using Swagger UI

1. Navigate to `http://localhost:3000/api/docs`
2. Click "Authorize" and enter your JWT token
3. Explore and test endpoints interactively

### Using Postman

1. Import the OpenAPI specification from `/api/docs-json`
2. Set up environment variables for base URL and token
3. Use the pre-configured requests

## Best Practices

### Security
- Always use HTTPS in production
- Implement proper token refresh mechanisms
- Validate all input data
- Use API keys for machine-to-machine communication

### Performance
- Implement caching for frequently accessed data
- Use pagination for large result sets
- Optimize database queries
- Monitor API performance metrics

### Error Handling
- Provide meaningful error messages
- Use appropriate HTTP status codes
- Implement proper logging
- Handle rate limiting gracefully

## Troubleshooting

### Common Issues

**401 Unauthorized:**
- Check token validity and expiration
- Ensure proper Authorization header format

**403 Forbidden:**
- Verify user permissions
- Check organization context

**429 Rate Limited:**
- Implement exponential backoff
- Check rate limit headers
- Consider using API keys for higher limits

**500 Server Error:**
- Check server logs
- Verify database connectivity
- Monitor system resources

### Support

For API support and questions:
- **Documentation**: `/api/docs`
- **Health Status**: `/health`
- **API Version**: Available in response headers
