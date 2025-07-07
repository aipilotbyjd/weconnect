import { Injectable, LogLevel } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export enum LogCategory {
  AUTH = 'auth',
  WORKFLOW = 'workflow',
  EXECUTION = 'execution',
  NODE = 'node',
  API = 'api',
  DATABASE = 'database',
  WEBHOOK = 'webhook',
  SCHEDULER = 'scheduler',
  SYSTEM = 'system',
}

export interface LogContext {
  category: LogCategory;
  userId?: string;
  organizationId?: string;
  workflowId?: string;
  executionId?: string;
  nodeId?: string;
  correlationId?: string;
  metadata?: Record<string, any>;
  error?: string;
}

@Injectable()
export class LoggerService {
  private readonly logLevel: LogLevel;
  private readonly environment: string;

  constructor(private configService: ConfigService) {
    this.logLevel = this.configService.get<LogLevel>('LOG_LEVEL', 'log');
    this.environment = this.configService.get<string>('NODE_ENV', 'development');
  }

  error(message: string, error?: Error, context?: LogContext): void {
    const errorContext: LogContext = {
      category: context?.category || LogCategory.SYSTEM,
      ...context,
      error: error?.stack || error?.message
    };
    this.log('error', message, errorContext);
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  log(level: LogLevel | string, message: string, context?: LogContext): void {
    const timestamp = new Date().toISOString();
    
    const logEntry = {
      timestamp,
      level,
      message,
      environment: this.environment,
      ...context,
    };

    // In production, you might want to use a proper logging library like Winston
    if (this.environment === 'development') {
      console.log(JSON.stringify(logEntry, null, 2));
    } else {
      console.log(JSON.stringify(logEntry));
    }
  }

  debug(message: string, context?: LogContext): void {
    if (this.environment === 'development') {
      this.log('debug', message, context);
    }
  }

  verbose(message: string, context?: LogContext): void {
    if (this.logLevel === 'verbose') {
      this.log('verbose', message, context);
    }
  }
}
