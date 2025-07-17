import { Injectable, Logger } from '@nestjs/common';
import { WorkflowNode } from '../../../domain/entities/workflow-node.entity';
import { NodeExecutor } from '../node-executor.interface';

export interface DelayConfig {
  delay: number;
  unit: 'milliseconds' | 'seconds' | 'minutes' | 'hours' | 'days';
  waitUntil?: string; // ISO date string for specific time
  businessHours?: {
    enabled: boolean;
    start: string; // HH:mm format
    end: string; // HH:mm format
    timezone?: string;
    excludeWeekends?: boolean;
  };
}

@Injectable()
export class DelayNodeExecutor implements NodeExecutor {
  private readonly logger = new Logger(DelayNodeExecutor.name);

  async execute(
    node: WorkflowNode,
    inputData: Record<string, any>,
    executionId: string,
  ): Promise<Record<string, any>> {
    const config = node.configuration as DelayConfig;
    this.logger.log(`Executing delay node: ${node.name}`);

    try {
      let delayMs: number;

      if (config.waitUntil) {
        // Wait until specific time
        const targetTime = this.replaceVariables(config.waitUntil, inputData);
        const targetDate = new Date(targetTime);
        const now = new Date();
        delayMs = targetDate.getTime() - now.getTime();

        if (delayMs < 0) {
          delayMs = 0; // If target time is in the past, don't delay
        }
      } else {
        // Wait for specified duration
        delayMs = this.convertToMilliseconds(config.delay, config.unit);
      }

      // Apply business hours logic if enabled
      if (config.businessHours?.enabled) {
        delayMs = this.adjustForBusinessHours(delayMs, config.businessHours);
      }

      // Log the delay
      this.logger.log(
        `Delaying for ${delayMs}ms (${this.formatDelay(delayMs)})`,
      );

      // Perform the delay
      await new Promise((resolve) =>
        setTimeout(resolve, Math.min(delayMs, 2147483647)),
      ); // Max 32-bit int

      return {
        ...inputData,
        _delay: {
          nodeId: node.id,
          nodeName: node.name,
          delayMs,
          delayFormatted: this.formatDelay(delayMs),
          startTime: new Date(Date.now() - delayMs).toISOString(),
          endTime: new Date().toISOString(),
          config,
        },
      };
    } catch (error) {
      this.logger.error(`Delay node ${node.name} failed:`, error);
      throw error;
    }
  }

  async validate(configuration: Record<string, any>): Promise<boolean> {
    const config = configuration as DelayConfig;
    return !!(config.delay && config.unit) || !!config.waitUntil;
  }

  private convertToMilliseconds(
    value: number,
    unit: DelayConfig['unit'],
  ): number {
    switch (unit) {
      case 'milliseconds':
        return value;
      case 'seconds':
        return value * 1000;
      case 'minutes':
        return value * 60 * 1000;
      case 'hours':
        return value * 60 * 60 * 1000;
      case 'days':
        return value * 24 * 60 * 60 * 1000;
      default:
        return value;
    }
  }

  private formatDelay(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ${hours % 24} hour${hours % 24 !== 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ${minutes % 60} minute${minutes % 60 !== 1 ? 's' : ''}`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''} ${seconds % 60} second${seconds % 60 !== 1 ? 's' : ''}`;
    } else if (seconds > 0) {
      return `${seconds} second${seconds > 1 ? 's' : ''}`;
    } else {
      return `${ms} millisecond${ms > 1 ? 's' : ''}`;
    }
  }

  private adjustForBusinessHours(delayMs: number, businessHours: any): number {
    const now = new Date();
    const endTime = new Date(now.getTime() + delayMs);

    // Parse business hours
    const [startHour, startMinute] = businessHours.start.split(':').map(Number);
    const [endHour, endMinute] = businessHours.end.split(':').map(Number);

    let adjustedEndTime = new Date(endTime);
    let totalDelayMs = 0;

    // Check if we need to skip non-business hours
    while (now < adjustedEndTime) {
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTime = currentHour * 60 + currentMinute;
      const businessStart = startHour * 60 + startMinute;
      const businessEnd = endHour * 60 + endMinute;

      // Check if current time is outside business hours
      if (currentTime < businessStart || currentTime >= businessEnd) {
        // Skip to next business day start
        const nextBusinessDay = new Date(now);
        nextBusinessDay.setDate(nextBusinessDay.getDate() + 1);
        nextBusinessDay.setHours(startHour, startMinute, 0, 0);

        // Skip weekends if configured
        if (businessHours.excludeWeekends) {
          while (
            nextBusinessDay.getDay() === 0 ||
            nextBusinessDay.getDay() === 6
          ) {
            nextBusinessDay.setDate(nextBusinessDay.getDate() + 1);
          }
        }

        const skipMs = nextBusinessDay.getTime() - now.getTime();
        totalDelayMs += skipMs;
        now.setTime(nextBusinessDay.getTime());
      } else {
        // We're in business hours, add remaining delay
        totalDelayMs += adjustedEndTime.getTime() - now.getTime();
        break;
      }
    }

    return totalDelayMs;
  }

  private replaceVariables(str: string, data: Record<string, any>): string {
    return str.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
      const keys = key.trim().split('.');
      let value = data;

      for (const k of keys) {
        value = value?.[k];
      }

      return value !== undefined ? String(value) : match;
    });
  }
}
