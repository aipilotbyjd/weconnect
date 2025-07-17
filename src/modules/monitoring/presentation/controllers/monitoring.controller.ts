import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { MetricsService } from '../../application/services/metrics.service';
import { ExecutionCleanupService } from '../../../workflows/application/services/execution-cleanup.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import {
  WORKFLOW_EXECUTION_QUEUE,
  WORKFLOW_NODE_QUEUE,
} from '../../../workflows/infrastructure/queues/constants';

@ApiTags('monitoring')
@Controller('monitoring')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class MonitoringController {
  constructor(
    private readonly metricsService: MetricsService,
    private executionCleanupService: ExecutionCleanupService,
    @InjectQueue(WORKFLOW_EXECUTION_QUEUE)
    private workflowQueue: Queue,
    @InjectQueue(WORKFLOW_NODE_QUEUE)
    private nodeQueue: Queue,
  ) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  async getDashboardStats(@Query('userId') userId?: string) {
    return this.metricsService.getDashboardStats(userId);
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check for the application' })
  @ApiResponse({ status: 200, description: 'Application is healthy' })
  async healthCheck() {
    const [workflowQueueHealth, nodeQueueHealth, executionStats] =
      await Promise.all([
        this.getQueueHealth(this.workflowQueue, 'workflow'),
        this.getQueueHealth(this.nodeQueue, 'node'),
        this.executionCleanupService.getExecutionStatistics(),
      ]);

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      queues: {
        workflow: workflowQueueHealth,
        node: nodeQueueHealth,
      },
      executions: executionStats,
    };
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Get detailed application metrics' })
  @ApiResponse({ status: 200, description: 'Application metrics' })
  async getMetrics() {
    const [workflowJobs, nodeJobs, executionStats] = await Promise.all([
      this.getDetailedQueueMetrics(this.workflowQueue, 'workflow'),
      this.getDetailedQueueMetrics(this.nodeQueue, 'node'),
      this.executionCleanupService.getExecutionStatistics(),
    ]);

    return {
      timestamp: new Date().toISOString(),
      queues: {
        workflow: workflowJobs,
        node: nodeJobs,
      },
      executions: executionStats,
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        version: process.version,
        platform: process.platform,
      },
    };
  }

  @Get('executions/cleanup')
  @ApiOperation({ summary: 'Force cleanup of stale executions' })
  @ApiResponse({ status: 200, description: 'Cleanup completed' })
  async forceCleanup() {
    await this.executionCleanupService.cleanupStaleExecutions();
    return {
      status: 'cleanup completed',
      timestamp: new Date().toISOString(),
    };
  }

  private async getQueueHealth(queue: Queue, name: string) {
    try {
      const [waiting, active, completed, failed] = await Promise.all([
        queue.getWaiting(),
        queue.getActive(),
        queue.getCompleted(),
        queue.getFailed(),
      ]);

      return {
        name,
        status: 'healthy',
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
      };
    } catch (error) {
      return {
        name,
        status: 'unhealthy',
        error: error.message,
      };
    }
  }

  private async getDetailedQueueMetrics(queue: Queue, name: string) {
    try {
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        queue.getJobs(['waiting']),
        queue.getJobs(['active']),
        queue.getJobs(['completed'], 0, 100),
        queue.getJobs(['failed'], 0, 100),
        queue.getJobs(['delayed']),
      ]);

      const activeJobDetails = active.map((job) => ({
        id: job.id,
        name: job.name,
        data: job.data,
        progress: job.progress(),
        processedOn: job.processedOn,
      }));

      const failedJobDetails = failed.map((job) => ({
        id: job.id,
        name: job.name,
        failedReason: job.failedReason,
        finishedOn: job.finishedOn,
        attemptsMade: job.attemptsMade,
      }));

      return {
        name,
        counts: {
          waiting: waiting.length,
          active: active.length,
          completed: completed.length,
          failed: failed.length,
          delayed: delayed.length,
        },
        activeJobs: activeJobDetails,
        recentFailures: failedJobDetails.slice(0, 10),
      };
    } catch (error) {
      return {
        name,
        error: error.message,
      };
    }
  }
}
