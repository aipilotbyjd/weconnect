# Executions Module Documentation

## Overview

The Executions Module is the core engine responsible for executing workflows in WeConnect. It manages the entire lifecycle of workflow executions, from initiation to completion, including error handling, retries, performance monitoring, and real-time status updates.

## Architecture

### Domain Layer

#### Entities

**Execution Entity** (`src/modules/executions/domain/entities/execution.entity.ts`)
```typescript
@Entity('executions')
export class Execution extends BaseEntity {
  @Column({ type: 'uuid' })
  workflowId: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  organizationId: string;

  @Column({ type: 'enum', enum: ExecutionStatus, default: ExecutionStatus.PENDING })
  status: ExecutionStatus;

  @Column({ type: 'enum', enum: ExecutionMode, default: ExecutionMode.MANUAL })
  mode: ExecutionMode;

  @Column({ type: 'jsonb', nullable: true })
  inputData?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  outputData?: Record<string, any>;

  @Column({ type: 'jsonb', default: {} })
  context: Record<string, any>;

  @Column({ type: 'timestamp with time zone', nullable: true })
  startedAt?: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  completedAt?: Date;

  @Column({ type: 'int', default: 0 })
  duration: number; // in milliseconds

  @Column({ type: 'text', nullable: true })
  errorMessage?: string;

  @Column({ type: 'jsonb', nullable: true })
  errorDetails?: Record<string, any>;

  @Column({ type: 'int', default: 0 })
  retryCount: number;

  @Column({ type: 'int', default: 0 })
  nodesExecuted: number;

  @Column({ type: 'int', default: 0 })
  nodesFailed: number;

  @Column({ type: 'jsonb', default: {} })
  metrics: ExecutionMetrics;

  @ManyToOne(() => Workflow, { eager: true })
  @JoinColumn({ name: 'workflowId' })
  workflow: Workflow;

  @OneToMany(() => ExecutionLog, (log) => log.execution, { cascade: true })
  logs: ExecutionLog[];
}
```

**Execution Log Entity** (`src/modules/executions/domain/entities/execution-log.entity.ts`)
```typescript
@Entity('execution_logs')
export class ExecutionLog extends BaseEntity {
  @Column({ type: 'uuid' })
  executionId: string;

  @Column({ type: 'uuid', nullable: true })
  nodeId?: string;

  @Column({ type: 'enum', enum: LogLevel })
  level: LogLevel;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'jsonb', nullable: true })
  data?: Record<string, any>;

  @Column({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;

  @Column({ type: 'int', default: 0 })
  executionStep: number;

  @Column({ type: 'varchar', nullable: true })
  nodeType?: string;

  @Column({ type: 'varchar', nullable: true })
  nodeName?: string;

  @ManyToOne(() => Execution, (execution) => execution.logs)
  @JoinColumn({ name: 'executionId' })
  execution: Execution;
}
```

#### Value Objects

```typescript
export interface ExecutionMetrics {
  totalNodes: number;
  successfulNodes: number;
  failedNodes: number;
  skippedNodes: number;
  averageNodeExecutionTime: number;
  memoryUsage: number;
  cpuUsage: number;
}

export enum ExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  TIMEOUT = 'timeout',
  PAUSED = 'paused'
}

export enum ExecutionMode {
  MANUAL = 'manual',
  WEBHOOK = 'webhook',
  SCHEDULED = 'scheduled',
  API = 'api',
  TEST = 'test'
}

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}
```

### Application Layer

#### Executions Service

**Core Functions:**
- Execution lifecycle management
- Status tracking and updates
- Execution history and analytics
- Real-time execution monitoring

**Key Methods:**

```typescript
@Injectable()
export class ExecutionsService {
  async createExecution(
    workflowId: string,
    userId: string,
    mode: ExecutionMode,
    inputData?: Record<string, any>
  ): Promise<Execution>

  async getExecution(id: string, userId: string): Promise<Execution>

  async getUserExecutions(
    userId: string,
    organizationId: string,
    filters?: ExecutionFilters
  ): Promise<PaginatedResult<Execution>>

  async getWorkflowExecutions(
    workflowId: string,
    userId: string,
    filters?: ExecutionFilters
  ): Promise<PaginatedResult<Execution>>

  async updateExecutionStatus(
    id: string,
    status: ExecutionStatus,
    data?: Partial<Execution>
  ): Promise<void>

  async cancelExecution(id: string, userId: string): Promise<void>

  async retryExecution(id: string, userId: string): Promise<Execution>

  async getExecutionLogs(
    executionId: string,
    userId: string,
    filters?: LogFilters
  ): Promise<ExecutionLog[]>

  async addExecutionLog(
    executionId: string,
    level: LogLevel,
    message: string,
    data?: Record<string, any>,
    nodeId?: string
  ): Promise<void>

  async getExecutionMetrics(
    executionId: string,
    userId: string
  ): Promise<ExecutionMetrics>

  async getExecutionStatistics(
    userId: string,
    organizationId: string,
    timeRange?: TimeRange
  ): Promise<ExecutionStatistics>
}
```

