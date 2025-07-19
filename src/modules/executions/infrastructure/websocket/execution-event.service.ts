import { Injectable } from '@nestjs/common';
import { ExecutionGateway } from './execution-gateway';
import { ExecutionStatus } from '../../domain/entities/execution.entity';
import { LogLevel } from '../../domain/entities/execution-log.entity';

export interface ExecutionUpdateEvent {
  executionId: string;
  status?: ExecutionStatus;
  progress?: number;
  currentNodeId?: string;
  duration?: number;
  error?: string;
  timestamp: Date;
}

export interface ExecutionLogEvent {
  executionId: string;
  nodeId?: string;
  nodeName?: string;
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: Date;
}

export interface ExecutionMetricsEvent {
  executionId: string;
  nodeId?: string;
  metrics: {
    memoryUsage?: number;
    cpuUsage?: number;
    executionTime?: number;
    queueTime?: number;
  };
  timestamp: Date;
}

@Injectable()
export class ExecutionEventService {
  constructor(private executionGateway: ExecutionGateway) {}

  emitExecutionUpdate(event: ExecutionUpdateEvent) {
    this.executionGateway.broadcastExecutionUpdate(event.executionId, {
      type: 'status-update',
      status: event.status,
      progress: event.progress,
      currentNodeId: event.currentNodeId,
      duration: event.duration,
      error: event.error,
      timestamp: event.timestamp,
    });
  }

  emitExecutionLog(event: ExecutionLogEvent) {
    this.executionGateway.broadcastExecutionLog(event.executionId, {
      type: 'log',
      nodeId: event.nodeId,
      nodeName: event.nodeName,
      level: event.level,
      message: event.message,
      data: event.data,
      timestamp: event.timestamp,
    });
  }

  emitExecutionMetrics(event: ExecutionMetricsEvent) {
    this.executionGateway.broadcastExecutionUpdate(event.executionId, {
      type: 'metrics',
      nodeId: event.nodeId,
      metrics: event.metrics,
      timestamp: event.timestamp,
    });
  }

  emitExecutionStarted(executionId: string, workflowId: string, userId: string) {
    this.executionGateway.broadcastToUser(userId, 'execution-started', {
      executionId,
      workflowId,
      timestamp: new Date(),
    });
  }

  emitExecutionCompleted(executionId: string, userId: string, result: any) {
    this.executionGateway.broadcastToUser(userId, 'execution-completed', {
      executionId,
      result,
      timestamp: new Date(),
    });
  }

  emitExecutionFailed(executionId: string, userId: string, error: string) {
    this.executionGateway.broadcastToUser(userId, 'execution-failed', {
      executionId,
      error,
      timestamp: new Date(),
    });
  }
}