import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { ExecutionsService } from '../../application/services/executions.service';
import { PerformanceMonitorService } from '../../application/services/performance-monitor.service';
import { ExecutionEventService } from '../websocket/execution-event.service';

export interface ExecutionJobData {
  executionId: string;
  workflowId: string;
  userId: string;
  resume?: boolean;
  priority?: number;
}

@Processor('execution-queue')
export class ExecutionQueueProcessor {
  private readonly logger = new Logger(ExecutionQueueProcessor.name);

  constructor(
    private readonly executionsService: ExecutionsService,
    private readonly performanceMonitor: PerformanceMonitorService,
    private readonly executionEventService: ExecutionEventService,
  ) {}

  @Process('execute-workflow')
  async handleWorkflowExecution(job: Job<ExecutionJobData>) {
    const { executionId, workflowId, userId, resume } = job.data;
    const startTime = Date.now();

    this.logger.log(
      `Processing workflow execution job ${job.id} for execution ${executionId}`,
    );

    try {
      // Calculate queue time
      const queueTime = startTime - job.timestamp;
      
      // Update performance monitoring with queue time
      this.performanceMonitor.startExecutionMonitoring(executionId, queueTime);

      // Execute the workflow
      if (resume) {
        // Handle resume logic here
        this.logger.log(`Resuming execution ${executionId}`);
        // Implementation would depend on your specific resume requirements
      } else {
        await this.executionsService.executeWorkflow(executionId);
      }

      const duration = Date.now() - startTime;
      this.logger.log(
        `Completed workflow execution job ${job.id} in ${duration}ms`,
      );

      // Update job progress
      await job.progress(100);

    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `Failed workflow execution job ${job.id} after ${duration}ms:`,
        error,
      );

      // Emit failure event
      this.executionEventService.emitExecutionFailed(
        executionId,
        userId,
        error.message,
      );

      throw error; // Re-throw to mark job as failed
    }
  }

  @Process('cleanup-executions')
  async handleExecutionCleanup(job: Job) {
    this.logger.log('Starting execution cleanup job');

    try {
      // Clean up old performance metrics
      this.performanceMonitor.cleanup();

      // Additional cleanup logic can be added here
      // - Remove old execution logs
      // - Archive completed executions
      // - Clean up temporary files

      this.logger.log('Execution cleanup completed successfully');
    } catch (error) {
      this.logger.error('Execution cleanup failed:', error);
      throw error;
    }
  }

  @Process('health-check')
  async handleHealthCheck(job: Job) {
    try {
      const health = await this.executionsService.getSystemHealth();
      
      // Log system health metrics
      this.logger.log(`System Health Check: ${JSON.stringify({
        activeExecutions: health.activeExecutions,
        memoryPressure: health.memoryPressure,
        averageExecutionTime: health.averageExecutionTime,
        throughput: health.throughput,
        isResourceConstrained: health.isResourceConstrained,
      })}`);

      // You could emit health metrics to monitoring systems here
      
    } catch (error) {
      this.logger.error('Health check failed:', error);
      throw error;
    }
  }
}