#### Workflow Execution Service

**Core Functions:**
- Orchestrates the actual workflow execution
- Manages node execution order and dependencies
- Handles data flow between nodes
- Implements execution strategies (sequential, parallel)

**Key Methods:**

```typescript
@Injectable()
export class WorkflowExecutionService {
  async executeWorkflow(
    execution: Execution,
    workflow: Workflow,
    inputData?: Record<string, any>
  ): Promise<Record<string, any>>

  async executeNode(
    node: WorkflowNode,
    context: NodeExecutionContext,
    execution: Execution
  ): Promise<NodeExecutionResult>

  async buildExecutionGraph(workflow: Workflow): Promise<ExecutionGraph>

  async validateWorkflowExecution(workflow: Workflow): Promise<ValidationResult>

  async pauseExecution(executionId: string): Promise<void>

  async resumeExecution(executionId: string): Promise<void>

  async getExecutionProgress(executionId: string): Promise<ExecutionProgress>

  private async executeNodesSequentially(
    nodes: WorkflowNode[],
    context: ExecutionContext,
    execution: Execution
  ): Promise<Record<string, any>>

  private async executeNodesInParallel(
    nodes: WorkflowNode[],
    context: ExecutionContext,
    execution: Execution
  ): Promise<Record<string, any>>
}
```

#### Start Execution Use Case

**Functions:**
- Validates execution prerequisites
- Initializes execution context
- Queues execution for processing
- Handles execution modes

**Key Methods:**

```typescript
@Injectable()
export class StartExecutionUseCase {
  async execute(command: StartExecutionCommand): Promise<StartExecutionResult>

  private async validateExecutionRequest(command: StartExecutionCommand): Promise<void>

  private async prepareExecutionContext(
    workflow: Workflow,
    inputData?: Record<string, any>
  ): Promise<ExecutionContext>

  private async queueExecution(execution: Execution): Promise<void>
}
```

#### Retry Service

**Functions:**
- Implements retry strategies
- Manages retry policies
- Handles exponential backoff
- Tracks retry attempts

**Key Methods:**

```typescript
@Injectable()
export class RetryService {
  async shouldRetry(
    execution: Execution,
    error: Error,
    retryPolicy: RetryPolicy
  ): Promise<boolean>

  async calculateRetryDelay(
    retryCount: number,
    retryPolicy: RetryPolicy
  ): Promise<number>

  async retryExecution(
    executionId: string,
    retryPolicy?: RetryPolicy
  ): Promise<void>

  async getRetryHistory(executionId: string): Promise<RetryAttempt[]>
}
```

#### Circuit Breaker Service

**Functions:**
- Prevents cascade failures
- Monitors failure rates
- Implements circuit breaker pattern
- Provides fallback mechanisms

**Key Methods:**

```typescript
@Injectable()
export class CircuitBreakerService {
  async executeWithCircuitBreaker<T>(
    key: string,
    operation: () => Promise<T>,
    fallback?: () => Promise<T>
  ): Promise<T>

  async getCircuitBreakerState(key: string): Promise<CircuitBreakerState>

  async resetCircuitBreaker(key: string): Promise<void>

  async configureCircuitBreaker(
    key: string,
    config: CircuitBreakerConfig
  ): Promise<void>
}
```

#### Performance Monitor Service

**Functions:**
- Tracks execution performance
- Monitors resource usage
- Generates performance reports
- Identifies bottlenecks

**Key Methods:**

