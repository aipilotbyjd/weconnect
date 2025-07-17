import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, In } from 'typeorm';
import {
  WorkflowExecution,
  ExecutionStatus,
} from '../../domain/entities/workflow-execution.entity';
import { WorkflowExecutionService } from './workflow-execution.service';

@Injectable()
export class ExecutionCleanupService {
  private readonly logger = new Logger(ExecutionCleanupService.name);

  constructor(
    @InjectRepository(WorkflowExecution)
    private executionRepository: Repository<WorkflowExecution>,
    private workflowExecutionService: WorkflowExecutionService,
  ) {}

  @Cron('0 */6 * * *') // Every 6 hours
  async cleanupStaleExecutions() {
    this.logger.log('Starting cleanup of stale executions');

    const staleThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

    try {
      // Find stale running executions
      const staleExecutions = await this.executionRepository.find({
        where: {
          status: In([ExecutionStatus.RUNNING, ExecutionStatus.PENDING]),
          createdAt: LessThan(staleThreshold),
        },
      });

      this.logger.log(
        `Found ${staleExecutions.length} stale executions to cleanup`,
      );

      for (const execution of staleExecutions) {
        try {
          await this.workflowExecutionService.cancelExecution(execution.id);
          this.logger.log(`Cancelled stale execution ${execution.id}`);
        } catch (error) {
          this.logger.error(
            `Failed to cancel execution ${execution.id}:`,
            error,
          );
        }
      }

      this.logger.log('Stale execution cleanup completed');
    } catch (error) {
      this.logger.error('Error during stale execution cleanup:', error);
    }
  }

  @Cron('0 2 * * *') // Daily at 2 AM
  async cleanupOldExecutionLogs() {
    this.logger.log('Starting cleanup of old execution logs');

    const oldThreshold = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

    try {
      // Delete old completed executions
      const result = await this.executionRepository.delete({
        status: In([
          ExecutionStatus.SUCCESS,
          ExecutionStatus.FAILED,
          ExecutionStatus.CANCELLED,
        ]),
        finishedAt: LessThan(oldThreshold),
      });

      this.logger.log(`Deleted ${result.affected} old execution records`);
    } catch (error) {
      this.logger.error('Error during old execution log cleanup:', error);
    }
  }

  async forceCleanupExecution(executionId: string): Promise<void> {
    this.logger.log(`Force cleaning up execution ${executionId}`);

    try {
      await this.workflowExecutionService.cancelExecution(executionId);
      this.logger.log(`Force cleanup completed for execution ${executionId}`);
    } catch (error) {
      this.logger.error(
        `Force cleanup failed for execution ${executionId}:`,
        error,
      );
      throw error;
    }
  }

  async getExecutionStatistics(): Promise<{
    running: number;
    pending: number;
    stale: number;
    total: number;
  }> {
    const staleThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [running, pending, stale, total] = await Promise.all([
      this.executionRepository.count({
        where: { status: ExecutionStatus.RUNNING },
      }),
      this.executionRepository.count({
        where: { status: ExecutionStatus.PENDING },
      }),
      this.executionRepository.count({
        where: {
          status: In([ExecutionStatus.RUNNING, ExecutionStatus.PENDING]),
          createdAt: LessThan(staleThreshold),
        },
      }),
      this.executionRepository.count(),
    ]);

    return { running, pending, stale, total };
  }
}
