import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WORKFLOW_EXECUTION_QUEUE, WorkflowJobType } from '../constants';
import {
  WorkflowExecution,
  ExecutionStatus,
} from '../../../domain/entities/workflow-execution.entity';
import { Workflow } from '../../../domain/entities/workflow.entity';
import { WorkflowExecutionService } from '../../../application/services/workflow-execution.service';
// Enhanced execution services
import { RetryService } from '../../../../executions/application/services/retry.service';
import { CircuitBreakerService } from '../../../../executions/application/services/circuit-breaker.service';
import { PerformanceMonitorService } from '../../../../executions/application/services/performance-monitor.service';
import { ExecutionEventService } from '../../../../executions/infrastructure/websocket/execution-event.service';

interface WorkflowExecutionJobData {
  executionId: string;
  workflowId: string;
  userId: string;
  inputData?: Record<string, any>;
  timeout?: number;
}

@Processor(WORKFLOW_EXECUTION_QUEUE)
export class WorkflowExecutionProcessor {
  private readonly logger = new Logger(WorkflowExecutionProcessor.name);

  constructor(
    @InjectRepository(WorkflowExecution)
    private executionRepository: Repository<WorkflowExecution>,
    @InjectRepository(Workflow)
    private workflowRepository: Repository<Workflow>,
    private workflowExecutionService: WorkflowExecutionService,
    private retryService: RetryService,
    private circuitBreakerService: CircuitBreakerService,
    private performanceMonitor: PerformanceMonitorService,
    private executionEventService: ExecutionEventService,
  ) {
    // Initialize circuit breakers for workflow execution
    this.initializeCircuitBreakers();
  }