```typescript
@Injectable()
export class PerformanceMonitorService {
  async startPerformanceTracking(executionId: string): Promise<void>

  async endPerformanceTracking(executionId: string): Promise<PerformanceReport>

  async trackNodePerformance(
    executionId: string,
    nodeId: string,
    metrics: NodePerformanceMetrics
  ): Promise<void>

  async getPerformanceReport(executionId: string): Promise<PerformanceReport>

  async getPerformanceTrends(
    workflowId: string,
    timeRange: TimeRange
  ): Promise<PerformanceTrends>
}
```

### Infrastructure Layer

#### Execution Queue Processor

**Functions:**
- Processes execution jobs from queue
- Manages job priorities
- Handles job failures and retries
- Implements job scheduling

**Key Methods:**

```typescript
@Processor('execution-queue')
export class ExecutionQueueProcessor {
  @Process('execute-workflow')
  async processWorkflowExecution(job: Job<ExecutionJobData>): Promise<void>

  @Process('retry-execution')
  async processRetryExecution(job: Job<RetryJobData>): Promise<void>

  @OnQueueActive()
  onActive(job: Job): void

  @OnQueueCompleted()
  onCompleted(job: Job, result: any): void

  @OnQueueFailed()
  onFailed(job: Job, error: Error): void

  @OnQueueStalled()
  onStalled(job: Job): void
}
```

#### Execution WebSocket Module

**Functions:**
- Real-time execution status updates
- Live execution logs streaming
- Progress notifications
- Error alerts

**Key Components:**

```typescript
@WebSocketGateway({
  namespace: 'executions',
  cors: { origin: '*' }
})
export class ExecutionWebSocketGateway {
  @SubscribeMessage('join-execution')
  handleJoinExecution(
    @MessageBody() data: { executionId: string },
    @ConnectedSocket() client: Socket
  ): void

  @SubscribeMessage('leave-execution')
  handleLeaveExecution(
    @MessageBody() data: { executionId: string },
    @ConnectedSocket() client: Socket
  ): void

  async broadcastExecutionUpdate(
    executionId: string,
    update: ExecutionUpdate
  ): Promise<void>

  async broadcastExecutionLog(
    executionId: string,
    log: ExecutionLog
  ): Promise<void>
}
```

### Presentation Layer

#### Executions Controller

**Endpoints:**

```typescript
@Controller('executions')
@UseGuards(JwtAuthGuard)
export class ExecutionsController {
  @Get()
  async getExecutions(
    @CurrentUser() user: User,
    @Query() filters: ExecutionFiltersDto
  ): Promise<PaginatedResult<Execution>>

  @Post()
  async startExecution(
    @Body() startExecutionDto: StartExecutionDto,
    @CurrentUser() user: User
  ): Promise<Execution>

  @Get(':id')
  async getExecution(
    @Param('id') id: string,
    @CurrentUser() user: User
  ): Promise<Execution>

  @Post(':id/cancel')
  async cancelExecution(
    @Param('id') id: string,
    @CurrentUser() user: User
  ): Promise<void>

  @Post(':id/retry')
  async retryExecution(
    @Param('id') id: string,
    @CurrentUser() user: User
  ): Promise<Execution>

  @Get(':id/logs')
  async getExecutionLogs(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Query() filters: LogFiltersDto
  ): Promise<ExecutionLog[]>

  @Get(':id/metrics')
  async getExecutionMetrics(
    @Param('id') id: string,
    @CurrentUser() user: User
  ): Promise<ExecutionMetrics>

  @Get('workflow/:workflowId')
  async getWorkflowExecutions(
    @Param('workflowId') workflowId: string,
    @CurrentUser() user: User,
    @Query() filters: ExecutionFiltersDto
  ): Promise<PaginatedResult<Execution>>

  @Get('statistics')
  async getExecutionStatistics(
    @CurrentUser() user: User,
    @Query() timeRange: TimeRangeDto
  ): Promise<ExecutionStatistics>
}
```

**DTOs:**

```typescript
export class StartExecutionDto {
  @IsUUID()
  workflowId: string;

  @IsEnum(ExecutionMode)
  @IsOptional()
  mode?: ExecutionMode = ExecutionMode.MANUAL;

  @IsObject()
  @IsOptional()
  inputData?: Record<string, any>;

  @IsNumber()
  @IsOptional()
  @Min(1000)
  @Max(3600000)
  timeout?: number = 300000; // 5 minutes default
}

export class ExecutionFiltersDto {
  @IsEnum(ExecutionStatus)
  @IsOptional()
  status?: ExecutionStatus;

  @IsEnum(ExecutionMode)
  @IsOptional()
  mode?: ExecutionMode;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsNumber()
  @IsOptional()
  @Min(0)
  offset?: number = 0;
}

export class LogFiltersDto {
  @IsEnum(LogLevel)
  @IsOptional()
  level?: LogLevel;

  @IsUUID()
  @IsOptional()
  nodeId?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(1000)
  limit?: number = 100;
}
```

