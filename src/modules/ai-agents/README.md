# AI Agents Module

This module provides AI agent capabilities for WeConnect workflows, similar to n8n's AI agent functionality.

## Features

### 🤖 Multi-Provider Support
- **OpenAI**: GPT-4, GPT-3.5-turbo, and other OpenAI models
- **Anthropic**: Claude 3 (Opus, Sonnet, Haiku) and Claude 2 models
- **Google AI**: Gemini Pro and PaLM models
- **Azure OpenAI**: Azure-hosted OpenAI models

### 🛠️ Built-in Tools
- **HTTP Request**: Make API calls to external services
- **Workflow Data**: Access data from previous workflow nodes
- **Text Processor**: Transform and manipulate text
- **Date Time**: Work with dates and times
- **JSON Parser**: Parse and manipulate JSON data
- **Calculator**: Perform mathematical calculations

### 🧠 Memory Management
- **Conversation Memory**: Maintain chat history
- **Summary Memory**: Compressed conversation summaries
- **Entity Memory**: Remember specific facts and entities
- **Vector Memory**: Semantic search capabilities

### 🔧 Integration Features
- **Workflow Node**: Use AI agents as workflow nodes
- **Session Management**: Persistent memory across executions
- **Tool Chaining**: Agents can use multiple tools
- **Error Handling**: Robust error handling and retry logic

## Quick Start

### 1. Create an AI Agent

```typescript
const agent = await aiAgentService.createAgent({
  name: 'Customer Support Assistant',
  description: 'Helps customers with their inquiries',
  provider: AIProvider.OPENAI,
  model: 'gpt-4',
  systemPrompt: 'You are a helpful customer support assistant.',
  tools: ['http_request', 'workflow_data'],
  memoryType: MemoryType.CONVERSATION,
});
```

### 2. Use AI Agent in Workflow

Add an AI Agent node to your workflow with the following configuration:

```json
{
  "type": "ai-agent",
  "parameters": {
    "agentId": "agent-uuid",
    "prompt": "Help the customer with their request",
    "includeWorkflowContext": true
  }
}
```

### 3. Test Agent

```typescript
const result = await aiAgentService.testAgent(agentId, 'Hello, how can you help me?');
```

## API Endpoints

### Agents Management
- `GET /ai-agents` - List all agents
- `POST /ai-agents` - Create new agent
- `GET /ai-agents/:id` - Get agent details
- `PUT /ai-agents/:id` - Update agent
- `DELETE /ai-agents/:id` - Delete agent

### Testing & Execution
- `POST /ai-agents/:id/test` - Test agent
- `GET /ai-agents/:id/executions` - Get execution history
- `GET /ai-agents/:id/stats` - Get agent statistics

### Tools & Providers
- `GET /ai-agents/providers` - List available AI providers
- `GET /ai-agents/tools` - List available tools

## Environment Variables

```bash
# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Anthropic
ANTHROPIC_API_KEY=your_anthropic_api_key

# Google AI
GOOGLE_AI_API_KEY=your_google_ai_api_key

# Azure OpenAI
AZURE_OPENAI_API_KEY=your_azure_openai_api_key
AZURE_OPENAI_ENDPOINT=your_azure_endpoint
```

## Database Schema

The module creates the following tables:
- `ai_agents` - Agent configurations
- `ai_agent_executions` - Execution history and results
- `ai_agent_tools` - Agent tool configurations
- `ai_agent_memory` - Memory storage for sessions

## Examples

### Customer Support Agent
```typescript
const supportAgent = await aiAgentService.createAgent({
  name: 'Customer Support',
  description: 'Handles customer inquiries and support requests',
  provider: AIProvider.OPENAI,
  model: 'gpt-4',
  systemPrompt: `You are a helpful customer support assistant. 
    Be friendly, professional, and try to resolve issues quickly.
    If you cannot help, escalate to a human agent.`,
  tools: ['http_request', 'workflow_data'],
  memoryType: MemoryType.CONVERSATION,
});
```

### Data Analysis Agent
```typescript
const dataAgent = await aiAgentService.createAgent({
  name: 'Data Analyzer',
  description: 'Analyzes data and generates insights',
  provider: AIProvider.ANTHROPIC,
  model: 'claude-3-sonnet-20240229',
  systemPrompt: `You are a data analysis expert. 
    Analyze the provided data and generate actionable insights.
    Use charts and visualizations when helpful.`,
  tools: ['json_parser', 'calculator', 'text_processor'],
  memoryType: MemoryType.SUMMARY,
});
```

## Workflow Integration

AI agents can be used in workflows like any other node:

```
[Webhook Trigger] → [AI Agent: Classify Intent] → [Condition] → [Send Response]
```

The AI agent receives:
- Input data from previous nodes
- Workflow context and variables
- Session information for memory
- Custom parameters

And outputs:
- AI-generated response
- Execution metadata (tokens used, execution time)
- Tool usage information

## Performance & Monitoring

The module includes comprehensive monitoring:
- Execution time tracking
- Token usage monitoring
- Error rate analytics
- Memory usage statistics

## Security

- API keys are encrypted at rest
- Agent configurations are user-isolated
- Memory data is automatically cleaned up
- Rate limiting and timeout protection
