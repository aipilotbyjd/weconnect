import { Injectable, Logger } from '@nestjs/common';
import * as os from 'os';
import * as process from 'process';

export interface ExecutionMetrics {
  executionId: string;
  nodeId?: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
  cpuUsage: {
    user: number;
    system: number;
  };
  queueTime?: number;
  throughput?: number;
}

export interface SystemMetrics {
  timestamp: Date;
  cpuUsage: number;
  memoryUsage: {
    total: number;
    used: number;
    free: number;
    percentage: number;
  };
  activeExecutions: number;
  queuedExecutions: number;
  completedExecutions: number;
  failedExecutions: number;
}

@Injectable()
export class PerformanceMonitorService {
  private readonly logger = new Logger(PerformanceMonitorService.name);
  private readonly executionMetrics = new Map<string, ExecutionMetrics>();
  private readonly nodeMetrics = new Map<string, ExecutionMetrics>();
  private systemMetricsHistory: SystemMetrics[] = [];
  private readonly maxHistorySize = 1000;

  startExecutionMonitoring(executionId: string, queueTime?: number): void {
    const metrics: ExecutionMetrics = {
      executionId,
      startTime: Date.now(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      queueTime,
    };

    this.executionMetrics.set(executionId, metrics);
    this.logger.debug(`Started monitoring execution ${executionId}`);
  }

  startNodeMonitoring(executionId: string, nodeId: string): void {
    const key = `${executionId}:${nodeId}`;
    const metrics: ExecutionMetrics = {
      executionId,
      nodeId,
      startTime: Date.now(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
    };

    this.nodeMetrics.set(key, metrics);
    this.logger.debug(`Started monitoring node ${nodeId} in execution ${executionId}`);
  }

  endExecutionMonitoring(executionId: string): ExecutionMetrics | null {
    const metrics = this.executionMetrics.get(executionId);
    if (!metrics) {
      this.logger.warn(`No metrics found for execution ${executionId}`);
      return null;
    }

    const endTime = Date.now();
    const endMemory = process.memoryUsage();
    const endCpu = process.cpuUsage(metrics.cpuUsage);

    metrics.endTime = endTime;
    metrics.duration = endTime - metrics.startTime;
    metrics.memoryUsage = endMemory;
    metrics.cpuUsage = endCpu;

    this.executionMetrics.delete(executionId);
    this.logger.debug(`Ended monitoring execution ${executionId}, duration: ${metrics.duration}ms`);

    return metrics;
  }

  endNodeMonitoring(executionId: string, nodeId: string): ExecutionMetrics | null {
    const key = `${executionId}:${nodeId}`;
    const metrics = this.nodeMetrics.get(key);
    if (!metrics) {
      this.logger.warn(`No metrics found for node ${nodeId} in execution ${executionId}`);
      return null;
    }

    const endTime = Date.now();
    const endMemory = process.memoryUsage();
    const endCpu = process.cpuUsage(metrics.cpuUsage);

    metrics.endTime = endTime;
    metrics.duration = endTime - metrics.startTime;
    metrics.memoryUsage = endMemory;
    metrics.cpuUsage = endCpu;

    this.nodeMetrics.delete(key);
    this.logger.debug(`Ended monitoring node ${nodeId}, duration: ${metrics.duration}ms`);

    return metrics;
  }

  getExecutionMetrics(executionId: string): ExecutionMetrics | null {
    return this.executionMetrics.get(executionId) || null;
  }

  getNodeMetrics(executionId: string, nodeId: string): ExecutionMetrics | null {
    const key = `${executionId}:${nodeId}`;
    return this.nodeMetrics.get(key) || null;
  }

  collectSystemMetrics(): SystemMetrics {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    const cpus = os.cpus();
    const cpuUsage = cpus.reduce((acc, cpu) => {
      const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
      const idle = cpu.times.idle;
      return acc + (1 - idle / total) * 100;
    }, 0) / cpus.length;

    const metrics: SystemMetrics = {
      timestamp: new Date(),
      cpuUsage,
      memoryUsage: {
        total: totalMemory,
        used: usedMemory,
        free: freeMemory,
        percentage: (usedMemory / totalMemory) * 100,
      },
      activeExecutions: this.executionMetrics.size,
      queuedExecutions: 0, // Will be populated by queue service
      completedExecutions: 0, // Will be populated by database query
      failedExecutions: 0, // Will be populated by database query
    };

    // Store in history
    this.systemMetricsHistory.push(metrics);
    if (this.systemMetricsHistory.length > this.maxHistorySize) {
      this.systemMetricsHistory.shift();
    }

    return metrics;
  }

  getSystemMetricsHistory(limit = 100): SystemMetrics[] {
    return this.systemMetricsHistory.slice(-limit);
  }

  getAverageExecutionTime(timeWindow = 3600000): number { // 1 hour default
    const cutoff = Date.now() - timeWindow;
    const recentMetrics = Array.from(this.executionMetrics.values())
      .filter(m => m.startTime >= cutoff && m.duration)
      .map(m => m.duration!);

    if (recentMetrics.length === 0) return 0;
    return recentMetrics.reduce((a, b) => a + b, 0) / recentMetrics.length;
  }

  getThroughput(timeWindow = 3600000): number { // executions per hour
    const cutoff = Date.now() - timeWindow;
    const recentExecutions = Array.from(this.executionMetrics.values())
      .filter(m => m.startTime >= cutoff);

    return (recentExecutions.length / timeWindow) * 3600000; // per hour
  }

  getMemoryPressure(): number {
    const currentMemory = process.memoryUsage();
    const systemMemory = os.totalmem();
    return (currentMemory.rss / systemMemory) * 100;
  }

  isResourceConstrained(): boolean {
    const memoryPressure = this.getMemoryPressure();
    const systemMetrics = this.collectSystemMetrics();
    
    return (
      memoryPressure > 80 || // More than 80% memory usage
      systemMetrics.cpuUsage > 90 || // More than 90% CPU usage
      this.executionMetrics.size > 100 // More than 100 concurrent executions
    );
  }

  cleanup(): void {
    // Clean up old metrics (older than 1 hour)
    const cutoff = Date.now() - 3600000;
    
    for (const [key, metrics] of this.executionMetrics.entries()) {
      if (metrics.startTime < cutoff) {
        this.executionMetrics.delete(key);
      }
    }

    for (const [key, metrics] of this.nodeMetrics.entries()) {
      if (metrics.startTime < cutoff) {
        this.nodeMetrics.delete(key);
      }
    }

    this.logger.debug('Cleaned up old performance metrics');
  }
}