import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  WorkflowExecutionLog,
  LogLevel,
} from '../../../domain/entities/workflow-execution-log.entity';
import { AlertingService } from '../../../../monitoring/application/services/alerting.service';

export const DEAD_LETTER_QUEUE = 'dead-letter-queue';

interface DeadLetterJobData {
  originalQueue: string;
  originalJobId: string;
  failedAt: Date;
  error: any;
  data: any;
  attempts: number;
}

@Processor(DEAD_LETTER_QUEUE)
export class DeadLetterQueueProcessor {
  private readonly logger = new Logger(DeadLetterQueueProcessor.name);

  constructor(
    @InjectRepository(WorkflowExecutionLog)
    private logRepository: Repository<WorkflowExecutionLog>,
    private alertingService: AlertingService,
  ) {}

  @Process()
  async handleDeadLetterJob(job: Job<DeadLetterJobData>) {
    const { originalQueue, originalJobId, error, data, attempts } = job.data;

    this.logger.error(
      `Processing dead letter job from queue ${originalQueue}, job ${originalJobId}`,
      error,
    );

    try {
      // Log the failure
      if (data.executionId) {
        await this.logRepository.save({
          executionId: data.executionId,
          level: LogLevel.ERROR,
          message: `Job failed after ${attempts} attempts and moved to dead letter queue`,
          data: {
            originalQueue,
            originalJobId,
            error: {
              message: error.message,
              stack: error.stack,
              name: error.name,
            },
            jobData: data,
          },
        });
      }

      // Send alert for critical failures
      if (data.priority === 1 || attempts >= 5) {
        await this.alertingService.sendAlert({
          type: 'CRITICAL_JOB_FAILURE',
          title: `Critical job failure in ${originalQueue}`,
          message: `Job ${originalJobId} failed after ${attempts} attempts: ${error.message}`,
          metadata: {
            queue: originalQueue,
            jobId: originalJobId,
            executionId: data.executionId,
            workflowId: data.workflowId,
            error: error.message,
          },
        });
      }

      // Store for analysis
      await this.storeForAnalysis(job.data);

      return { processed: true };
    } catch (processError) {
      this.logger.error('Failed to process dead letter job:', processError);
      throw processError;
    }
  }

  private async storeForAnalysis(data: DeadLetterJobData): Promise<void> {
    // In a real implementation, this would store to a persistent store
    // for later analysis and potential reprocessing
    this.logger.log(
      `Stored dead letter job for analysis: ${data.originalJobId}`,
    );
  }

  async reprocessDeadLetterJob(jobId: string): Promise<void> {
    const job = await this.getJob(jobId);

    if (!job) {
      throw new Error(`Dead letter job ${jobId} not found`);
    }

    // Re-queue to original queue with modified options
    const { originalQueue, data } = job.data;

    // This would need the queue service to re-queue
    this.logger.log(
      `Reprocessing dead letter job ${jobId} to queue ${originalQueue}`,
    );
  }

  private async getJob(jobId: string): Promise<Job<DeadLetterJobData> | null> {
    // Implementation would retrieve job from dead letter queue
    return null;
  }
}
