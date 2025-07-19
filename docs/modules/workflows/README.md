# Workflows Module Documentation

## Overview

The Workflows Module provides the capability to define, manage, execute, and monitor workflows within WeConnect. This module integrates with various other systems to allow for complex automation and processing tasks.

## Key Concepts

- **Workflow**: A sequence of nodes forming a processing pipeline.
- **Node**: An atomic unit within a workflow.
- **Execution**: A single run of a workflow.

## Module Architecture

### Domain Layer

#### Workflow Entity

Represents the core structure of a workflow with metadata and relationships to nodes and executions.

```typescript
@Entity('workflows')
export class Workflow extends BaseEntity {
  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: WorkflowStatus,
    default: WorkflowStatus.DRAFT,
  })
  status: WorkflowStatus;

  @Column({ type: 'jsonb', default: {} })
  configuration: Record<string, any>;

  @Column({ default: false })
  isActive: boolean;

  @Column({ default: 0 })
  executionCount: number;

  @Column({ type: 'timestamp with time zone', nullable: true })
  lastExecutedAt?: Date;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Organization, (org) => org.workflows)
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @OneToMany(() => WorkflowNode, (node) => node.workflow, { cascade: true })
  nodes: WorkflowNode[];

  @OneToMany(() => WorkflowExecution, (execution) => execution.workflow)
  executions: WorkflowExecution[];

  @OneToMany(() => WorkflowVersion, (version) => version.workflow)
  versions: WorkflowVersion[];
}
```

### Application Layer

#### Workflow Execution Service

Handles the execution of workflows, managing node processing, data flow, and execution lifecycle.

```typescript
@Injectable()
export class WorkflowExecutionService {
  async startExecution(
    workflowId: string,
    userId: string,
    mode: ExecutionMode = ExecutionMode.MANUAL,
    inputData?: Record<string, any>,
    timeout = 300000, // Default: 5 minutes
  ): Promise<WorkflowExecution> {
    // Execution initialization and queueing...
  }

  async executeWorkflow(
    workflow: Workflow,
    executionId: string,
    inputData?: Record<string, any>,
    timeout = 300000,
  ): Promise<Record<string, any>> {
    // Core execution logic...
  }

  private async executeWorkflowInternal(
    workflow: Workflow,
    executionId: string,
    inputData?: Record<string, any>,
  ): Promise<Record<string, any>> {
    // Internal execution flow...
  }
}
```

### Infrastructure Layer

#### Workflow Queue Module

Utilizes Bull/BullMQ for background task processing related to workflow execution.

### Presentation Layer

#### Workflows Controller

Handles HTTP requests for managing workflows.

**Endpoints**:
- `GET /workflows` - List workflows
- `POST /workflows` - Create a new workflow
- `GET /workflows/:id` - Retrieve a specific workflow
- `PUT /workflows/:id` - Update a specific workflow
- `DELETE /workflows/:id` - Delete a specific workflow

## Workflow Execution Flow

1. **Trigger Event**: Initiation point (manual, webhook, cron, etc.)
2. **Queue Task**: Add execution job to the processing queue
3. **Node Execution**: Sequential/parallel node execution
4. **Data Flow**: Pass data between nodes
5. **Completion/Fail**: Finalize execution, log results

## Testing and Validation

### Unit Tests
- Node processing logic
- Execution lifecycle methods
- Data transformation utilities

### Integration Tests
- Complete workflow execution scenarios
- Multi-node interaction
- Error handling and retries

### Example Test

```typescript
describe('WorkflowExecutionService', () => {
  let service: WorkflowExecutionService;
  let workflowRepository: Repository<Workflow>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkflowExecutionService,
        {
          provide: getRepositoryToken(Workflow),
          useValue: mockRepository,
        },
      ],
    }).compile();
    service = module.get<WorkflowExecutionService>(WorkflowExecutionService);
    workflowRepository = module.get<Repository<Workflow>>(getRepositoryToken(Workflow));
  });

  describe('startExecution', () => {
    it('should initialize and queue a workflow execution', async () => {
      // Setup and assertions...
    });
  });
});
```

## Configuration

### Environment Variables

- `WORKFLOW_EXECUTION_QUEUE`: Name of the queue for workflow executions
- `WORKFLOW_NODE_QUEUE`: Name of the queue for node executions

### Module Configuration

```typescript
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Workflow,
      WorkflowNode,
      WorkflowNodeConnection,
      WorkflowExecution,
    ]),
    WorkflowQueueModule,
    HttpModule,
  ],
  controllers: [WorkflowsController, WorkflowExecutionsController],
  providers: [
    WorkflowsService,
    WorkflowExecutionService,
  ],
})
export class WorkflowsModule {}
```

## Monitoring and Observability

- **Execution Logs**: Detailed logging of all workflow executions
- **Metrics**: Execution times, success rates, error occurrences
- **Alerts**: Notification of failed executions and anomalies

## Future Enhancements

- **Dynamic Node Integration**: Support for additional node types with customizable behavior
- **Execution Visualizer**: Detailed GUI representation of execution paths
- **Error Recovery**: Automated rollback and compensation for failed executions
- **Version Control**: Implement version tracking for workflows and nodes

## Conclusion

The Workflows Module is a vital part of WeConnect, enabling users to automate complex processes and tasks. Through a robust architecture and comprehensive execution framework, it supports scalability, flexibility, and reliability in managing workflows.