  @Process(WorkflowJobType.EXECUTE_WORKFLOW)
  async handleExecuteWorkflow(job: Job<WorkflowExecutionJobData>) {
    const { executionId, workflowId, userId, inputData, timeout = 300000 } = job.data;
    const startTime = Date.now();
    const circuitKey = `workflow-execution:${workflowId}`;

    this.logger.log(`Starting workflow execution ${executionId} (Job: ${job.id})`);

    // Start performance monitoring
    const queueTime = startTime - job.timestamp;
    this.performanceMonitor.startExecutionMonitoring(executionId, queueTime);

    // Emit execution started event
    this.executionEventService.emitExecutionStarted(executionId, workflowId, userId);

    try {
      // Execute with circuit breaker and retry protection
      const result = await this.circuitBreakerService.execute(
        circuitKey,
        async () => {
          return await this.retryService.executeWithRetry(
            async () => {
              // Update execution status to running
              await this.executionRepository.update(executionId, {
                status: ExecutionStatus.RUNNING,
                startedAt: new Date(),
              });

              // Emit real-time status update
              this.executionEventService.emitExecutionUpdate({
                executionId,
                status: ExecutionStatus.RUNNING as any,
                progress: 0,
                timestamp: new Date(),
              });

              // Get workflow with nodes
              const workflow = await this.workflowRepository.findOne({
                where: { id: workflowId },
                relations: [
                  'nodes',
                  'nodes.outgoingConnections',
                  'nodes.incomingConnections',
                ],
              });

              if (!workflow) {
                throw new Error(`Workflow ${workflowId} not found`);
              }

              // Execute the workflow with timeout
              const executionResult = await this.workflowExecutionService.executeWorkflow(
                workflow,
                executionId,
                inputData,
                timeout,
              );

              return executionResult;
            },
            RetryService.DEFAULT_CONFIG,
            `workflow-execution:${executionId}`,
          );
        },
        async () => {
          // Fallback: Mark as failed due to circuit breaker
          this.logger.warn(`Circuit breaker activated for workflow ${workflowId}`);
          await this.executionRepository.update(executionId, {
            status: ExecutionStatus.FAILED,
            finishedAt: new Date(),
            error: {
              message: 'Circuit breaker activated - service temporarily unavailable',
              type: 'CIRCUIT_BREAKER',
            } as any,
          });
          return null;
        }
      );

      if (result && result.success) {
        // Update execution status to success
        const duration = Date.now() - startTime;
        await this.executionRepository.update(executionId, {
          status: ExecutionStatus.SUCCESS,
          finishedAt: new Date(),
          data: result.result,
        });

        // Emit completion events
        this.executionEventService.emitExecutionUpdate({
          executionId,
          status: ExecutionStatus.SUCCESS as any,
          progress: 100,
          duration,
          timestamp: new Date(),
        });

        this.executionEventService.emitExecutionCompleted(
          executionId,
          userId,
          result.result,
        );

        this.logger.log(
          `Workflow execution ${executionId} completed successfully in ${duration}ms`,
        );

        // Update job progress
        await job.progress(100);
        
        return result.result;
      } else {
        throw new Error(result?.error?.message || 'Workflow execution failed');
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Workflow execution ${executionId} failed after ${duration}ms:`, error);

      // Update execution status to failed
      await this.executionRepository.update(executionId, {
        status: ExecutionStatus.FAILED,
        finishedAt: new Date(),
        error: {
          message: error.message,
          stack: error.stack,
          duration,
        } as any,
      });

      // Emit failure events
      this.executionEventService.emitExecutionUpdate({
        executionId,
        status: ExecutionStatus.FAILED as any,
        error: error.message,
        duration,
        timestamp: new Date(),
      });

      this.executionEventService.emitExecutionFailed(
        executionId,
        userId,
        error.message,
      );

      throw error;
    } finally {
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

  @Process(WorkflowJobType.CANCEL_WORKFLOW)
  async handleCancelWorkflow(job: Job<{ executionId: string }>) {
    const { executionId } = job.data;
    this.logger.log(`Cancelling workflow execution ${executionId}`);

    await this.executionRepository.update(executionId, {
      status: ExecutionStatus.CANCELLED,
      finishedAt: new Date(),
    });

    // Cancel any pending node executions
    await this.workflowExecutionService.cancelExecution(executionId);
  }

  @Process(WorkflowJobType.RESUME_WORKFLOW)
  async handleResumeWorkflow(job: Job<WorkflowExecutionJobData>) {
    const { executionId } = job.data;
    this.logger.log(`Resuming workflow execution ${executionId}`);

    const execution = await this.executionRepository.findOne({
      where: { id: executionId },
      relations: ['workflow', 'workflow.nodes'],
    });

    if (!execution) {
      throw new Error(`Execution ${executionId} not found`);
    }

    await this.workflowExecutionService.resumeExecution(execution);
  }

  private initializeCircuitBreakers() {
    // Register circuit breakers for workflow execution services
    this.circuitBreakerService.registerCircuit(
      'workflow-execution-database',
      CircuitBreakerService.DATABASE_CONFIG,
    );
    
    this.circuitBreakerService.registerCircuit(
      'workflow-execution-service',
      CircuitBreakerService.DEFAULT_CONFIG,
    );
  }

  @Process('workflow-health-check')
  async handleHealthCheck(job: Job) {
    try {
      // Collect workflow execution metrics
      const activeExecutions = await this.executionRepository.count({
        where: { status: ExecutionStatus.RUNNING },
      });

      const recentFailures = await this.executionRepository.count({
        where: { 
          status: ExecutionStatus.FAILED,
          createdAt: new Date(Date.now() - 3600000), // Last hour
        },
      });

      const systemMetrics = this.performanceMonitor.collectSystemMetrics();
      const circuitBreakers = this.circuitBreakerService.getAllStats();

      this.logger.log(`Workflow Health Check: ${JSON.stringify({
        activeExecutions,
        recentFailures,
        memoryPressure: systemMetrics.memoryUsage.percentage,
        cpuUsage: systemMetrics.cpuUsage,
        circuitBreakersOpen: Array.from(circuitBreakers.values())
          .filter(stats => stats.state === 'open').length,
      })}`);

      return {
        activeExecutions,
        recentFailures,
        systemMetrics,
        circuitBreakers: Array.from(circuitBreakers.entries()),
      };
    } catch (error) {
      this.logger.error('Workflow health check failed:', error);
      throw error;
    }
  }
}