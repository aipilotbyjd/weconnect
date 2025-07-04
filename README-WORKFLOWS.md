# WeConnect Workflow System (n8n Clone)

## Overview
WeConnect is a powerful workflow automation platform inspired by n8n, built with NestJS, TypeScript, PostgreSQL, Redis, and BullMQ.

## Architecture

### Core Components

1. **Workflows** - Define automation flows
2. **Nodes** - Individual steps in a workflow
3. **Connections** - Links between nodes
4. **Executions** - Runtime instances of workflows
5. **Queue System** - BullMQ for async processing

### Node Types

- `trigger` - Starting point (manual, webhook, scheduled)
- `action` - Generic action node
- `condition` - Conditional logic (if/else)
- `webhook` - HTTP webhook handler
- `http-request` - Make HTTP API calls
- `email` - Send emails
- `delay` - Wait/pause execution

## API Examples

### Create Workflow

```json
POST /workflows
Authorization: Bearer YOUR_JWT_TOKEN

{
  "name": "Customer Onboarding",
  "description": "Automated customer onboarding workflow",
  "nodes": [
    {
      "name": "New Customer Trigger",
      "type": "trigger",
      "configuration": {
        "event": "customer.created"
      },
      "position": { "x": 100, "y": 200 }
    },
    {
      "name": "Wait 1 Hour",
      "type": "delay",
      "configuration": {
        "delay": 3600000
      },
      "position": { "x": 300, "y": 200 }
    },
    {
      "name": "Send Welcome Email",
      "type": "email",
      "configuration": {
        "to": "{{customer.email}}",
        "template": "welcome",
        "subject": "Welcome to Our Platform!"
      },
      "position": { "x": 500, "y": 200 }
    },
    {
      "name": "Create CRM Record",
      "type": "http-request",
      "configuration": {
        "method": "POST",
        "url": "https://api.crm.com/contacts",
        "headers": {
          "Authorization": "Bearer {{env.CRM_API_KEY}}"
        },
        "body": {
          "email": "{{customer.email}}",
          "name": "{{customer.name}}",
          "source": "signup"
        }
      },
      "position": { "x": 700, "y": 200 }
    }
  ],
  "connections": [
    {
      "sourceNodeId": "0",
      "targetNodeId": "1",
      "type": "main"
    },
    {
      "sourceNodeId": "1",
      "targetNodeId": "2",
      "type": "main"
    },
    {
      "sourceNodeId": "2",
      "targetNodeId": "3",
      "type": "main"
    }
  ]
}
```

### Execute Workflow

```json
POST /workflows/:workflowId/executions
Authorization: Bearer YOUR_JWT_TOKEN

{
  "mode": "manual",
  "inputData": {
    "customer": {
      "email": "john@example.com",
      "name": "John Doe",
      "id": "cust_123"
    }
  }
}
```

### Get Execution Logs

```bash
GET /workflows/:workflowId/executions/:executionId/logs
```

## Features

### 1. Visual Workflow Builder (To Be Implemented)
- Drag-and-drop interface
- Real-time connection validation
- Node configuration panels

### 2. Execution Engine
- Async processing with BullMQ
- Parallel and sequential execution
- Error handling and retries
- Execution history and logs

### 3. Data Transformation
- Variable interpolation: `{{variable.path}}`
- JSONPath expressions
- Custom JavaScript functions (planned)

### 4. Scalability
- Redis-backed job queues
- Horizontal scaling support
- Distributed execution

### 5. Monitoring
- Real-time execution status
- Detailed logging
- Performance metrics

## Queue System

### Workflow Execution Queue
Handles workflow-level operations:
- Start execution
- Cancel execution
- Resume paused workflows

### Node Execution Queue
Processes individual nodes:
- Execute node logic
- Handle retries
- Manage timeouts

## Database Schema

### Main Entities
- `workflows` - Workflow definitions
- `workflow_nodes` - Node configurations
- `workflow_node_connections` - Node connections
- `workflow_executions` - Execution instances
- `workflow_execution_logs` - Detailed logs

## Environment Variables

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=weconnect
DB_PASSWORD=weconnect123
DB_DATABASE=weconnect

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
```

## Development

### Install Dependencies
```bash
npm install
```

### Run Redis
```bash
docker run -d -p 6379:6379 redis:alpine
```

### Run Development Server
```bash
npm run start:dev
```

### Run Tests
```bash
npm run test
```

## Roadmap

- [ ] Visual workflow builder UI
- [ ] More node types (Database, FTP, Slack, etc.)
- [ ] Workflow templates
- [ ] Version control for workflows
- [ ] Webhook management
- [ ] Scheduled triggers
- [ ] Custom node development SDK
- [ ] Multi-tenant support
- [ ] Advanced data transformation
- [ ] Workflow marketplace
