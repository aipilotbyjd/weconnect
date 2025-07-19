import { Injectable, Logger } from '@nestjs/common';

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  backoffMultiplier: number;
  jitter: boolean;
  retryableErrors?: string[]; // Error types that should trigger retry
}

export interface RetryResult<T> {
  success: boolean;
  result?: T;
  error?: Error;
  attempts: number;
  totalDuration: number;
}

@Injectable()
export class RetryService {
  private readonly logger = new Logger(RetryService.name);

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    config: RetryConfig,
    context?: string,
  ): Promise<RetryResult<T>> {
    const startTime = Date.now();
    let lastError: Error = new Error('Unknown error');
    
    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        const result = await operation();
        
        if (attempt > 1) {
          this.logger.log(
            `Operation succeeded on attempt ${attempt}/${config.maxAttempts}${
              context ? ` (${context})` : ''
            }`
          );
        }
        
        return {
          success: true,
          result,
          attempts: attempt,
          totalDuration: Date.now() - startTime,
        };
      } catch (error) {
        lastError = error as Error;
        
        // Check if error is retryable
        if (!this.isRetryableError(error as Error, config)) {
          this.logger.error(
            `Non-retryable error on attempt ${attempt}${
              context ? ` (${context})` : ''
            }: ${(error as Error).message}`
          );
          break;
        }
        
        if (attempt === config.maxAttempts) {
          this.logger.error(
            `All ${config.maxAttempts} attempts failed${
              context ? ` (${context})` : ''
            }: ${(error as Error).message}`
          );
          break;
        }
        
        const delay = this.calculateDelay(attempt, config);
        this.logger.warn(
          `Attempt ${attempt}/${config.maxAttempts} failed${
            context ? ` (${context})` : ''
          }: ${(error as Error).message}. Retrying in ${delay}ms...`
        );
        
        await this.sleep(delay);
      }
    }
    
    return {
      success: false,
      error: lastError,
      attempts: config.maxAttempts,
      totalDuration: Date.now() - startTime,
    };
  }

  private isRetryableError(error: Error, config: RetryConfig): boolean {
    // If no specific retryable errors defined, retry all errors
    if (!config.retryableErrors || config.retryableErrors.length === 0) {
      return true;
    }
    
    // Check if error type/message matches retryable patterns
    return config.retryableErrors.some(pattern => 
      error.name.includes(pattern) || 
      error.message.includes(pattern)
    );
  }

  private calculateDelay(attempt: number, config: RetryConfig): number {
    // Exponential backoff: baseDelay * (backoffMultiplier ^ (attempt - 1))
    let delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1);
    
    // Cap at maxDelay
    delay = Math.min(delay, config.maxDelay);
    
    // Add jitter to prevent thundering herd
    if (config.jitter) {
      delay = delay * (0.5 + Math.random() * 0.5);
    }
    
    return Math.floor(delay);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Predefined retry configurations
  static readonly DEFAULT_CONFIG: RetryConfig = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    jitter: true,
  };

  static readonly NETWORK_CONFIG: RetryConfig = {
    maxAttempts: 5,
    baseDelay: 500,
    maxDelay: 10000,
    backoffMultiplier: 2,
    jitter: true,
    retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'Network'],
  };

  static readonly API_CONFIG: RetryConfig = {
    maxAttempts: 3,
    baseDelay: 2000,
    maxDelay: 15000,
    backoffMultiplier: 1.5,
    jitter: true,
    retryableErrors: ['429', '500', '502', '503', '504'],
  };
}