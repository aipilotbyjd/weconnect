import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan } from 'typeorm';
import { ExecutionMetric } from '../../domain/entities/execution-metric.entity';
import { SystemMetric } from '../../domain/entities/system-metric.entity';
import * as os from 'os';

@Injectable()
export class MetricsService {
  constructor(
    @InjectRepository(ExecutionMetric)
    private executionMetricRepository: Repository<ExecutionMetric>,
    @InjectRepository(SystemMetric)
    private systemMetricRepository: Repository<SystemMetric>,
  ) {}

  async recordExecutionMetric(data: {
    workflowId: string;
    executionId: string;
    nodeId?: string;
    duration: number;
    itemsProcessed: number;
    success: boolean;
    errorMessage?: string;
    mode: string;
    userId: string;
    organizationId?: string;
  }): Promise<ExecutionMetric> {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return this.executionMetricRepository.save({
      ...data,
      memoryUsage: memoryUsage.heapUsed,
      cpuUsage: this.calculateCpuPercentage(cpuUsage),
    });
  }

  async getWorkflowMetrics(
    workflowId: string,
    timeRange: { start: Date; end: Date },
  ): Promise<{
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    averageDuration: number;
    medianDuration: number;
    p95Duration: number;
    totalItemsProcessed: number;
    errorRate: number;
    throughput: number;
  }> {
    const metrics = await this.executionMetricRepository.find({
      where: {
        workflowId,
        recordedAt: Between(timeRange.start, timeRange.end),
      },
    });

    if (metrics.length === 0) {
      return {
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        averageDuration: 0,
        medianDuration: 0,
        p95Duration: 0,
        totalItemsProcessed: 0,
        errorRate: 0,
        throughput: 0,
      };
    }

    const successfulExecutions = metrics.filter(m => m.success).length;
    const failedExecutions = metrics.filter(m => !m.success).length;
    const durations = metrics.map(m => m.duration).sort((a, b) => a - b);
    const totalDuration = durations.reduce((sum, d) => sum + d, 0);
    const totalItemsProcessed = metrics.reduce((sum, m) => sum + m.itemsProcessed, 0);

    const timeRangeHours = (timeRange.end.getTime() - timeRange.start.getTime()) / (1000 * 60 * 60);

    return {
      totalExecutions: metrics.length,
      successfulExecutions,
      failedExecutions,
      averageDuration: totalDuration / metrics.length,
      medianDuration: durations[Math.floor(durations.length / 2)],
      p95Duration: durations[Math.floor(durations.length * 0.95)],
      totalItemsProcessed,
      errorRate: (failedExecutions / metrics.length) * 100,
      throughput: metrics.length / timeRangeHours,
    };
  }

  async getNodeMetrics(
    nodeId: string,
    timeRange: { start: Date; end: Date },
  ): Promise<{
    executionCount: number;
    averageDuration: number;
    successRate: number;
    errorMessages: Array<{ message: string; count: number }>;
  }> {
    const metrics = await this.executionMetricRepository.find({
      where: {
        nodeId,
        recordedAt: Between(timeRange.start, timeRange.end),
      },
    });

    const errorMessageCounts = new Map<string, number>();
    metrics
      .filter(m => !m.success && m.errorMessage)
      .forEach(m => {
        const count = errorMessageCounts.get(m.errorMessage!) || 0;
        errorMessageCounts.set(m.errorMessage!, count + 1);
      });

    const errorMessages = Array.from(errorMessageCounts.entries())
      .map(([message, count]) => ({ message, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      executionCount: metrics.length,
      averageDuration: metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length || 0,
      successRate: (metrics.filter(m => m.success).length / metrics.length) * 100 || 0,
      errorMessages,
    };
  }

  async recordSystemMetrics(): Promise<SystemMetric> {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = os.cpus();
    const loadAverage = os.loadavg();

    return this.systemMetricRepository.save({
      cpuUsage: this.calculateSystemCpuUsage(cpuUsage),
      memoryUsage: memoryUsage.heapUsed,
      memoryTotal: os.totalmem(),
      memoryFree: os.freemem(),
      loadAverage: loadAverage[0],
      activeConnections: 0, // Would need to track this
      queueSize: 0, // Would need to inject queue service
    });
  }

  async getSystemMetrics(
    timeRange: { start: Date; end: Date },
  ): Promise<SystemMetric[]> {
    return this.systemMetricRepository.find({
      where: {
        recordedAt: Between(timeRange.start, timeRange.end),
      },
      order: { recordedAt: 'ASC' },
    });
  }

  async getDashboardStats(userId?: string, organizationId?: string): Promise<{
    totalWorkflows: number;
    totalExecutions: number;
    successRate: number;
    averageExecutionTime: number;
    executionsLast24h: number;
    topWorkflows: Array<{ workflowId: string; executionCount: number }>;
    recentErrors: Array<{ workflowId: string; errorMessage: string; recordedAt: Date }>;
  }> {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const query = this.executionMetricRepository.createQueryBuilder('metric');
    
    if (userId) {
      query.andWhere('metric.userId = :userId', { userId });
    }
    if (organizationId) {
      query.andWhere('metric.organizationId = :organizationId', { organizationId });
    }

    // Get total unique workflows
    const totalWorkflows = await query
      .select('COUNT(DISTINCT metric.workflowId)', 'count')
      .getRawOne();

    // Get total executions
    const totalExecutions = await query
      .select('COUNT(*)', 'count')
      .getRawOne();

    // Get success rate
    const successCount = await query
      .andWhere('metric.success = true')
      .select('COUNT(*)', 'count')
      .getRawOne();

    // Get average execution time
    const avgTime = await query
      .select('AVG(metric.duration)', 'avg')
      .getRawOne();

    // Get executions in last 24h
    const executions24h = await query
      .andWhere('metric.recordedAt > :last24h', { last24h })
      .select('COUNT(*)', 'count')
      .getRawOne();

    // Get top workflows
    const topWorkflows = await query
      .select('metric.workflowId', 'workflowId')
      .addSelect('COUNT(*)', 'executionCount')
      .groupBy('metric.workflowId')
      .orderBy('executionCount', 'DESC')
      .limit(5)
      .getRawMany();

    // Get recent errors
    const recentErrors = await this.executionMetricRepository.find({
      where: {
        success: false,
        ...(userId && { userId }),
        ...(organizationId && { organizationId }),
      },
      order: { recordedAt: 'DESC' },
      take: 10,
    });

    return {
      totalWorkflows: parseInt(totalWorkflows.count) || 0,
      totalExecutions: parseInt(totalExecutions.count) || 0,
      successRate: totalExecutions.count > 0 
        ? (parseInt(successCount.count) / parseInt(totalExecutions.count)) * 100 
        : 0,
      averageExecutionTime: parseFloat(avgTime.avg) || 0,
      executionsLast24h: parseInt(executions24h.count) || 0,
      topWorkflows,
      recentErrors: recentErrors.map(e => ({
        workflowId: e.workflowId,
        errorMessage: e.errorMessage || 'Unknown error',
        recordedAt: e.recordedAt,
      })),
    };
  }

  private calculateCpuPercentage(cpuUsage: NodeJS.CpuUsage): number {
    const totalUsage = cpuUsage.user + cpuUsage.system;
    const totalTime = process.uptime() * 1000000; // Convert to microseconds
    return (totalUsage / totalTime) * 100;
  }

  private calculateSystemCpuUsage(cpus: os.CpuInfo[]): number {
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type as keyof typeof cpu.times];
      }
      totalIdle += cpu.times.idle;
    });

    return 100 - ~~(100 * totalIdle / totalTick);
  }
}
