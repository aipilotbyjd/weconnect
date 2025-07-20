# AI Agents Module Documentation

## Overview

The AI Agents Module provides intelligent automation capabilities for WeConnect workflows by integrating multiple AI/LLM providers. It enables users to create AI-powered agents that can process natural language, make decisions, use tools, and maintain memory across conversations.

## Architecture

### Domain Layer

#### Entities

**AI Agent Entity** (`src/modules/ai-agents/domain/entities/ai-agent.entity.ts`)
```typescript
@Entity('ai_agents')
export class AIAgent extends BaseEntity {
  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'enum', enum: AIProvider })
  provider: AIProvider;

  @Column()
  model: string;

  @Column({ type: 'text' })
  systemPrompt: string;

  @Column({ type: 'jsonb', default: {} })
  configuration: Record<string, any>;

  @Column({ type: 'enum', enum: MemoryType, default: MemoryType.NONE })
  memoryType: MemoryType;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @OneToMany(() => AIAgentTool, (tool) => tool.agent, { cascade: true })
  tools: AIAgentTool[];

  @OneToMany(() => AIAgentExecution, (execution) => execution.agent)
  executions: AIAgentExecution[];

  @OneToMany(() => AIAgentMemory, (memory) => memory.agent)
  memories: AIAgentMemory[];
}
```

**AI Agent Execution Entity**
```typescript
@Entity('ai_agent_executions')
export class AIAgentExecution extends BaseEntity {
  @Column({ type: 'text' })
  prompt: string;

  @Column({ type: 'text' })
  response: string;

  @Column({ type: 'jsonb', nullable: true })
  toolsUsed?: any[];

  @Column({ type: 'int', default: 0 })
  tokensUsed: number;

  @Column({ type: 'int', default: 0 })
  executionTimeMs: number;

  @Column({ type: 'enum', enum: ExecutionStatus })
  status: ExecutionStatus;

  @Column({ type: 'text', nullable: true })
  errorMessage?: string;

  @ManyToOne(() => AIAgent, (agent) => agent.executions)
  @JoinColumn({ name: 'agentId' })
  agent: AIAgent;

  @ManyToOne(() => WorkflowExecution, { nullable: true })
  @JoinColumn({ name: 'workflowExecutionId' })
  workflowExecution?: WorkflowExecution;
}
```

**AI Agent Memory Entity**
```typescript
@Entity('ai_agent_memory')
export class AIAgentMemory extends BaseEntity {
  @Column()
  sessionId: string;

  @Column({ type: 'enum', enum: MemoryType })
  type: MemoryType;

  @Column({ type: 'jsonb' })
  content: any;

  @Column({ type: 'timestamp with time zone', nullable: true })
  expiresAt?: Date;

  @ManyToOne(() => AIAgent, (agent) => agent.memories)
  @JoinColumn({ name: 'agentId' })
  agent: AIAgent;
}
```

**AI Agent Tool Entity**
```typescript
@Entity('ai_agent_tools')
export class AIAgentTool extends BaseEntity {
  @Column()
  toolName: string;

  @Column({ type: 'jsonb', default: {} })
  configuration: Record<string, any>;

  @Column({ default: true })
  isEnabled: boolean;

  @ManyToOne(() => AIAgent, (agent) => agent.tools)
  @JoinColumn({ name: 'agentId' })
  agent: AIAgent;
}
```

### Application Layer

#### AI Agent Service

**Core Functions:**
- Agent creation and management
- Agent execution and testing
- Tool configuration
- Memory management

**Key Methods:**

```typescript
@Injectable()
export class AIAgentService {
  async createAgent(createAgentDto: CreateAIAgentDto, userId: string): Promise<AIAgent>
  async updateAgent(id: string, updateAgentDto: UpdateAIAgentDto, userId: string): Promise<AIAgent>
  async deleteAgent(id: string, userId: string): Promise<void>
  async getAgent(id: string, userId: string): Promise<AIAgent>
  async getUserAgents(userId: string): Promise<AIAgent[]>
  async testAgent(id: string, prompt: string, userId: string): Promise<AIAgentExecution>
  async executeAgent(agent: AIAgent, prompt: string, context?: any): Promise<AIAgentExecution>
}
```

#### AI Provider Service

