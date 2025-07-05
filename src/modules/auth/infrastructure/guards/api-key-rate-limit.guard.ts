import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Reflector } from '@nestjs/core';

@Injectable()
export class ApiKeyRateLimitGuard extends ThrottlerGuard {
  constructor(
    options: any,
    storageService: any,
    reflector: Reflector,
  ) {
    super(options, storageService, reflector);
  }

  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Rate limit by API key if present, otherwise by IP
    const apiKey = req.headers['x-api-key'];
    if (apiKey) {
      return `api-key:${apiKey}`;
    }
    
    // Fallback to IP address
    return req.ip;
  }

  protected async getTrackerOptions(context: ExecutionContext): Promise<{
    limit: number;
    ttl: number;
  }> {
    const req = context.switchToHttp().getRequest();
    const apiKey = req.headers['x-api-key'];

    // Different limits for API key vs regular auth
    if (apiKey) {
      return {
        limit: 1000, // 1000 requests
        ttl: 3600,   // per hour
      };
    }

    // Default limits for JWT auth
    return {
      limit: 100,  // 100 requests
      ttl: 60,     // per minute
    };
  }
}