## Configuration

### Environment Variables

```env
# Redis Configuration (for queues)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Execution Configuration
EXECUTION_DEFAULT_TIMEOUT=300000
EXECUTION_MAX_TIMEOUT=3600000
EXECUTION_RETRY_ATTEMPTS=3
EXECUTION_RETRY_DELAY=2000

# Performance Monitoring
PERFORMANCE_MONITORING_ENABLED=true
PERFORMANCE_SAMPLING_RATE=0.1

# Circuit Breaker Configuration
CIRCUIT_BREAKER_FAILURE_THRESHOLD=5
CIRCUIT_BREAKER_TIMEOUT=60000
CIRCUIT_BREAKER_RESET_TIMEOUT=30000

# WebSocket Configuration
WEBSOCKET_ENABLED=true
WEBSOCKET_CORS_ORIGIN=*
```

### Module Configuration

```typescript
@Module({
  imports: [
    TypeOrmModule.forFeature([Execution, ExecutionLog, Workflow, WorkflowNode]),
    BullModule.registerQueueAsync({
      name: 'execution-queue',
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get('redis.host'),
          port: configService.get('redis.port'),
          password: configService.get('redis.password'),
          db: configService.get('redis.db'),
        },
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      }),
      inject: [ConfigService],
    }),
    ExecutionWebSocketModule,
  ],
  controllers: [ExecutionsController],
  providers: [
    ExecutionsService,
    WorkflowExecutionService,
    StartExecutionUseCase,
    RetryService,
    CircuitBreakerService,
    PerformanceMonitorService,
    ExecutionQueueProcessor,
  ],
  exports: [
    ExecutionsService,
    RetryService,
    CircuitBreakerService,
    PerformanceMonitorService,
  ],
})
export class ExecutionsModule {}
```

## Usage Examples

### Starting a Workflow Execution

```typescript
// Manual execution
const execution = await executionsService.createExecution(
  workflowId,
  userId,
  ExecutionMode.MANUAL,
  { customerEmail: 'user@example.com', orderId: '12345' }
);

// Queue for processing
await startExecutionUseCase.execute({
  executionId: execution.id,
  workflowId,
  userId,
  mode: ExecutionMode.MANUAL,
  inputData: { customerEmail: 'user@example.com' }
});
```

### Monitoring Execution Progress

```typescript
// Get real-time updates via WebSocket
const socket = io('ws://localhost:3000/executions');

socket.emit('join-execution', { executionId });

socket.on('execution-update', (update) => {
  console.log('Status:', update.status);
  console.log('Progress:', update.progress);
});

socket.on('execution-log', (log) => {
  console.log(`[${log.level}] ${log.message}`);
});
```

### Implementing Custom Retry Logic

```typescript
const retryPolicy: RetryPolicy = {
  maxAttempts: 5,
  backoffStrategy: BackoffStrategy.EXPONENTIAL,
  baseDelay: 1000,
  maxDelay: 30000,
  retryableErrors: ['NETWORK_ERROR', 'TIMEOUT_ERROR']
};

const shouldRetry = await retryService.shouldRetry(
  execution,
  error,
  retryPolicy
);

if (shouldRetry) {
  const delay = await retryService.calculateRetryDelay(
    execution.retryCount,
    retryPolicy
  );
  
  setTimeout(() => {
    retryService.retryExecution(execution.id, retryPolicy);
  }, delay);
}
```

### Circuit Breaker Usage

```typescript
// Protect external API calls
const result = await circuitBreakerService.executeWithCircuitBreaker(
  'external-api-service',
  async () => {
    return await httpService.get('https://api.external-service.com/data');
  },
  async () => {
    // Fallback when circuit is open
    return { data: 'cached-fallback-data' };
  }
);
```

## Execution Flow

### 1. Execution Initialization
```
User Request → Validation → Create Execution → Queue Job
```

### 2. Workflow Processing
```
Dequeue Job → Load Workflow → Build Execution Graph → Execute Nodes
```

