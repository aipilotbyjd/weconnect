import { Injectable } from '@nestjs/common';
import { BullModuleOptions } from '@nestjs/bull';
import { QueueOptions } from 'bull';
import { ConfigService } from '@nestjs/config';

export enum QueuePriority {
  CRITICAL = 1,
  HIGH = 2,
  NORMAL = 3,
  LOW = 4,
}

@Injectable()
export class QueueConfigService {
  constructor(private configService: ConfigService) {}

  getQueueOptions(queueName: string): BullModuleOptions {
    const redisConfig = this.configService.get('redis');
    
    return {
      name: queueName,
      redis: {
        host: redisConfig.host,
        port: redisConfig.port,
        password: redisConfig.password,
        db: redisConfig.db,
      },
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: false,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      },
    };
  }

  getDeadLetterQueueOptions(mainQueueName: string): QueueOptions {
    return {
      redis: this.configService.get('redis'),
      defaultJobOptions: {
        removeOnComplete: false, // Keep for analysis
        removeOnFail: false,
        attempts: 1, // No retries in DLQ
      },
    };
  }

  getJobOptions(priority: QueuePriority, customOptions?: any) {
    const baseOptions = {
      priority,
      attempts: this.getAttemptsForPriority(priority),
      backoff: this.getBackoffForPriority(priority),
      timeout: this.getTimeoutForPriority(priority),
    };

    return { ...baseOptions, ...customOptions };
  }

  private getAttemptsForPriority(priority: QueuePriority): number {
    switch (priority) {
      case QueuePriority.CRITICAL:
        return 5;
      case QueuePriority.HIGH:
        return 4;
      case QueuePriority.NORMAL:
        return 3;
      case QueuePriority.LOW:
        return 2;
      default:
        return 3;
    }
  }

  private getBackoffForPriority(priority: QueuePriority) {
    switch (priority) {
      case QueuePriority.CRITICAL:
        return {
          type: 'exponential' as const,
          delay: 2000,
        };
      case QueuePriority.HIGH:
        return {
          type: 'exponential' as const,
          delay: 5000,
        };
      case QueuePriority.NORMAL:
        return {
          type: 'exponential' as const,
          delay: 10000,
        };
      case QueuePriority.LOW:
        return {
          type: 'fixed' as const,
          delay: 30000,
        };
      default:
        return {
          type: 'exponential' as const,
          delay: 10000,
        };
    }
  }

  private getTimeoutForPriority(priority: QueuePriority): number {
    switch (priority) {
      case QueuePriority.CRITICAL:
        return 600000; // 10 minutes
      case QueuePriority.HIGH:
        return 300000; // 5 minutes
      case QueuePriority.NORMAL:
        return 180000; // 3 minutes
      case QueuePriority.LOW:
        return 60000; // 1 minute
      default:
        return 180000;
    }
  }
}
