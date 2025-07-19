import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import {
  Execution,
  ExecutionStatus,
  ExecutionMode,
} from '../../domain/entities/execution.entity';
import {
  ExecutionLog,
  LogLevel,
} from '../../domain/entities/execution-log.entity';
import { Workflow } from '../../../workflows/domain/entities/workflow.entity';
import {
  WorkflowNode,
  NodeType,
} from '../../../workflows/domain/entities/workflow-node.entity';
import { StartExecutionDto } from '../../presentation/dto/start-execution.dto';
import { StartExecutionUseCase } from '../use-cases/start-execution.use-case';
import { RetryService, RetryConfig } from './retry.service';
import { CircuitBreakerService } from './circuit-breaker.service';
import { PerformanceMonitorService } from './performance-monitor.service';
import { ExecutionEventService } from '../../infrastructure/websocket/execution-event.service';

@Injectable()
export class ExecutionsService {
  private readonly logger = new Logger(ExecutionsService.name);
  private readonly executionLimits = new Map<string, number>(); // userId -> concurrent limit
  private readonly activeExecutions = new Map<string, Set<string>>(); // userId -> executionIds

  constructor(
    @InjectRepository(Execution)
    private readonly executionRepository: Repository<Execution>,
    @InjectRepository(ExecutionLog)
    private readonly executionLogRepository: Repository<ExecutionLog>,
    @InjectRepository(Workflow)
    private readonly workflowRepository: Repository<Workflow>,
    @InjectRepository(WorkflowNode)
    private readonly workflowNodeRepository: Repository<WorkflowNode>,
    @InjectQueue('execution-queue')
    private readonly executionQueue: Queue,
    private readonly retryService: RetryService,
    private readonly circuitBreakerService: CircuitBreakerService,
    private readonly performanceMonitor: PerformanceMonitorService,
    private readonly executionEventService: ExecutionEventService,
  ) {
    // Initialize circuit breakers for different services
    this.initializeCircuitBreakers();

    // Set default execution limits
    this.setDefaultExecutionLimits();
  }

  async startExecution(
    workflowId: string,
    startExecutionDto: StartExecutionDto,
    userId: string,
  ): Promise<Execution> {
    // Check execution limits
    await this.checkExecutionLimits(userId);

    // Check system resources
    if (this.performanceMonitor.isResourceConstrained()) {
      throw new BadRequestException('System is under high load, please try again later');
    }

    const workflow = await this.workflowRepository.findOne({
      where: { id: workflowId, userId },
      relations: ['nodes'],
    });

    if (!workflow) {
      throw new NotFoundException('Workflow not found');
    }

    if (!workflow.isActive) {
      throw new BadRequestException('Workflow is not active');
    }

    // Create execution record
    const execution = this.executionRepository.create({
      workflowId,
      userId,
      mode: startExecutionDto.mode || ExecutionMode.MANUAL,
      inputData: startExecutionDto.inputData || {},
      status: ExecutionStatus.PENDING,
    });

    const savedExecution = await this.executionRepository.save(execution);

    // Track active execution
    this.trackActiveExecution(userId, savedExecution.id);

    // Start performance monitoring
    this.performanceMonitor.startExecutionMonitoring(savedExecution.id);

    // Log execution start
    await this.addLog(
      savedExecution.id,
      LogLevel.INFO,
      'Execution started',
      undefined,
      'System',
    );

    // Emit real-time event
    this.executionEventService.emitExecutionStarted(savedExecution.id, workflowId, userId);

    // Queue execution with priority based on mode
    const priority = startExecutionDto.mode === ExecutionMode.MANUAL ? 1 : 0;
    await this.executionQueue.add('execute-workflow', {
      executionId: savedExecution.id,
      workflowId,
      userId,
    }, { priority });

    return savedExecution;
  }

