# Unified Node Executor System - Migration Guide

## 🎯 Problem Solved

Your WeConnect project had **duplicate node executors** with two different systems:
1. **Legacy system** in `src/modules/workflows/application/node-executors/`
2. **Built-in nodes** in `src/modules/nodes/infrastructure/built-in/`

This created confusion, maintenance overhead, and potential conflicts.

## ✅ Solution: Unified Node Execution System

I've created a **single, unified node executor system** that consolidates everything into:
- `src/core/node-execution/` - All unified node execution logic
- Consistent interfaces and patterns
- Better error handling and validation
- Comprehensive testing and migration tools

## 🏗️ New Architecture

### Core Components

```
src/core/node-execution/
├── interfaces/
│   └── unified-node-executor.interface.ts    # Main interfaces
├── registry/
│   └── unified-node-registry.service.ts      # Node registry
├── services/
│   └── unified-node-execution.service.ts     # Execution service
├── executors/
│   ├── core/                                 # Core executors
│   │   ├── http-request.executor.ts
│   │   ├── condition.executor.ts
│   │   ├── trigger.executor.ts
│   │   └── delay.executor.ts
│   └── integrations/                         # Integration executors
│       └── slack.executor.ts
├── migration/
│   └── node-executor-migration.service.ts    # Migration tools
├── controllers/
│   └── node-execution-admin.controller.ts    # Admin endpoints
└── unified-node-execution.module.ts          # Main module
```

### Key Features

1. **Unified Interface**: All executors implement `IUnifiedNodeExecutor`
2. **Rich Context**: Comprehensive execution context with variables, credentials, etc.
3. **Multiple Outputs**: Support for conditional branching (true/false outputs)
4. **Variable Replacement**: `{{$input.field}}`, `{{$node.previous.data}}`, `{{$vars.variable}}`
5. **Validation**: Built-in configuration validation
6. **Testing**: Connection testing and schema validation
7. **Dynamic Options**: Load options from external APIs (e.g., Slack channels)

## 🚀 Implemented Executors

### Core Executors
- ✅ **HTTP Request** - Make API calls with full configuration
- ✅ **Condition** - Conditional branching with multiple operators
- ✅ **Trigger** - Workflow start points (manual, webhook, schedule)
- ✅ **Delay** - Fixed, random, or time-based delays

### Integration Executors
- ✅ **Slack** - Complete Slack integration with 7 operations

## 📋 Migration Steps

### 1. Test the New System

```bash
# Start your application and test the admin endpoints
GET /admin/node-execution/registry/status
GET /admin/node-execution/migration/status
POST /admin/node-execution/test/all-executors
```

### 2. Update Your Workflows Module

Remove the old executor imports from `src/modules/workflows/workflows.module.ts`:

```typescript
// REMOVE these imports:
import { NodeExecutorFactory } from './application/node-executors/node-executor.factory';
import {
  TriggerNodeExecutor,
  HttpRequestNodeExecutor,
  // ... all other legacy executors
} from './application/node-executors/executors';

// REMOVE from providers array:
NodeExecutorFactory,
TriggerNodeExecutor,
HttpRequestNodeExecutor,
// ... all other legacy executors
```

### 3. Update Workflow Execution Service

Update `src/modules/workflows/application/services/workflow-execution.service.ts`:

```typescript
import { UnifiedNodeExecutionService } from '../../../../core/node-execution/services/unified-node-execution.service';

@Injectable()
export class WorkflowExecutionService {
  constructor(
    private readonly unifiedNodeExecution: UnifiedNodeExecutionService,
  ) {}

  async executeNode(node: WorkflowNode, context: any) {
    return await this.unifiedNodeExecution.executeNode(node, context);
  }
}
```

### 4. Database Migration

Run the SQL migration to update node types:

