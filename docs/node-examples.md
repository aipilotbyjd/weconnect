# WeConnect Node Types - Complete Examples

## All Node Types Working Examples

### 1. Trigger Node
Starts the workflow execution.

```json
{
  "name": "Manual Start",
  "type": "trigger",
  "configuration": {
    "triggerType": "manual",
    "description": "Manually triggered workflow"
  }
}
```

### 2. HTTP Request Node
Makes HTTP API calls with full variable support.

```json
{
  "name": "Fetch User Data",
  "type": "http-request",
  "configuration": {
    "method": "GET",
    "url": "https://api.example.com/users/{{userId}}",
    "headers": {
      "Authorization": "Bearer {{apiToken}}",
      "Content-Type": "application/json"
    },
    "timeout": 30000
  }
}
```

### 3. Condition Node
Evaluates conditions and branches workflow.

```json
{
  "name": "Check User Status",
  "type": "condition",
  "configuration": {
    "conditions": [
      {
        "field": "user.status",
        "operator": "equals",
        "value": "active"
      },
      {
        "field": "user.age",
        "operator": "greater",
        "value": 18,
        "combineWith": "AND"
      }
    ]
  }
}
```

Supported operators:
- `equals`, `notEquals`, `strictEquals`, `strictNotEquals`
- `greater`, `less`, `greaterOrEqual`, `lessOrEqual`
- `contains`, `notContains`, `startsWith`, `endsWith`
- `matches` (regex), `in`, `notIn`
- `exists`, `notExists`, `isEmpty`, `isNotEmpty`
- `isTrue`, `isFalse`, `isNumber`, `isString`, `isArray`, `isObject`

### 4. Action Node
Performs data transformations and operations.

```json
{
  "name": "Transform Data",
  "type": "action",
  "configuration": {
    "actionType": "transform",
    "parameters": {
      "mapping": {
        "fullName": "user.firstName + ' ' + user.lastName",
        "email": "user.email",
        "status": "user.accountStatus"
      }
    },
    "outputKey": "transformedUser"
  }
}
```

Action types:
- `transform` - Map data to new structure
- `filter` - Filter arrays based on conditions
- `aggregate` - Sum, count, average, min, max
- `merge` - Merge multiple data sources
- `split` - Split strings into arrays

### 5. Webhook Node
Handles incoming webhooks or makes webhook calls.

```json
{
  "name": "Send Webhook",
  "type": "webhook",
  "configuration": {
    "url": "https://hooks.example.com/webhook",
    "method": "POST",
    "authentication": {
      "type": "hmac",
      "credentials": {
        "secret": "webhook-secret-key"
      }
    },
    "headers": {
      "X-Custom-Header": "{{workflowId}}"
    },
    "retryOnFail": true,
    "maxRetries": 3
  }
}
```

Authentication types:
- `none` - No authentication
- `basic` - Basic auth with username/password
- `bearer` - Bearer token
- `apiKey` - API key in header
- `hmac` - HMAC signature

### 6. Email Node
Sends emails with template support.

```json
{
  "name": "Send Welcome Email",
  "type": "email",
  "configuration": {
    "to": "{{user.email}}",
    "from": "welcome@company.com",
    "subject": "Welcome {{user.firstName}}!",
    "template": "welcome-email",
    "context": {
      "userName": "{{user.firstName}}",
      "activationLink": "{{activationUrl}}"
    }
  }
}
```

### 7. Delay Node
Pauses workflow execution.

```json
{
  "name": "Wait 5 Minutes",
  "type": "delay",
  "configuration": {
    "delay": 5,
    "unit": "minutes"
  }
}
```

Advanced delay with business hours:
```json
{
  "name": "Wait Until Business Hours",
  "type": "delay",
  "configuration": {
    "delay": 1,
    "unit": "hours",
    "businessHours": {
      "enabled": true,
      "start": "09:00",
      "end": "17:00",
      "excludeWeekends": true,
      "timezone": "America/New_York"
    }
  }
}
```

Wait until specific time:
```json
{
  "name": "Wait Until Tomorrow",
  "type": "delay",
  "configuration": {
    "waitUntil": "{{tomorrow}}",
    "unit": "milliseconds"
  }
}
```

## Complete Workflow Example

Here's a complete workflow using all node types:

```json
{
  "name": "User Onboarding Workflow",
  "description": "Complete user onboarding with all node types",
  "nodes": [
    {
      "id": "trigger-1",
      "name": "New User Trigger",
      "type": "trigger",
      "configuration": {
        "triggerType": "webhook",
        "event": "user.created"
      },
      "position": { "x": 100, "y": 100 }
    },
    {
      "id": "http-1",
      "name": "Enrich User Data",
      "type": "http-request",
      "configuration": {
        "method": "POST",
        "url": "https://api.enrichment.com/user",
        "body": {
          "email": "{{trigger.user.email}}"
        }
      },
      "position": { "x": 300, "y": 100 }
    },
    {
      "id": "action-1",
      "name": "Transform User Data",
      "type": "action",
      "configuration": {
        "actionType": "transform",
        "parameters": {
          "mapping": {
            "fullName": "trigger.user.firstName + ' ' + trigger.user.lastName",
            "email": "trigger.user.email",
            "enrichedData": "webhookResponse"
          }
        }
      },
      "position": { "x": 500, "y": 100 }
    },
    {
      "id": "condition-1",
      "name": "Check User Type",
      "type": "condition",
      "configuration": {
        "conditions": [
          {
            "field": "actionResult.enrichedData.isPremium",
            "operator": "isTrue"
          }
        ]
      },
      "position": { "x": 700, "y": 100 }
    },
    {
      "id": "delay-1",
      "name": "Wait 1 Hour",
      "type": "delay",
      "configuration": {
        "delay": 1,
        "unit": "hours"
      },
      "position": { "x": 900, "y": 50 }
    },
    {
      "id": "email-1",
      "name": "Send Premium Welcome",
      "type": "email",
      "configuration": {
        "to": "{{actionResult.email}}",
        "subject": "Welcome Premium User!",
        "template": "premium-welcome"
      },
      "position": { "x": 1100, "y": 50 }
    },
    {
      "id": "email-2",
      "name": "Send Standard Welcome",
      "type": "email",
      "configuration": {
        "to": "{{actionResult.email}}",
        "subject": "Welcome!",
        "template": "standard-welcome"
      },
      "position": { "x": 900, "y": 150 }
    },
    {
      "id": "webhook-1",
      "name": "Notify CRM",
      "type": "webhook",
      "configuration": {
        "url": "https://crm.example.com/webhook/new-user",
        "method": "POST",
        "authentication": {
          "type": "bearer",
          "credentials": {
            "token": "{{env.CRM_TOKEN}}"
          }
        }
      },
      "position": { "x": 1300, "y": 100 }
    }
  ],
  "connections": [
    {
      "sourceNodeId": "trigger-1",
      "targetNodeId": "http-1",
      "type": "main"
    },
    {
      "sourceNodeId": "http-1",
      "targetNodeId": "action-1",
      "type": "main"
    },
    {
      "sourceNodeId": "action-1",
      "targetNodeId": "condition-1",
      "type": "main"
    },
    {
      "sourceNodeId": "condition-1",
      "targetNodeId": "delay-1",
      "type": "true"
    },
    {
      "sourceNodeId": "condition-1",
      "targetNodeId": "email-2",
      "type": "false"
    },
    {
      "sourceNodeId": "delay-1",
      "targetNodeId": "email-1",
      "type": "main"
    },
    {
      "sourceNodeId": "email-1",
      "targetNodeId": "webhook-1",
      "type": "main"
    },
    {
      "sourceNodeId": "email-2",
      "targetNodeId": "webhook-1",
      "type": "main"
    }
  ]
}
```

## Variable System

Variables can be accessed using `{{path.to.value}}` syntax:
- `{{trigger.*}}` - Data from trigger node
- `{{nodeId.*}}` - Data from specific node output
- `{{_condition.result}}` - Condition evaluation result
- `{{webhookResponse.*}}` - Response from webhook calls
- `{{actionResult.*}}` - Result from action nodes

## Error Handling

All nodes support error handling:
- HTTP requests capture error responses
- Conditions safely evaluate invalid data
- Actions handle transformation errors
- Webhooks support retries on failure

## Performance Features

- Async execution with BullMQ
- Parallel node execution where possible
- Configurable timeouts
- Business hours support in delays
- Retry mechanisms for external calls
