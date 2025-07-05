# Complete Credential Workflow Example

This document demonstrates the complete credential system in action, from setup to execution with sharing and rotation.

## Scenario Overview

We'll demonstrate a workflow where:
1. **Alice** (Admin) creates and shares Slack credentials with **Bob** (Developer)
2. **Bob** creates a workflow using shared credentials
3. **Alice** sets up rotation policies for the credentials
4. The system automatically rotates credentials while workflows continue to work

## Step 1: Initial Credential Setup

### Alice Creates Slack Credentials

```typescript
// POST /api/credentials
{
  "name": "Company Slack Bot",
  "service": "slack",
  "type": "oauth2",
  "data": {
    "access_token": "xoxb-real-slack-bot-token",
    "refresh_token": "xoxb-refresh-token",
    "bot_token": "xoxb-bot-token",
    "scopes": ["chat:write", "channels:read", "users:read"]
  },
  "configuration": {
    "workspace": "company-workspace",
    "team_id": "T1234567890"
  }
}
```

**Response:**
```typescript
{
  "id": "cred-alice-slack-001",
  "name": "Company Slack Bot",
  "service": "slack",
  "type": "oauth2",
  "isActive": true,
  "userId": "alice-user-id",
  "organizationId": "company-org-001",
  "createdAt": "2024-01-15T10:00:00Z",
  "lastUsedAt": null,
  "expiresAt": "2024-02-15T10:00:00Z"
}
```

## Step 2: Credential Sharing

### Alice Shares Credentials with Bob

```typescript
// POST /api/credential-shares
{
  "credentialId": "cred-alice-slack-001",
  "sharedWithUserId": "bob-user-id",
  "permissions": ["read", "execute"],
  "expiresAt": "2024-06-15T10:00:00Z",
  "note": "For marketing automation workflows"
}
```

**Response:**
```typescript
{
  "id": "share-001",
  "credentialId": "cred-alice-slack-001",
  "sharedByUserId": "alice-user-id",
  "sharedWithUserId": "bob-user-id",
  "permissions": ["read", "execute"],
  "status": "active",
  "expiresAt": "2024-06-15T10:00:00Z",
  "note": "For marketing automation workflows",
  "sharedAt": "2024-01-15T10:30:00Z"
}
```

### Bob Verifies Access

```typescript
// GET /api/credential-shares/shared-with-me
[
  {
    "id": "share-001",
    "credential": {
      "id": "cred-alice-slack-001",
      "name": "Company Slack Bot",
      "service": "slack",
      "type": "oauth2",
      "isActive": true
    },
    "permissions": ["read", "execute"],
    "status": "active",
    "expiresAt": "2024-06-15T10:00:00Z",
    "sharedAt": "2024-01-15T10:30:00Z",
    "sharedByUser": {
      "id": "alice-user-id",
      "name": "Alice Admin",
      "email": "alice@company.com"
    }
  }
]
```

## Step 3: Rotation Policy Setup

### Alice Creates Rotation Policy

```typescript
// POST /api/credential-rotation/cred-alice-slack-001/policy
{
  "enabled": true,
  "rotationType": "oauth2",
  "rotationIntervalDays": 30,
  "warningDays": 7,
  "maxAge": 90,
  "retainVersions": 3,
  "autoRotate": true
}
```

**Response:**
```typescript
{
  "id": "rotation-policy-001",
  "credentialId": "cred-alice-slack-001",
  "rotationType": "oauth2",
  "status": "active",
  "policy": {
    "enabled": true,
    "rotationType": "oauth2",
    "rotationIntervalDays": 30,
    "warningDays": 7,
    "maxAge": 90,
    "retainVersions": 3,
    "autoRotate": true
  },
  "nextRotationAt": "2024-02-14T10:00:00Z",
  "createdByUserId": "alice-user-id",
  "createdAt": "2024-01-15T11:00:00Z"
}
```

## Step 4: Bob Creates a Workflow

### Workflow Definition