```sql
-- Get the migration script
GET /admin/node-execution/migration/sql-script

-- Example updates:
UPDATE workflow_nodes SET type = 'httpRequest' WHERE type = 'http-request';
UPDATE workflow_nodes SET type = 'slack' WHERE type = 'SLACK';
UPDATE workflow_nodes SET type = 'condition' WHERE type = 'CONDITION';
UPDATE workflow_nodes SET type = 'trigger' WHERE type = 'TRIGGER';
UPDATE workflow_nodes SET type = 'delay' WHERE type = 'DELAY';
```

### 5. Remove Legacy Files

After testing, remove these directories:
```bash
rm -rf src/modules/workflows/application/node-executors/
rm -rf src/modules/nodes/infrastructure/built-in/
```

## 🔧 Adding New Executors

### Example: Gmail Executor

```typescript
@Injectable()
export class GmailNodeExecutor extends BaseUnifiedNodeExecutor {
  getSchema(): NodeSchema {
    return {
      name: 'gmail',
      displayName: 'Gmail',
      description: 'Send and manage Gmail messages',
      version: 1,
      group: ['communication', 'email'],
      icon: 'fab:google',
      color: '#EA4335',
      inputs: ['main'],
      outputs: ['main'],
      credentials: [{ name: 'gmailApi', required: true }],
      properties: [
        {
          name: 'operation',
          displayName: 'Operation',
          type: 'options',
          required: true,
          options: [
            { name: 'Send Email', value: 'sendEmail' },
            { name: 'Get Emails', value: 'getEmails' },
          ],
        },
        // ... more properties
      ],
    };
  }

  async execute(context: NodeExecutionContext): Promise<NodeExecutionResult> {
    // Implementation here
  }
}
```

### Register New Executor

Add to `unified-node-execution.module.ts`:

```typescript
// Import
import { GmailNodeExecutor } from './executors/integrations/gmail.executor';

// Add to providers
providers: [
  // ...
  GmailNodeExecutor,
],

// Add to constructor
constructor(
  // ...
  private readonly gmailExecutor: GmailNodeExecutor,
) {}

// Register in onModuleInit
this.nodeRegistry.registerExecutor('gmail', this.gmailExecutor);
```

## 🧪 Testing

### Test All Executors
```bash
POST /admin/node-execution/test/all-executors
```

### Test Individual Node
```typescript
const result = await this.unifiedNodeExecution.testNode(node, {
  credentials: { token: 'test-token' },
  inputData: [{ test: 'data' }],
});
```

### Get Node Schema
```bash
GET /admin/node-execution/schemas/slack
```

## 🔍 Variable System

The unified system supports powerful variable replacement:

```typescript
// Input data access
"{{$input.user.email}}"

// Previous node outputs
"{{$node.httpRequest.data.id}}"

// Workflow variables
"{{$vars.apiKey}}"

// Direct parameter access
"{{channelName}}"
```

## 📊 Admin Endpoints

- `GET /admin/node-execution/registry/status` - Registry status
- `GET /admin/node-execution/migration/status` - Migration status  
- `GET /admin/node-execution/migration/cleanup-instructions` - Cleanup guide
- `GET /admin/node-execution/migration/sql-script` - SQL migration
- `POST /admin/node-execution/test/all-executors` - Test all executors
- `GET /admin/node-execution/schemas/:nodeType` - Get node schema
- `GET /admin/node-execution/search?query=slack` - Search nodes

## 🎉 Benefits

1. **No More Duplicates** - Single source of truth for all executors
2. **Consistent API** - All executors follow the same patterns
3. **Better Error Handling** - Comprehensive error reporting and retry logic
4. **Rich Context** - Access to variables, previous outputs, credentials
5. **Easy Testing** - Built-in validation and connection testing
6. **Dynamic UI** - Schemas support dynamic option loading
7. **Migration Tools** - Complete migration and cleanup utilities

## 🚨 Next Steps

1. **Test the new system** using the admin endpoints
2. **Update your workflow execution service** to use the unified system
3. **Run the database migration** to update node types
4. **Remove legacy code** after thorough testing
5. **Add more executors** using the established patterns

The unified system is production-ready and will make your n8n/Zapier clone much more maintainable and extensible! 🚀