**Supported Providers:**
- OpenAI (GPT-4, GPT-3.5-turbo)
- Anthropic (Claude 3 Opus, Sonnet, Haiku)
- Google AI (Gemini Pro, PaLM)
- Azure OpenAI

**Key Methods:**

```typescript
@Injectable()
export class AIProviderService {
  async executePrompt(
    provider: AIProvider,
    model: string,
    prompt: string,
    systemPrompt?: string,
    tools?: AITool[],
    configuration?: any
  ): Promise<AIResponse>

  async validateProvider(provider: AIProvider): Promise<boolean>
  async getAvailableModels(provider: AIProvider): Promise<string[]>
  async estimateTokens(provider: AIProvider, text: string): Promise<number>
}
```

#### AI Tool Service

**Built-in Tools:**
- HTTP Request Tool
- Workflow Data Tool
- Text Processor Tool
- Date Time Tool
- JSON Parser Tool
- Calculator Tool

**Key Methods:**

```typescript
@Injectable()
export class AIToolService {
  async getAvailableTools(): Promise<AITool[]>
  async executeTool(toolName: string, parameters: any, context?: any): Promise<any>
  async validateToolConfiguration(toolName: string, configuration: any): Promise<boolean>
}
```

#### AI Memory Service

**Memory Types:**
- Conversation Memory: Full chat history
- Summary Memory: Compressed summaries
- Entity Memory: Extracted entities and facts
- Vector Memory: Semantic search capabilities

**Key Methods:**

```typescript
@Injectable()
export class AIMemoryService {
  async storeMemory(agentId: string, sessionId: string, type: MemoryType, content: any): Promise<void>
  async retrieveMemory(agentId: string, sessionId: string, type: MemoryType): Promise<any>
  async clearMemory(agentId: string, sessionId?: string): Promise<void>
  async searchMemory(agentId: string, query: string): Promise<any[]>
}
```

### Infrastructure Layer

#### AI Agent Node Executor

**Integration with Workflow Engine:**

```typescript
@Injectable()
export class AIAgentNodeExecutor implements INodeExecutor {
  async execute(
    node: WorkflowNode,
    context: NodeExecutionContext
  ): Promise<NodeExecutionResult> {
    const { agentId, prompt, includeWorkflowContext } = node.parameters;
    
    const agent = await this.aiAgentService.getAgent(agentId, context.userId);
    
    let fullPrompt = prompt;
    if (includeWorkflowContext) {
      fullPrompt += `\n\nWorkflow Context: ${JSON.stringify(context.data)}`;
    }
    
    const execution = await this.aiAgentService.executeAgent(agent, fullPrompt, context);
    
    return {
      success: execution.status === ExecutionStatus.SUCCESS,
      data: {
        response: execution.response,
        tokensUsed: execution.tokensUsed,
        executionTime: execution.executionTimeMs,
        toolsUsed: execution.toolsUsed
      },
      error: execution.errorMessage
    };
  }
}
```

### Presentation Layer

#### AI Agent Controller

**Endpoints:**

```typescript
@Controller('ai-agents')
@UseGuards(JwtAuthGuard)
export class AIAgentController {
  @Get()
  async getAgents(@CurrentUser() user: User): Promise<AIAgent[]>

  @Post()
  async createAgent(
    @Body() createAgentDto: CreateAIAgentDto,
    @CurrentUser() user: User
  ): Promise<AIAgent>

  @Get(':id')
  async getAgent(
    @Param('id') id: string,
    @CurrentUser() user: User
  ): Promise<AIAgent>

  @Put(':id')
  async updateAgent(
    @Param('id') id: string,
    @Body() updateAgentDto: UpdateAIAgentDto,
    @CurrentUser() user: User
  ): Promise<AIAgent>

  @Delete(':id')
  async deleteAgent(
    @Param('id') id: string,
    @CurrentUser() user: User
  ): Promise<void>

  @Post(':id/test')
  async testAgent(
    @Param('id') id: string,
    @Body() testDto: TestAIAgentDto,
    @CurrentUser() user: User
  ): Promise<AIAgentExecution>

  @Get(':id/executions')
  async getExecutions(
    @Param('id') id: string,
    @CurrentUser() user: User
  ): Promise<AIAgentExecution[]>

  @Get('providers')
  async getProviders(): Promise<AIProvider[]>

  @Get('tools')
  async getTools(): Promise<AITool[]>
}
```