```typescript
// POST /api/workflows
{
  "name": "Daily Marketing Report",
  "description": "Send daily marketing metrics to Slack",
  "nodes": [
    {
      "id": "start-node",
      "type": "trigger",
      "name": "Daily Trigger",
      "configuration": {
        "schedule": "0 9 * * *",
        "timezone": "UTC"
      },
      "position": { "x": 100, "y": 100 }
    },
    {
      "id": "analytics-node",
      "type": "http_request",
      "name": "Fetch Analytics",
      "configuration": {
        "method": "GET",
        "url": "https://api.analytics.company.com/daily-report",
        "headers": {
          "Authorization": "Bearer {{analytics_token}}"
        }
      },
      "position": { "x": 300, "y": 100 }
    },
    {
      "id": "slack-node",
      "type": "action",
      "name": "Send to Slack",
      "configuration": {
        "operation": "sendMessage",
        "credentialId": "cred-alice-slack-001", // Using shared credential
        "channel": "#marketing",
        "text": "📊 Daily Marketing Report\nVisitors: {{analytics.visitors}}\nConversions: {{analytics.conversions}}\nRevenue: ${{analytics.revenue}}"
      },
      "position": { "x": 500, "y": 100 }
    }
  ],
  "connections": [
    {
      "sourceNodeId": "start-node",
      "targetNodeId": "analytics-node",
      "sourcePort": "main",
      "targetPort": "main"
    },
    {
      "sourceNodeId": "analytics-node",
      "targetNodeId": "slack-node",
      "sourcePort": "main",
      "targetPort": "main"
    }
  ]
}
```

## Step 5: Workflow Execution

### Manual Execution

```typescript
// POST /api/workflows/workflow-bob-001/execute
{
  "inputData": {
    "analytics_token": "analytics-api-token-123"
  }
}
```

### Behind the Scenes: Credential Context Injection

When the workflow executes, the system:

1. **Creates Credential Context:**
```typescript
const context = {
  userId: "bob-user-id",
  workflowId: "workflow-bob-001",
  executionId: "exec-001",
  nodeId: "slack-node",
  organizationId: "company-org-001"
};
```

2. **Injects Context into Node Input:**
```typescript
const nodeInputData = {
  analytics: {
    visitors: 1250,
    conversions: 45,
    revenue: 2250.00
  },
  _credentialContext: context
};
```

3. **Slack Node Fetches Credentials:**
```typescript
// In SlackNodeExecutor.getToken()
const credential = await this.credentialIntegrationService.getCredentialById(
  "cred-alice-slack-001",
  inputData._credentialContext
);
const token = credential.data.bot_token;
```

4. **Permission Check:**
```typescript
const hasPermission = await this.credentialSharingService.hasPermission(
  "cred-alice-slack-001",
  "bob-user-id",
  SharePermission.EXECUTE
);
// Returns: true
```

5. **Successful Execution:**
```typescript
// Slack API call with retrieved token
const response = await this.httpService.post(
  'https://slack.com/api/chat.postMessage',
  {
    channel: '#marketing',
    text: '📊 Daily Marketing Report\nVisitors: 1250\nConversions: 45\nRevenue: $2250.00'
  },
  {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }
);
```

## Step 6: Automatic Credential Rotation

### 30 Days Later - Automatic Rotation

The system's cron job (`@Cron(CronExpression.EVERY_DAY_AT_3AM)`) detects it's time to rotate:

```typescript
// Rotation Process
const rotationResult = await this.credentialRotationService.rotateCredential(
  "cred-alice-slack-001",
  "alice-user-id",
  RotationType.OAUTH2
);
```

### Rotation Process Details

1. **Create New Credential:**
```typescript
const newCredential = {
  id: "cred-alice-slack-002",
  name: "Company Slack Bot (Rotated)",
  service: "slack",
  type: "oauth2",
  data: {
    access_token: "xoxb-new-refreshed-token",
    refresh_token: "xoxb-new-refresh-token",
    bot_token: "xoxb-new-bot-token",
    scopes: ["chat:write", "channels:read", "users:read"],
    rotatedFrom: "cred-alice-slack-001"
  },
  userId: "alice-user-id",
  organizationId: "company-org-001",
  isActive: true
};
```

2. **Update Old Credential:**
```typescript
const oldCredential = {
  id: "cred-alice-slack-001",
  isActive: false,
  rotatedAt: "2024-02-14T03:00:00Z",
  rotatedToCredentialId: "cred-alice-slack-002"
};
```

