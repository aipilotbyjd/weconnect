import { Injectable, Logger } from '@nestjs/common';

export enum CircuitState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half-open',
}

export interface CircuitBreakerConfig {
  failureThreshold: number; // Number of failures before opening
  recoveryTimeout: number; // Time to wait before trying half-open (ms)
  monitoringPeriod: number; // Time window for failure counting (ms)
  halfOpenMaxCalls: number; // Max calls allowed in half-open state
}

export interface CircuitBreakerStats {
  state: CircuitState;
  failureCount: number;
  successCount: number;
  lastFailureTime?: Date;
  nextAttemptTime?: Date;
}

@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);
  private readonly circuits = new Map<string, CircuitBreakerStats>();
  private readonly configs = new Map<string, CircuitBreakerConfig>();

  registerCircuit(key: string, config: CircuitBreakerConfig) {
    this.configs.set(key, config);
    this.circuits.set(key, {
      state: CircuitState.CLOSED,
      failureCount: 0,
      successCount: 0,
    });
    
    this.logger.log(`Circuit breaker registered for ${key}`);
  }

  async execute<T>(
    key: string,
    operation: () => Promise<T>,
    fallback?: () => Promise<T>,
  ): Promise<T> {
    const config = this.configs.get(key);
    if (!config) {
      throw new Error(`Circuit breaker not configured for key: ${key}`);
    }

    const stats = this.circuits.get(key)!;
    
    // Check if circuit is open
    if (stats.state === CircuitState.OPEN) {
      if (this.shouldAttemptReset(stats, config)) {
        stats.state = CircuitState.HALF_OPEN;
        this.logger.log(`Circuit breaker ${key} moved to HALF_OPEN state`);
      } else {
        this.logger.warn(`Circuit breaker ${key} is OPEN, using fallback`);
        if (fallback) {
          return await fallback();
        }
        throw new Error(`Circuit breaker is OPEN for ${key}`);
      }
    }

    try {
      const result = await operation();
      this.onSuccess(key, stats, config);
      return result;
    } catch (error) {
      this.onFailure(key, stats, config);
      
      if (fallback) {
        this.logger.warn(`Using fallback for ${key} due to circuit breaker`);
        return await fallback();
      }
      
      throw error;
    }
  }

  private shouldAttemptReset(stats: CircuitBreakerStats, config: CircuitBreakerConfig): boolean {
    if (!stats.lastFailureTime) return false;
    
    const timeSinceLastFailure = Date.now() - stats.lastFailureTime.getTime();
    return timeSinceLastFailure >= config.recoveryTimeout;
  }

  private onSuccess(key: string, stats: CircuitBreakerStats, config: CircuitBreakerConfig) {
    stats.successCount++;
    
    if (stats.state === CircuitState.HALF_OPEN) {
      if (stats.successCount >= config.halfOpenMaxCalls) {
        stats.state = CircuitState.CLOSED;
        stats.failureCount = 0;
        stats.successCount = 0;
        stats.lastFailureTime = undefined;
        stats.nextAttemptTime = undefined;
        
        this.logger.log(`Circuit breaker ${key} moved to CLOSED state`);
      }
    } else if (stats.state === CircuitState.CLOSED) {
      // Reset failure count on success in closed state
      stats.failureCount = 0;
    }
  }

  private onFailure(key: string, stats: CircuitBreakerStats, config: CircuitBreakerConfig) {
    stats.failureCount++;
    stats.lastFailureTime = new Date();
    
    if (stats.state === CircuitState.HALF_OPEN) {
      // Any failure in half-open state opens the circuit
      stats.state = CircuitState.OPEN;
      stats.nextAttemptTime = new Date(Date.now() + config.recoveryTimeout);
      
      this.logger.warn(`Circuit breaker ${key} moved to OPEN state (failure in half-open)`);
    } else if (stats.state === CircuitState.CLOSED && stats.failureCount >= config.failureThreshold) {
      stats.state = CircuitState.OPEN;
      stats.nextAttemptTime = new Date(Date.now() + config.recoveryTimeout);
      
      this.logger.warn(`Circuit breaker ${key} moved to OPEN state (threshold reached)`);
    }
  }

  getStats(key: string): CircuitBreakerStats | undefined {
    return this.circuits.get(key);
  }

  getAllStats(): Map<string, CircuitBreakerStats> {
    return new Map(this.circuits);
  }

  reset(key: string) {
    const stats = this.circuits.get(key);
    if (stats) {
      stats.state = CircuitState.CLOSED;
      stats.failureCount = 0;
      stats.successCount = 0;
      stats.lastFailureTime = undefined;
      stats.nextAttemptTime = undefined;
      
      this.logger.log(`Circuit breaker ${key} manually reset`);
    }
  }

  // Predefined configurations
  static readonly DEFAULT_CONFIG: CircuitBreakerConfig = {
    failureThreshold: 5,
    recoveryTimeout: 60000, // 1 minute
    monitoringPeriod: 300000, // 5 minutes
    halfOpenMaxCalls: 3,
  };

  static readonly API_CONFIG: CircuitBreakerConfig = {
    failureThreshold: 3,
    recoveryTimeout: 30000, // 30 seconds
    monitoringPeriod: 120000, // 2 minutes
    halfOpenMaxCalls: 2,
  };

  static readonly DATABASE_CONFIG: CircuitBreakerConfig = {
    failureThreshold: 10,
    recoveryTimeout: 120000, // 2 minutes
    monitoringPeriod: 600000, // 10 minutes
    halfOpenMaxCalls: 5,
  };
}