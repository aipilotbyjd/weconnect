# Workflow Node Executors Documentation

This document provides an overview of all implemented node executors in the n8n-style workflow automation system.

## Overview

We have successfully implemented a comprehensive set of node executors that enable integration with popular external services. Each executor follows a consistent pattern with proper error handling, variable substitution, and authentication management.

## Implemented Node Executors

### 1. Telegram Node Executor (`telegram-node.executor.ts`)

**Purpose**: Send messages, photos, documents, and manage Telegram bot interactions.

**Operations**:
- `sendMessage`: Send text messages with optional formatting
- `sendPhoto`: Send photos with captions
- `sendDocument`: Send documents with metadata
- `editMessage`: Edit existing messages
- `deleteMessage`: Delete messages

**Authentication**: Bot Token
**Configuration Example**:
```typescript
{
  operation: 'sendMessage',
  botToken: '{{telegram.botToken}}',
  chatId: '{{user.chatId}}',
  text: 'Hello {{user.name}}!',
  parseMode: 'Markdown'
}
```

**Features**:
- Variable replacement in all text fields
- Support for HTML and Markdown formatting
- Photo and document attachments
- Reply-to functionality
- Notification settings

### 2. GitHub Node Executor (`github-node.executor.ts`)

**Purpose**: Manage GitHub repositories, issues, pull requests, and repository operations.

**Operations**:
- `createIssue`: Create new issues
- `updateIssue`: Update existing issues
- `closeIssue`: Close issues
- `createPullRequest`: Create pull requests
- `createRepository`: Create new repositories
- `getIssues`: Fetch issues with filtering
- `getRepositories`: List user repositories
- `createComment`: Add comments to issues/PRs
- `starRepository`: Star repositories
- `forkRepository`: Fork repositories

**Authentication**: OAuth2 or Personal Access Token
**Configuration Example**:
```typescript
{
  operation: 'createIssue',
  accessToken: '{{github.accessToken}}',
  owner: 'myorg',
  repo: 'myrepo',
  title: 'Bug: {{issue.title}}',
  body: 'Description: {{issue.description}}',
  labels: ['bug', 'high-priority'],
  assignees: ['developer1']
}
```

**Features**:
- Full GitHub API v3 integration
- Support for all major repository operations
- Label and assignee management
- Draft pull request support
- Pagination support

### 3. Google Sheets Node Executor (`google-sheets-node.executor.ts`)

**Purpose**: Read, write, and manage Google Spreadsheets data.

**Operations**:
- `readSheet`: Read data from sheets/ranges
- `writeSheet`: Write data to specific ranges
- `appendRow`: Append rows to sheets
- `updateRow`: Update specific rows
- `deleteRow`: Delete rows
- `createSheet`: Create new sheets
- `clearSheet`: Clear sheet data
- `getSheetInfo`: Get spreadsheet metadata

**Authentication**: OAuth2 (Google)
**Configuration Example**:
```typescript
{
  operation: 'appendRow',
  accessToken: '{{google.accessToken}}',
  spreadsheetId: '1ABC...XYZ',
  sheetName: 'Data',
  rowData: ['{{user.name}}', '{{user.email}}', '{{timestamp}}']
}
```

**Features**:
- Full Google Sheets API v4 integration
- Support for A1 notation and named ranges
- Batch operations
- Data type preservation
- Sheet management operations

### 4. Trello Node Executor (`trello-node.executor.ts`)

**Purpose**: Manage Trello boards, lists, cards, and team collaboration.

**Operations**:
- `createCard`: Create new cards
- `updateCard`: Update card details
- `deleteCard`: Delete cards
- `moveCard`: Move cards between lists
- `addComment`: Add comments to cards
- `getCards`: Fetch cards from boards/lists
- `getBoards`: List user boards
- `getLists`: Get lists from boards
- `createList`: Create new lists
- `addMember`: Add members to cards
- `addLabel`: Add/create labels on cards

**Authentication**: API Key + Token
**Configuration Example**:
```typescript
{
  operation: 'createCard',
  apiKey: '{{trello.apiKey}}',
  token: '{{trello.token}}',
  listId: '{{list.id}}',
  name: 'Task: {{task.name}}',
  description: '{{task.description}}',
  due: '{{task.dueDate}}',
  labels: ['urgent']
}
```

**Features**:
- Complete Trello API integration
- Card lifecycle management
- Label and member management
- Due date support
- Board and list operations

### 5. Enhanced Slack Node Executor (existing, improved)

**Purpose**: Send messages, manage channels, and integrate with Slack workspaces.

**Features**:
- Message formatting (rich text, attachments)
- Channel management
- User operations
- File uploads
- Bot interactions

### 6. Enhanced Discord Node Executor (existing, improved)

**Purpose**: Send messages, manage Discord servers, and bot interactions.

**Features**:
- Message formatting with embeds
- Channel management
- Server operations
- Role management
- Webhook integration

### 7. Enhanced Gmail Node Executor (existing, improved)

**Purpose**: Send emails, read mailboxes, and manage Gmail accounts.