**DTOs:**

```typescript
export class CreateAIAgentDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(AIProvider)
  provider: AIProvider;

  @IsString()
  @IsNotEmpty()
  model: string;

  @IsString()
  @IsNotEmpty()
  systemPrompt: string;

  @IsArray()
  @IsOptional()
  tools?: string[];

  @IsEnum(MemoryType)
  @IsOptional()
  memoryType?: MemoryType;

  @IsObject()
  @IsOptional()
  configuration?: Record<string, any>;
}

export class TestAIAgentDto {
  @IsString()
  @IsNotEmpty()
  prompt: string;

  @IsString()
  @IsOptional()
  sessionId?: string;
}
```

## Configuration

### Environment Variables

```env
# OpenAI
OPENAI_API_KEY=your_openai_api_key
OPENAI_ORGANIZATION=your_openai_org_id

# Anthropic
ANTHROPIC_API_KEY=your_anthropic_api_key

# Google AI
GOOGLE_AI_API_KEY=your_google_ai_api_key

# Azure OpenAI
AZURE_OPENAI_API_KEY=your_azure_openai_api_key
AZURE_OPENAI_ENDPOINT=your_azure_endpoint
AZURE_OPENAI_API_VERSION=2023-12-01-preview

# AI Agent Configuration
AI_AGENT_DEFAULT_TIMEOUT=30000
AI_AGENT_MAX_TOKENS=4000
AI_AGENT_MEMORY_TTL=86400
```

### Module Configuration

```typescript
@Module({
  imports: [
    TypeOrmModule.forFeature([
      AIAgent,
      AIAgentExecution,
      AIAgentMemory,
      AIAgentTool,
    ]),
    ConfigModule,
    HttpModule,
  ],
  providers: [
    AIAgentService,
    AIProviderService,
    AIToolService,
    AIMemoryService,
    AIAgentExecutorService,
    AIAgentNodeExecutor,
  ],
  controllers: [AIAgentController],
  exports: [
    AIAgentService,
    AIProviderService,
    AIToolService,
    AIMemoryService,
    AIAgentExecutorService,
    AIAgentNodeExecutor,
  ],
})
export class AIAgentsModule {}
```

## Usage Examples

### Creating a Customer Support Agent

```typescript
const supportAgent = await aiAgentService.createAgent({
  name: 'Customer Support Assistant',
  description: 'Handles customer inquiries and support requests',
  provider: AIProvider.OPENAI,
  model: 'gpt-4',
  systemPrompt: `You are a helpful customer support assistant for WeConnect.
    Be friendly, professional, and try to resolve issues quickly.
    If you cannot help, escalate to a human agent.
    
    Available tools:
    - http_request: Make API calls to external services
    - workflow_data: Access data from previous workflow steps`,
  tools: ['http_request', 'workflow_data'],
  memoryType: MemoryType.CONVERSATION,
}, userId);
```

### Using AI Agent in Workflow

```json
{
  "type": "ai-agent",
  "name": "Process Customer Request",
  "parameters": {
    "agentId": "agent-uuid-here",
    "prompt": "Process this customer request: {{$json.message}}",
    "includeWorkflowContext": true,
    "sessionId": "{{$json.customerId}}"
  }
}
```

### Testing an Agent

```typescript
const execution = await aiAgentService.testAgent(
  agentId,
  'Hello, I need help with my account',
  userId
);

console.log('Response:', execution.response);
console.log('Tokens used:', execution.tokensUsed);
console.log('Execution time:', execution.executionTimeMs, 'ms');
```

## Built-in Tools

### HTTP Request Tool
```typescript
{
  "name": "http_request",
  "description": "Make HTTP requests to external APIs",
  "parameters": {
    "url": "string",
    "method": "GET|POST|PUT|DELETE",
    "headers": "object",
    "body": "any"
  }
}
```

### Workflow Data Tool
```typescript
{
  "name": "workflow_data",
  "description": "Access data from previous workflow nodes",
  "parameters": {
    "nodeId": "string",
    "path": "string"
  }
}
```

