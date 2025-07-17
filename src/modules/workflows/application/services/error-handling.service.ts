import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import {
  WorkflowExecutionLog,
  LogLevel,
} from '../../domain/entities/workflow-execution-log.entity';
import {
  RetryConfiguration,
  ErrorHandlingConfiguration,
} from '../../domain/interfaces/retry-configuration.interface';
import {
  WORKFLOW_NODE_QUEUE,
  NodeJobType,
} from '../../infrastructure/queues/constants';

@Injectable()
export class ErrorHandlingService {
  private readonly logger = new Logger(ErrorHandlingService.name);
  private circuitBreakers = new Map<string, CircuitBreaker>();

  constructor(
    @InjectRepository(WorkflowExecutionLog)
    private logRepository: Repository<WorkflowExecutionLog>,
    @InjectQueue(WORKFLOW_NODE_QUEUE)
    private nodeQueue: Queue,
  ) {}

  calculateRetryDelay(attempt: number, config: RetryConfiguration): number {
    let delay = config.initialDelay;

    switch (config.backoffType) {
      case 'exponential':
        delay = Math.min(
          config.initialDelay * Math.pow(config.multiplier || 2, attempt - 1),
          config.maxDelay || 300000, // 5 minutes max
        );
        break;
      case 'linear':
        delay = Math.min(
          config.initialDelay * attempt,
          config.maxDelay || 300000,
        );
        break;
      case 'fixed':
      default:
        delay = config.initialDelay;
    }

    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.1 * delay;
    return Math.floor(delay + jitter);
  }

  shouldRetry(
    error: Error,
    attempt: number,
    config: RetryConfiguration,
  ): boolean {
    if (attempt >= config.maxAttempts) {
      return false;
    }

    const errorName = error.name || error.constructor.name;
    const errorMessage = error.message;

    // Check non-retryable errors first
    if (config.nonRetryableErrors?.length) {
      for (const pattern of config.nonRetryableErrors) {
        if (errorName.includes(pattern) || errorMessage.includes(pattern)) {
          return false;
        }
      }
    }

    // Check retryable errors if specified
    if (config.retryableErrors?.length) {
      for (const pattern of config.retryableErrors) {
        if (errorName.includes(pattern) || errorMessage.includes(pattern)) {
          return true;
        }
      }
      return false; // If retryable list exists but error doesn't match, don't retry
    }

    // Default retry for common transient errors
    const transientErrors = [
      'ETIMEDOUT',
      'ECONNRESET',
      'ENOTFOUND',
      'ECONNREFUSED',
      'EHOSTUNREACH',
      'EPIPE',
      'EAI_AGAIN',
    ];

    return transientErrors.some((e) => errorMessage.includes(e));
  }

  async handleError(
    error: Error,
    context: {
      executionId: string;
      nodeId: string;
      nodeName: string;
      attempt: number;
    },
    config: ErrorHandlingConfiguration,
  ): Promise<'stop' | 'continue' | 'retry' | 'fallback'> {
    // Log the error
    await this.logRepository.save({
      executionId: context.executionId,
      nodeId: context.nodeId,
      level: LogLevel.ERROR,
      message: `Error in node ${context.nodeName} (attempt ${context.attempt})`,
      data: {
        error: error.message,
        stack: config.captureStackTrace ? error.stack : undefined,
        attempt: context.attempt,
      },
    });

    // Handle circuit breaker
    const circuitBreaker = this.getCircuitBreaker(context.nodeId);
    if (circuitBreaker && !circuitBreaker.allowRequest()) {
      this.logger.warn(`Circuit breaker open for node ${context.nodeId}`);
      return 'stop';
    }

    // Record failure in circuit breaker
    if (circuitBreaker) {
      circuitBreaker.recordFailure();
    }

    return config.onError;
  }

  async logRetry(context: {
    executionId: string;
    nodeId: string;
    nodeName: string;
    attempt: number;
    nextAttemptIn: number;
  }): Promise<void> {
    await this.logRepository.save({
      executionId: context.executionId,
      nodeId: context.nodeId,
      level: LogLevel.INFO,
      message: `Retrying node ${context.nodeName} (attempt ${context.attempt + 1})`,
      data: {
        currentAttempt: context.attempt,
        nextAttemptIn: context.nextAttemptIn,
      },
    });
  }

  getCircuitBreaker(nodeId: string): CircuitBreaker | null {
    return this.circuitBreakers.get(nodeId) || null;
  }

  createCircuitBreaker(
    nodeId: string,
    config: {
      failureThreshold: number;
      resetTimeout: number;
      halfOpenRequests: number;
    },
  ): void {
    this.circuitBreakers.set(nodeId, new CircuitBreaker(config));
  }

  async scheduleRetry(
    nodeId: string,
    executionId: string,
    inputData: Record<string, any>,
    retryCount: number,
    delay: number,
  ): Promise<void> {
    await this.nodeQueue.add(
      NodeJobType.RETRY,
      {
        nodeId,
        executionId,
        inputData,
        retryCount,
      },
      { delay },
    );

    this.logger.log(
      `Scheduled retry ${retryCount} for node ${nodeId} in ${delay}ms`,
    );
  }
}

class CircuitBreaker {
  private failures = 0;
  private lastFailureTime: number | null = null;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private halfOpenAttempts = 0;

  constructor(
    private config: {
      failureThreshold: number;
      resetTimeout: number;
      halfOpenRequests: number;
    },
  ) {}

  allowRequest(): boolean {
    const now = Date.now();

    switch (this.state) {
      case 'closed':
        return true;

      case 'open':
        if (
          this.lastFailureTime &&
          now - this.lastFailureTime > this.config.resetTimeout
        ) {
          this.state = 'half-open';
          this.halfOpenAttempts = 0;
          return true;
        }
        return false;

      case 'half-open':
        if (this.halfOpenAttempts < this.config.halfOpenRequests) {
          this.halfOpenAttempts++;
          return true;
        }
        return false;
    }
  }

  recordSuccess(): void {
    if (this.state === 'half-open') {
      this.state = 'closed';
      this.failures = 0;
      this.lastFailureTime = null;
    }
  }

  recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.config.failureThreshold) {
      this.state = 'open';
    }
  }
}
