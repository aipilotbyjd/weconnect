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
import { CircuitBreakerService } from '../../../executions/application/services/circuit-breaker.service';
import { PerformanceMonitorService } from '../../../executions/application/services/performance-monitor.service';
import { ExecutionEventService } from '../../../executions/infrastructure/websocket/execution-event.service';
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
    private circuitBreakerService: CircuitBreakerService,
    private performanceMonitor: PerformanceMonitorService,
    private executionEventService: ExecutionEventService,
  ) {
    // Initialize circuit breakers for scheduling services
    this.initializeCircuitBreakers();
  }

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
    
    const circuitKey = `scheduled-workflow:${scheduledWorkflow.workflowId}`;
    const startTime = Date.now();

    try {
      // Start performance monitoring
      this.performanceMonitor.startExecutionMonitoring(
        `scheduled-${scheduledWorkflow.id}`,
        0 // No queue time for scheduled executions
      );

      // Execute with circuit breaker protection
      const job = await this.circuitBreakerService.execute(
        circuitKey,
        async () => {
          return await this.workflowQueue.add(
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
        },
        async () => {
          // Fallback: Log the failure and increment failure count
          this.logger.warn(`Circuit breaker activated for scheduled workflow ${scheduledWorkflow.id}`);
          await this.scheduledWorkflowRepository.update(scheduledWorkflow.id, {
            failureCount: () => 'failure_count + 1',
          });
          return null;
        }
      );

      if (job) {
        // Emit real-time event for scheduled execution
        this.executionEventService.emitExecutionStarted(
          job.id.toString(),
          scheduledWorkflow.workflowId,
          scheduledWorkflow.userId
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

        // End performance monitoring
        const metrics = this.performanceMonitor.endExecutionMonitoring(`scheduled-${scheduledWorkflow.id}`);
        if (metrics) {
          this.executionEventService.emitExecutionMetrics({
            executionId: job.id.toString(),
            metrics: {
              executionTime: metrics.duration,
              memoryUsage: metrics.memoryUsage.rss,
              queueTime: 0,
            },
            timestamp: new Date(),
          });
        }

        this.logger.log(`Successfully queued scheduled workflow ${scheduledWorkflow.name} (Job ID: ${job.id})`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to execute scheduled workflow ${scheduledWorkflow.id}:`,
        error,
      );

      // Emit failure event
      this.executionEventService.emitExecutionFailed(
        `scheduled-${scheduledWorkflow.id}`,
        scheduledWorkflow.userId,
        error.message
      );

      await this.scheduledWorkflowRepository.update(scheduledWorkflow.id, {
        failureCount: () => 'failure_count + 1',
      });

      // End performance monitoring on error
      this.performanceMonitor.endExecutionMonitoring(`scheduled-${scheduledWorkflow.id}`);
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

  private initializeCircuitBreakers() {
    // Register circuit breakers for scheduled workflow services
    this.circuitBreakerService.registerCircuit(
      'scheduled-workflow-queue',
      CircuitBreakerService.DEFAULT_CONFIG,
    );
    
    this.circuitBreakerService.registerCircuit(
      'scheduled-workflow-database',
      CircuitBreakerService.DATABASE_CONFIG,
    );
  }

  // Enhanced methods for monitoring and analytics
  async getSchedulingMetrics(): Promise<any> {
    const activeSchedules = await this.scheduledWorkflowRepository.count({
      where: { status: ScheduleStatus.ACTIVE },
    });

    const pausedSchedules = await this.scheduledWorkflowRepository.count({
      where: { status: ScheduleStatus.PAUSED },
    });

    const totalExecutions = await this.scheduledWorkflowRepository
      .createQueryBuilder('schedule')
      .select('SUM(schedule.executionCount)', 'total')
      .getRawOne();

    const totalFailures = await this.scheduledWorkflowRepository
      .createQueryBuilder('schedule')
      .select('SUM(schedule.failureCount)', 'total')
      .getRawOne();

    return {
      activeSchedules,
      pausedSchedules,
      totalExecutions: parseInt(totalExecutions.total) || 0,
      totalFailures: parseInt(totalFailures.total) || 0,
      systemMetrics: this.performanceMonitor.collectSystemMetrics(),
      circuitBreakers: this.circuitBreakerService.getAllStats(),
    };
  }

  async getUpcomingExecutions(limit: number = 10): Promise<any[]> {
    const activeSchedules = await this.scheduledWorkflowRepository.find({
      where: { status: ScheduleStatus.ACTIVE },
      relations: ['workflow'],
      order: { nextExecutionAt: 'ASC' },
      take: limit,
    });

    return activeSchedules.map(schedule => ({
      id: schedule.id,
      name: schedule.name,
      workflowName: schedule.workflow?.name,
      nextExecutionAt: schedule.nextExecutionAt,
      cronExpression: schedule.cronExpression,
      timezone: schedule.timezone,
    }));
  }

  async pauseAllSchedules(): Promise<void> {
    this.logger.warn('Pausing all scheduled workflows due to system maintenance');
    
    const activeSchedules = await this.scheduledWorkflowRepository.find({
      where: { status: ScheduleStatus.ACTIVE },
    });

    for (const schedule of activeSchedules) {
      await this.pauseSchedule(schedule.id);
    }
  }

  async resumeAllSchedules(): Promise<void> {
    this.logger.log('Resuming all paused scheduled workflows');
    
    const pausedSchedules = await this.scheduledWorkflowRepository.find({
      where: { status: ScheduleStatus.PAUSED },
    });

    for (const schedule of pausedSchedules) {
      await this.resumeSchedule(schedule.id);
    }
  }
}