**Features**:
- Email composition with attachments
- Mailbox reading and filtering
- Label management
- Email status updates
- OAuth2 integration

## Authentication & Credential Management

### Credential Service (`credential.service.ts`)

A comprehensive credential management system that handles:

**Supported Authentication Types**:
- `API_KEY`: Simple API key authentication
- `OAUTH2`: OAuth2 flow with token refresh
- `BASIC_AUTH`: Username/password authentication
- `BEARER_TOKEN`: Bearer token authentication

**Security Features**:
- AES-256-GCM encryption for stored credentials
- Automatic OAuth2 token refresh
- Secure credential storage
- User-scoped credential access

**Supported Services**:
- Slack, Discord, Gmail, GitHub
- Google Sheets, Telegram, Trello
- SMTP, Webhooks, HTTP

### Credential Entity (`credential.entity.ts`)

Database entity for storing encrypted credentials with:
- Service-specific metadata
- OAuth2 token expiration tracking
- User association
- Active/inactive status
- Audit trail (created/updated timestamps)

## Variable Substitution System

All node executors support dynamic variable replacement using the pattern `{{path.to.variable}}`:

**Examples**:
```typescript
// Simple variables
"Hello {{name}}" → "Hello John"

// Nested object properties
"{{user.profile.email}}" → "john@example.com"

// Array access
"{{items.0.title}}" → "First Item"

// Previous node outputs
"{{previousNode.result.id}}" → "12345"
```

## Error Handling

All executors implement consistent error handling:

1. **Validation Errors**: Configuration validation before execution
2. **API Errors**: Proper error messages from external services
3. **Network Errors**: Timeout and connectivity handling
4. **Authentication Errors**: Token refresh and re-authentication

**Error Response Format**:
```typescript
{
  ...inputData,
  [serviceName]: null,
  [serviceName + 'Error']: "Error message",
  ['_' + serviceName]: {
    nodeId: "node-id",
    nodeName: "Node Name",
    operation: "operationType",
    error: "Detailed error",
    timestamp: "2024-01-01T00:00:00.000Z"
  }
}
```

## Testing

Comprehensive unit tests are implemented for all executors:

- **Configuration Validation**: Test all validation scenarios
- **Successful Operations**: Test happy path with mocked responses
- **Error Handling**: Test various error conditions
- **Variable Replacement**: Test dynamic content substitution
- **Authentication**: Test credential handling

## Usage Examples

### Example 1: Automated Issue Tracking
```yaml
# Workflow: Create GitHub issue from form submission
trigger: webhook
nodes:
  - telegram:
      operation: sendMessage
      text: "New issue received: {{webhook.title}}"
  - github:
      operation: createIssue
      title: "{{webhook.title}}"
      body: "{{webhook.description}}"
      labels: ["bug"]
  - googlesheets:
      operation: appendRow
      rowData: ["{{github.issue.number}}", "{{webhook.title}}", "{{timestamp}}"]
```

### Example 2: Social Media Cross-posting
```yaml
# Workflow: Cross-post content to multiple platforms
trigger: manual
nodes:
  - slack:
      operation: sendMessage
      text: "📢 {{announcement.text}}"
  - discord:
      operation: sendMessage
      content: "{{announcement.text}}"
  - telegram:
      operation: sendMessage
      text: "{{announcement.text}}"
```

### Example 3: Project Management Automation
```yaml
# Workflow: Create Trello card from GitHub PR
trigger: webhook # GitHub PR webhook
nodes:
  - trello:
      operation: createCard
      name: "Review: {{github.pr.title}}"
      description: "{{github.pr.body}}"
      listId: "{{trello.reviewList}}"
  - slack:
      operation: sendMessage
      text: "New PR ready for review: {{github.pr.url}}"
```

## Configuration Requirements

### Environment Variables
```bash
# Encryption key for credential storage
ENCRYPTION_KEY=your-32-character-encryption-key

# Database connection for credentials
DATABASE_URL=postgresql://user:pass@localhost:5432/db
```

### OAuth2 Application Setup
Each service requires OAuth2 application registration:

1. **GitHub**: GitHub Apps or OAuth Apps
2. **Google (Sheets/Gmail)**: Google Cloud Console
3. **Slack**: Slack App in workspace
4. **Discord**: Discord Developer Portal

## Next Steps

1. **Enhanced Testing**: Integration tests with real API endpoints
2. **Rate Limiting**: Implement per-service rate limiting
3. **Bulk Operations**: Add support for batch operations
4. **Custom Executors**: Framework for user-defined executors
5. **Visual Editor**: UI for configuring node properties
6. **Monitoring**: Execution metrics and logging
7. **Templates**: Pre-built workflow templates

## Contributing

When adding new node executors:

1. Follow the existing pattern in `NodeExecutor` interface
2. Implement comprehensive validation
3. Add proper error handling and logging
4. Include variable substitution support
5. Write unit tests with >80% coverage
6. Update this documentation
7. Add integration to the main index file

This system provides a solid foundation for workflow automation with popular cloud services while maintaining security, reliability, and ease of use.
