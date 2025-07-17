import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ScheduledWorkflow,
  ScheduleStatus,
} from '../../domain/entities/scheduled-workflow.entity';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import {
  WORKFLOW_EXECUTION_QUEUE,
  WorkflowJobType,
} from '../../../workflows/infrastructure/queues/constants';
import { ExecutionMode } from '../../../workflows/domain/entities/workflow-execution.entity';
const cronParser = require('cron-parser');

@Injectable()
export class SchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    @InjectRepository(ScheduledWorkflow)
    private scheduledWorkflowRepository: Repository<ScheduledWorkflow>,
    private schedulerRegistry: SchedulerRegistry,
    @InjectQueue(WORKFLOW_EXECUTION_QUEUE)
    private workflowQueue: Queue,
  ) {}

  async onModuleInit() {
    this.logger.log('Initializing scheduled workflows...');
    await this.loadActiveSchedules();
  }

  onModuleDestroy() {
    this.logger.log('Cleaning up scheduled workflows...');
    this.removeAllSchedules();
  }

  private async loadActiveSchedules() {
    const activeSchedules = await this.scheduledWorkflowRepository.find({
      where: { status: ScheduleStatus.ACTIVE },
      relations: ['workflow'],
    });

    for (const schedule of activeSchedules) {
      try {
        await this.scheduleWorkflow(schedule);
        this.logger.log(
          `Loaded schedule: ${schedule.name} (${schedule.cronExpression})`,
        );
      } catch (error) {
        this.logger.error(`Failed to load schedule ${schedule.id}:`, error);
      }
    }
  }

  async scheduleWorkflow(scheduledWorkflow: ScheduledWorkflow) {
    const jobName = `scheduled-workflow-${scheduledWorkflow.id}`;

    // Remove existing job if any
    this.removeSchedule(jobName);

    // Calculate next execution time
    const nextExecution = this.getNextExecutionTime(
      scheduledWorkflow.cronExpression,
      scheduledWorkflow.timezone,
    );

    // Create cron job
    const job = new CronJob(
      scheduledWorkflow.cronExpression,
      async () => {
        await this.executeScheduledWorkflow(scheduledWorkflow);
      },
      null,
      true,
      scheduledWorkflow.timezone || 'UTC',
    );

    // Register the job
    this.schedulerRegistry.addCronJob(jobName, job);

    // Update next execution time
    if (nextExecution) {
      await this.scheduledWorkflowRepository.update(scheduledWorkflow.id, {
        nextExecutionAt: nextExecution,
      });
    }
  }

  private async executeScheduledWorkflow(scheduledWorkflow: ScheduledWorkflow) {
    this.logger.log(`Executing scheduled workflow: ${scheduledWorkflow.name}`);

    try {
      // Add workflow execution to queue
      const job = await this.workflowQueue.add(
        WorkflowJobType.EXECUTE_WORKFLOW,
        {
          workflowId: scheduledWorkflow.workflowId,
          userId: scheduledWorkflow.userId,
          inputData: scheduledWorkflow.inputData || {},
          mode: ExecutionMode.SCHEDULED,
          scheduledWorkflowId: scheduledWorkflow.id,
        },
        {
          priority: 0,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
        },
      );

      // Update execution stats
      const nextExecution = this.getNextExecutionTime(
        scheduledWorkflow.cronExpression,
        scheduledWorkflow.timezone,
      );

      const updates: any = {
        lastExecutionAt: new Date(),
        lastExecutionId: job.id.toString(),
        executionCount: () => 'execution_count + 1',
      };

      if (nextExecution) {
        updates.nextExecutionAt = nextExecution;
      }

      await this.scheduledWorkflowRepository.update(
        scheduledWorkflow.id,
        updates,
      );
    } catch (error) {
      this.logger.error(
        `Failed to execute scheduled workflow ${scheduledWorkflow.id}:`,
        error,
      );

      await this.scheduledWorkflowRepository.update(scheduledWorkflow.id, {
        failureCount: () => 'failure_count + 1',
      });
    }
  }

  removeSchedule(jobName: string) {
    try {
      if (this.schedulerRegistry.doesExist('cron', jobName)) {
        const job = this.schedulerRegistry.getCronJob(jobName);
        job.stop();
        this.schedulerRegistry.deleteCronJob(jobName);
      }
    } catch (error) {
      // Job doesn't exist, ignore
    }
  }

  private removeAllSchedules() {
    const jobs = this.schedulerRegistry.getCronJobs();
    jobs.forEach((job, name) => {
      if (name.startsWith('scheduled-workflow-')) {
        job.stop();
        this.schedulerRegistry.deleteCronJob(name);
      }
    });
  }

  private getNextExecutionTime(
    cronExpression: string,
    timezone?: string,
  ): Date | null {
    try {
      const options = timezone ? { tz: timezone } : {};
      const interval = cronParser.parseExpression(cronExpression, options);
      return interval.next().toDate();
    } catch (error) {
      this.logger.error(`Invalid cron expression: ${cronExpression}`, error);
      return null;
    }
  }

  async pauseSchedule(scheduledWorkflowId: string) {
    const jobName = `scheduled-workflow-${scheduledWorkflowId}`;
    this.removeSchedule(jobName);

    await this.scheduledWorkflowRepository.update(scheduledWorkflowId, {
      status: ScheduleStatus.PAUSED,
    });
  }

  async resumeSchedule(scheduledWorkflowId: string) {
    const schedule = await this.scheduledWorkflowRepository.findOne({
      where: { id: scheduledWorkflowId },
      relations: ['workflow'],
    });

    if (schedule) {
      schedule.status = ScheduleStatus.ACTIVE;
      await this.scheduledWorkflowRepository.save(schedule);
      await this.scheduleWorkflow(schedule);
    }
  }
}
