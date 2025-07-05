export interface RetryConfiguration {
  maxAttempts: number;
  backoffType: 'fixed' | 'exponential' | 'linear';
  initialDelay: number;
  maxDelay?: number;
  multiplier?: number;
  retryableErrors?: string[];
  nonRetryableErrors?: string[];
}

export interface ErrorHandlingConfiguration {
  onError: 'stop' | 'continue' | 'retry' | 'fallback';
  fallbackNodeId?: string;
  notifyOnError?: boolean;
  notificationChannels?: string[];
  captureStackTrace?: boolean;
  errorOutputVariable?: string;
}

export interface CircuitBreakerConfiguration {
  enabled: boolean;
  failureThreshold: number;
  resetTimeout: number;
  halfOpenRequests: number;
}