### Text Processor Tool
```typescript
{
  "name": "text_processor",
  "description": "Transform and manipulate text",
  "parameters": {
    "operation": "uppercase|lowercase|trim|replace",
    "text": "string",
    "options": "object"
  }
}
```

## Memory Management

### Conversation Memory
Stores complete conversation history for context-aware responses:

```typescript
await aiMemoryService.storeMemory(
  agentId,
  sessionId,
  MemoryType.CONVERSATION,
  {
    messages: [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi! How can I help you?' }
    ]
  }
);
```

### Summary Memory
Maintains compressed conversation summaries:

```typescript
await aiMemoryService.storeMemory(
  agentId,
  sessionId,
  MemoryType.SUMMARY,
  {
    summary: 'User asked about account issues. Provided troubleshooting steps.',
    keyPoints: ['account_problem', 'troubleshooting_provided']
  }
);
```

## Error Handling

### Common Errors
- **Provider API Errors**: Rate limits, invalid API keys
- **Token Limit Exceeded**: Response too long for model
- **Tool Execution Errors**: Tool-specific failures
- **Memory Errors**: Memory storage/retrieval issues

### Error Response Format

```typescript
{
  "statusCode": 500,
  "message": "AI agent execution failed",
  "error": "Internal Server Error",
  "details": {
    "agentId": "agent-uuid",
    "provider": "openai",
    "errorType": "token_limit_exceeded",
    "originalError": "Maximum context length exceeded"
  }
}
```

## Performance Optimization

### Token Management
- Monitor token usage per execution
- Implement token limits per agent
- Use appropriate models for task complexity

### Memory Optimization
- Set appropriate memory TTL
- Clean up expired memories
- Use summary memory for long conversations

### Caching
- Cache provider responses for identical prompts
- Cache tool execution results
- Cache model availability checks

## Security Considerations

### API Key Management
- Store API keys encrypted
- Rotate keys regularly
- Monitor API usage

### Input Validation
- Sanitize user prompts
- Validate tool parameters
- Prevent prompt injection attacks

### Rate Limiting
- Implement per-user rate limits
- Monitor provider API usage
- Set execution timeouts

## Testing

### Unit Tests
```typescript
describe('AIAgentService', () => {
  let service: AIAgentService;
  let repository: Repository<AIAgent>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AIAgentService,
        {
          provide: getRepositoryToken(AIAgent),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<AIAgentService>(AIAgentService);
  });

  describe('createAgent', () => {
    it('should create an AI agent successfully', async () => {
      const createDto = {
        name: 'Test Agent',
        provider: AIProvider.OPENAI,
        model: 'gpt-4',
        systemPrompt: 'You are a test agent',
      };

      const result = await service.createAgent(createDto, 'user-id');
      expect(result.name).toBe(createDto.name);
    });
  });
});
```

### Integration Tests
```typescript
describe('AI Agent Integration', () => {
  it('should execute agent with workflow context', async () => {
    const agent = await createTestAgent();
    const context = { data: { customerName: 'John Doe' } };
    
    const execution = await aiAgentService.executeAgent(
      agent,
      'Greet the customer',
      context
    );
    
    expect(execution.status).toBe(ExecutionStatus.SUCCESS);
    expect(execution.response).toContain('John Doe');
  });
});
```

## Monitoring and Analytics

### Execution Metrics
- Response time tracking
- Token usage monitoring
- Success/failure rates
- Tool usage statistics

### Performance Dashboards
- Agent performance comparison
- Provider response times
- Cost analysis per execution
- Memory usage patterns

## Future Enhancements

### Planned Features
- **Custom Tools**: User-defined tool creation
- **Agent Collaboration**: Multi-agent workflows
- **Fine-tuning**: Custom model training
- **Advanced Memory**: Vector-based semantic memory
- **Streaming Responses**: Real-time response streaming
- **Agent Templates**: Pre-built agent configurations

### Integration Roadmap
- **Voice Integration**: Speech-to-text and text-to-speech
- **Image Processing**: Vision model integration
- **Code Generation**: Specialized coding agents
- **Document Processing**: PDF and document analysis
- **Multi-modal**: Combined text, image, and audio processing

---

**Last Updated**: $(date)
**Module Version**: 1.0.0
**Maintainer**: WeConnect AI Team