  async findAll(userId: string): Promise<Execution[]> {
    return this.executionRepository.find({
      where: { userId },
      relations: ['workflow'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Execution> {
    const execution = await this.executionRepository.findOne({
      where: { id },
      relations: ['workflow', 'logs', 'user'],
    });

    if (!execution) {
      throw new NotFoundException('Execution not found');
    }

    return execution;
  }

  async getExecutionLogs(executionId: string): Promise<ExecutionLog[]> {
    return this.executionLogRepository.find({
      where: { executionId },
      order: { createdAt: 'ASC' },
    });
  }

  async cancelExecution(id: string, userId: string): Promise<Execution> {
    const execution = await this.findOne(id);

    if (execution.userId !== userId) {
      throw new BadRequestException('You can only cancel your own executions');
    }

    if (execution.isCompleted) {
      throw new BadRequestException('Cannot cancel completed execution');
    }

    execution.status = ExecutionStatus.CANCELLED;
    execution.finishedAt = new Date();
    execution.duration = execution.startedAt
      ? Date.now() - execution.startedAt.getTime()
      : 0;

    await this.executionRepository.save(execution);
    await this.addLog(id, LogLevel.INFO, 'Execution cancelled by user');

    return execution;
  }

  async executeWorkflow(executionId: string): Promise<void> {
    const execution = await this.findOne(executionId);
    const circuitKey = `workflow:${execution.workflowId}`;

    try {
      // Execute with circuit breaker protection
      await this.circuitBreakerService.execute(
        circuitKey,
        () => this.executeWorkflowInternal(execution),
        () => this.handleWorkflowFallback(execution),
      );
    } catch (error) {
      this.logger.error(`Workflow execution failed for ${executionId}:`, error);
      await this.handleExecutionFailure(execution, error);
    } finally {
      // Clean up tracking
      this.untrackActiveExecution(execution.userId, executionId);

      // End performance monitoring
      const metrics = this.performanceMonitor.endExecutionMonitoring(executionId);
      if (metrics) {
        this.executionEventService.emitExecutionMetrics({
          executionId,
          metrics: {
            executionTime: metrics.duration,
            memoryUsage: metrics.memoryUsage.rss,
            queueTime: metrics.queueTime,
          },
          timestamp: new Date(),
        });
      }
    }
  }

  private async executeWorkflowInternal(execution: Execution): Promise<void> {
    // Update status to running
    execution.status = ExecutionStatus.RUNNING;
    execution.startedAt = new Date();
    await this.executionRepository.save(execution);

    // Emit real-time update
    this.executionEventService.emitExecutionUpdate({
      executionId: execution.id,
      status: ExecutionStatus.RUNNING,
      progress: 0,
      timestamp: new Date(),
    });

    await this.addLog(
      execution.id,
      LogLevel.INFO,
      'Workflow execution started',
    );

    // Get workflow nodes ordered by execution order
    const nodes = await this.workflowNodeRepository.find({
      where: { workflowId: execution.workflowId, isEnabled: true },
      order: { executionOrder: 'ASC' },
    });

    if (nodes.length === 0) {
      throw new Error('No enabled nodes found in workflow');
    }

    let currentData = execution.inputData;

    // Execute each node with retry logic
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const progress = Math.round(((i + 1) / nodes.length) * 100);

      execution.currentNodeId = node.id;
      execution.progress = progress;
      await this.executionRepository.save(execution);

      // Emit progress update
      this.executionEventService.emitExecutionUpdate({
        executionId: execution.id,
        progress,
        currentNodeId: node.id,
        timestamp: new Date(),
      });

      await this.addLog(
        execution.id,
        LogLevel.INFO,
        `Executing node: ${node.name}`,
        node.id,
        node.name,
      );

      // Execute node with retry and monitoring
      currentData = await this.executeNodeWithRetry(node, currentData, execution.id);

      await this.addLog(
        execution.id,
        LogLevel.INFO,
        `Node executed successfully`,
        node.id,
        node.name,
        { outputData: currentData },
      );
    }

    // Mark as completed
    execution.status = ExecutionStatus.COMPLETED;
    execution.outputData = currentData;
    execution.finishedAt = new Date();
    execution.duration = execution.startedAt
      ? Date.now() - execution.startedAt.getTime()
      : 0;
    execution.progress = 100;
    execution.currentNodeId = undefined;

    await this.executionRepository.save(execution);

    // Emit completion event
    this.executionEventService.emitExecutionUpdate({
      executionId: execution.id,
      status: ExecutionStatus.COMPLETED,
      progress: 100,
      duration: execution.duration,
      timestamp: new Date(),
    });

    this.executionEventService.emitExecutionCompleted(
      execution.id,
      execution.userId,
      execution.outputData,
    );

    await this.addLog(
      execution.id,
      LogLevel.INFO,
      'Workflow execution completed successfully',
    );

    // Update workflow execution stats
    await this.workflowRepository.update(execution.workflowId, {
      executionCount: () => 'execution_count + 1',
      lastExecutedAt: new Date(),
    });
  }

  private async executeNode(
    node: WorkflowNode,
    inputData: any,
    executionId: string,
  ): Promise<any> {
    const startTime = Date.now();

    // Simple node execution logic (will be expanded later)
    switch (node.type) {
      case NodeType.TRIGGER:
        return { ...inputData, triggered: true, timestamp: new Date() };

      case NodeType.HTTP_REQUEST:
        // Simulate HTTP request
        await this.delay(1000); // Simulate request time
        return {
          ...inputData,
          httpResponse: { status: 200, data: 'Mock response' },
        };

      case NodeType.EMAIL:
        // Simulate email sending
        await this.delay(500);
        return {
          ...inputData,
          emailSent: true,
          recipient: inputData.email || 'test@example.com',
        };

      case NodeType.CONDITION:
        // Simple condition check
        const conditionResult = inputData.value > 10; // Simple condition
        return { ...inputData, conditionResult };

      case NodeType.DELAY:
        const delayMs = node.configuration?.delayMs || 1000;
        await this.delay(delayMs);
        return { ...inputData, delayed: true };

      default:
        return { ...inputData, processed: true };
    }
  }

  private async addLog(
    executionId: string,
    level: LogLevel,
    message: string,
    nodeId?: string,
    nodeName?: string,
    data?: any,
  ): Promise<void> {
    const log = this.executionLogRepository.create({
      executionId,
      level,
      message,
      nodeId,
      nodeName,
      data: data || {},
    });

    await this.executionLogRepository.save(log);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async executeNodeWithRetry(
    node: WorkflowNode,
    inputData: any,
    executionId: string,
  ): Promise<any> {
    // Start node monitoring
    this.performanceMonitor.startNodeMonitoring(executionId, node.id);

    try {
      // Get retry configuration based on node type
      const retryConfig = this.getRetryConfigForNode(node);

      const result = await this.retryService.executeWithRetry(
        () => this.executeNode(node, inputData, executionId),
        retryConfig,
        `${node.type}:${node.name}`,
      );

      if (!result.success) {
        throw result.error || new Error('Node execution failed');
      }

      return result.result;
    } finally {
      // End node monitoring
      const metrics = this.performanceMonitor.endNodeMonitoring(executionId, node.id);
      if (metrics) {
        this.executionEventService.emitExecutionMetrics({
          executionId,
          nodeId: node.id,
          metrics: {
            executionTime: metrics.duration,
            memoryUsage: metrics.memoryUsage.rss,
          },
          timestamp: new Date(),
        });
      }
    }
  }

  private getRetryConfigForNode(node: WorkflowNode): RetryConfig {
    switch (node.type) {
      case NodeType.HTTP_REQUEST:
        return RetryService.NETWORK_CONFIG;
      case NodeType.EMAIL:
      case NodeType.SLACK:
      case NodeType.DISCORD:
        return RetryService.API_CONFIG;
      default:
        return RetryService.DEFAULT_CONFIG;
    }
  }

  private async handleWorkflowFallback(execution: Execution): Promise<void> {
    this.logger.warn(`Using fallback for workflow ${execution.workflowId}`);

    execution.status = ExecutionStatus.FAILED;
    execution.errorMessage = 'Circuit breaker activated - workflow temporarily unavailable';
    execution.finishedAt = new Date();
    execution.duration = execution.startedAt
      ? Date.now() - execution.startedAt.getTime()
      : 0;

    await this.executionRepository.save(execution);

    this.executionEventService.emitExecutionFailed(
      execution.id,
      execution.userId,
      'Circuit breaker activated',
    );
  }

  private async handleExecutionFailure(execution: Execution, error: Error): Promise<void> {
    execution.status = ExecutionStatus.FAILED;
    execution.errorMessage = error.message;
    execution.errorStack = error.stack;
    execution.finishedAt = new Date();
    execution.duration = execution.startedAt
      ? Date.now() - execution.startedAt.getTime()
      : 0;
    execution.currentNodeId = undefined;

    await this.executionRepository.save(execution);

    // Emit failure event
    this.executionEventService.emitExecutionUpdate({
      executionId: execution.id,
      status: ExecutionStatus.FAILED,
      error: error.message,
      duration: execution.duration,
      timestamp: new Date(),
    });

    this.executionEventService.emitExecutionFailed(
      execution.id,
      execution.userId,
      error.message,
    );

    await this.addLog(
      execution.id,
      LogLevel.ERROR,
      `Workflow execution failed: ${error.message}`,
    );
  }

  private async checkExecutionLimits(userId: string): Promise<void> {
    const limit = this.executionLimits.get(userId) || 10; // Default limit
    const activeCount = this.activeExecutions.get(userId)?.size || 0;

    if (activeCount >= limit) {
      throw new BadRequestException(
        `Execution limit reached. Maximum ${limit} concurrent executions allowed.`,
      );
    }
  }

  private trackActiveExecution(userId: string, executionId: string): void {
    if (!this.activeExecutions.has(userId)) {
      this.activeExecutions.set(userId, new Set());
    }
    this.activeExecutions.get(userId)!.add(executionId);
  }

  private untrackActiveExecution(userId: string, executionId: string): void {
    const userExecutions = this.activeExecutions.get(userId);
    if (userExecutions) {
      userExecutions.delete(executionId);
      if (userExecutions.size === 0) {
        this.activeExecutions.delete(userId);
      }
    }
  }

  private initializeCircuitBreakers(): void {
    // Register circuit breakers for different services
    this.circuitBreakerService.registerCircuit(
      'http-requests',
      CircuitBreakerService.API_CONFIG,
    );

    this.circuitBreakerService.registerCircuit(
      'email-service',
      CircuitBreakerService.API_CONFIG,
    );

    this.circuitBreakerService.registerCircuit(
      'database',
      CircuitBreakerService.DATABASE_CONFIG,
    );
  }

  private setDefaultExecutionLimits(): void {
    // Set default execution limits (can be configured per user/organization)
    // This would typically come from a configuration service or database
  }

  // New methods for enhanced monitoring
  async getExecutionMetrics(executionId: string) {
    const execution = await this.findOne(executionId);
    const logs = await this.getExecutionLogs(executionId);
    const performanceMetrics = this.performanceMonitor.getExecutionMetrics(executionId);

    return {
      execution,
      logs,
      performanceMetrics,
      systemMetrics: this.performanceMonitor.collectSystemMetrics(),
    };
  }

  async getSystemHealth() {
    return {
      systemMetrics: this.performanceMonitor.collectSystemMetrics(),
      circuitBreakers: this.circuitBreakerService.getAllStats(),
      activeExecutions: this.activeExecutions.size,
      averageExecutionTime: this.performanceMonitor.getAverageExecutionTime(),
      throughput: this.performanceMonitor.getThroughput(),
      memoryPressure: this.performanceMonitor.getMemoryPressure(),
      isResourceConstrained: this.performanceMonitor.isResourceConstrained(),
    };
  }

  async pauseExecution(id: string, userId: string): Promise<Execution> {
    const execution = await this.findOne(id);

    if (execution.userId !== userId) {
      throw new BadRequestException('You can only pause your own executions');
    }

    if (execution.status !== ExecutionStatus.RUNNING) {
      throw new BadRequestException('Can only pause running executions');
    }

    // Implementation would depend on your queue system
    // For now, we'll mark it as paused in the database
    execution.status = ExecutionStatus.PENDING; // Using PENDING as paused state
    await this.executionRepository.save(execution);

    await this.addLog(id, LogLevel.INFO, 'Execution paused by user');

    this.executionEventService.emitExecutionUpdate({
      executionId: id,
      status: ExecutionStatus.PENDING,
      timestamp: new Date(),
    });

    return execution;
  }

  async resumeExecution(id: string, userId: string): Promise<Execution> {
    const execution = await this.findOne(id);

    if (execution.userId !== userId) {
      throw new BadRequestException('You can only resume your own executions');
    }

    if (execution.status !== ExecutionStatus.PENDING) {
      throw new BadRequestException('Can only resume paused executions');
    }

    // Re-queue the execution
    await this.executionQueue.add('execute-workflow', {
      executionId: id,
      workflowId: execution.workflowId,
      userId,
      resume: true,
    });

    await this.addLog(id, LogLevel.INFO, 'Execution resumed by user');

    return execution;
  }
}