3. **Update Shares:**
```typescript
// Automatically update share to point to new credential
const updatedShare = {
  id: "share-001",
  credentialId: "cred-alice-slack-002", // New credential ID
  // All other properties remain the same
};
```

4. **Schedule Next Rotation:**
```typescript
const nextRotation = {
  nextRotationAt: "2024-03-15T03:00:00Z" // 30 days later
};
```

## Step 7: Continued Workflow Operation

### Bob's Workflow Continues Working

The next day, Bob's workflow executes again:

```typescript
// The workflow configuration still references the old credential ID
"credentialId": "cred-alice-slack-001"

// But the credential integration service automatically resolves to the new one
const credential = await this.getCredentialById("cred-alice-slack-001", context);
// Returns data from cred-alice-slack-002 (the rotated credential)
```

### Transparent Operation

Bob doesn't need to update his workflow - the credential system handles the rotation transparently:

1. ✅ Workflow continues to work
2. ✅ Shared permissions are maintained
3. ✅ Security is enhanced through rotation
4. ✅ Audit trail is preserved

## Step 8: Monitoring and Alerts

### Rotation Dashboard

Alice can monitor rotation status:

```typescript
// GET /api/credential-rotation/dashboard
{
  "summary": {
    "totalCredentials": 15,
    "immediate": 0,
    "warning": 2,
    "overdue": 0
  },
  "credentials": {
    "immediate": [],
    "warning": [
      {
        "id": "cred-alice-github-001",
        "name": "GitHub API",
        "service": "github",
        "nextRotationAt": "2024-01-22T03:00:00Z",
        "daysUntilRotation": 5
      }
    ],
    "overdue": []
  }
}
```

### Share Statistics

```typescript
// GET /api/credential-shares/stats
{
  "sharesGiven": 8,
  "sharesReceived": 3,
  "activeShares": 7,
  "expiredShares": 1
}
```

## Security Features Demonstrated

### 1. **Access Control**
- Bob can only execute workflows, not modify credentials
- Alice retains full control as credential owner
- Permissions are enforced at every access

### 2. **Encryption at Rest**
- All credential data is encrypted using AES-256-GCM
- Only authorized users can decrypt credential data

### 3. **Audit Logging**
- Every credential access is logged with context
- Rotation history is maintained
- Share activities are tracked

### 4. **Automatic Security**
- Credentials are rotated automatically based on policies
- Expired shares are cleaned up automatically
- OAuth2 tokens are refreshed proactively

### 5. **Zero-Downtime Operations**
- Workflows continue working during credential rotation
- Gradual credential transition ensures no service interruption

## API Endpoints Summary

### Credential Management
- `POST /api/credentials` - Create credential
- `GET /api/credentials` - List user's credentials
- `PUT /api/credentials/:id` - Update credential
- `DELETE /api/credentials/:id` - Delete credential

### Credential Sharing
- `POST /api/credential-shares` - Share credential
- `GET /api/credential-shares/shared-with-me` - Get shared credentials
- `PUT /api/credential-shares/:id` - Update share permissions
- `DELETE /api/credential-shares/:id` - Revoke share
- `GET /api/credential-shares/stats` - Get sharing statistics

### Credential Rotation
- `POST /api/credential-rotation/:id/policy` - Create rotation policy
- `POST /api/credential-rotation/:id/rotate` - Manual rotation
- `GET /api/credential-rotation/:id/history` - Get rotation history
- `GET /api/credential-rotation/needing-rotation` - Get credentials needing rotation
- `GET /api/credential-rotation/dashboard` - Get rotation dashboard

### Workflow Integration
- Credentials are automatically injected into workflow execution context
- Node executors transparently access shared and rotated credentials
- No workflow modifications needed for credential sharing or rotation

## Conclusion

This example demonstrates a production-ready credential management system that provides:

1. **Security** - End-to-end encryption, access control, and audit logging
2. **Collaboration** - Secure credential sharing with granular permissions
3. **Automation** - Automatic credential rotation and maintenance
4. **Reliability** - Zero-downtime operations and transparent integration
5. **Scalability** - Efficient credential management for teams and organizations

The system handles the complexity of credential management while providing a simple, secure experience for users and workflows.