### 3. Node Execution
```
For Each Node:
  Validate Prerequisites → Execute Node → Handle Result → Update Context
```

### 4. Completion
```
All Nodes Complete → Update Status → Send Notifications → Clean Up
```

## Error Handling

### Execution Errors
- **Validation Errors**: Invalid workflow or input data
- **Node Execution Errors**: Individual node failures
- **Timeout Errors**: Execution exceeds time limit
- **Resource Errors**: Insufficient system resources

### Error Recovery Strategies
- **Automatic Retry**: For transient failures
- **Circuit Breaker**: For external service failures
- **Fallback Execution**: Alternative execution paths
- **Manual Intervention**: For complex failures

### Error Response Format

```typescript
{
  "statusCode": 500,
  "message": "Workflow execution failed",
  "error": "Internal Server Error",
  "details": {
    "executionId": "execution-uuid",
    "workflowId": "workflow-uuid",
    "failedNodeId": "node-uuid",
    "errorType": "node_execution_error",
    "retryable": true,
    "retryCount": 2,
    "maxRetries": 3
  }
}
```

## Performance Optimization

### Queue Management
- **Priority Queues**: High-priority executions first
- **Concurrency Control**: Limit concurrent executions
- **Resource Allocation**: Dynamic resource scaling
- **Load Balancing**: Distribute across workers

### Memory Management
- **Context Cleanup**: Clear execution context after completion
- **Log Rotation**: Archive old execution logs
- **Result Caching**: Cache frequently accessed results
- **Garbage Collection**: Regular cleanup of completed executions

### Database Optimization
- **Indexing**: Optimize queries with proper indexes
- **Partitioning**: Partition large execution tables
- **Connection Pooling**: Efficient database connections
- **Query Optimization**: Optimize complex execution queries

## Testing

### Unit Tests
```typescript
describe('WorkflowExecutionService', () => {
  let service: WorkflowExecutionService;
  let executionRepository: Repository<Execution>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkflowExecutionService,
        {
          provide: getRepositoryToken(Execution),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<WorkflowExecutionService>(WorkflowExecutionService);
  });

  describe('executeWorkflow', () => {
    it('should execute workflow successfully', async () => {
      const workflow = createMockWorkflow();
      const execution = createMockExecution();
      
      const result = await service.executeWorkflow(
        execution,
        workflow,
        { input: 'test' }
      );
      
      expect(result).toBeDefined();
      expect(execution.status).toBe(ExecutionStatus.SUCCESS);
    });
  });
});
```

### Integration Tests
```typescript
describe('Execution Flow Integration', () => {
  it('should complete full execution lifecycle', async () => {
    // Create workflow
    const workflow = await createTestWorkflow();
    
    // Start execution
    const execution = await executionsService.createExecution(
      workflow.id,
      userId,
      ExecutionMode.MANUAL,
      { test: 'data' }
    );
    
    // Wait for completion
    await waitForExecutionCompletion(execution.id);
    
    // Verify results
    const completedExecution = await executionsService.getExecution(
      execution.id,
      userId
    );
    
    expect(completedExecution.status).toBe(ExecutionStatus.SUCCESS);
    expect(completedExecution.outputData).toBeDefined();
  });
});
```

## Monitoring and Analytics

### Execution Metrics
- Execution success/failure rates
- Average execution duration
- Node performance statistics
- Resource utilization metrics

### Real-time Monitoring
- Live execution dashboard
- Performance alerts
- Error rate monitoring
- Queue health monitoring

### Historical Analytics
- Execution trends over time
- Performance regression analysis
- Error pattern analysis
- Resource usage trends

## Future Enhancements

### Planned Features
- **Distributed Execution**: Multi-node execution support
- **Execution Scheduling**: Advanced scheduling capabilities
- **Workflow Versioning**: Version-aware execution
- **Execution Templates**: Reusable execution configurations
- **Advanced Debugging**: Step-by-step execution debugging
- **Execution Rollback**: Rollback failed executions

### Performance Improvements
- **Streaming Execution**: Stream large data sets
- **Parallel Processing**: Enhanced parallel execution
- **Resource Optimization**: Dynamic resource allocation
- **Caching Strategies**: Advanced result caching
- **Compression**: Compress execution data

---

**Last Updated**: $(date)
**Module Version**: 1.0.0
**Maintainer**: WeConnect Execution Team