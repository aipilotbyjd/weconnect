import { Injectable, Logger } from '@nestjs/common';
import { 
  BaseUnifiedNodeExecutor, 
  NodeExecutionContext, 
  NodeExecutionResult, 
  NodeSchema 
} from '../../interfaces/unified-node-executor.interface';

@Injectable()
export class DelayNodeExecutor extends BaseUnifiedNodeExecutor {
  private readonly logger = new Logger(DelayNodeExecutor.name);

  getSchema(): NodeSchema {
    return {
      name: 'delay',
      displayName: 'Delay',
      description: 'Add a delay/wait in workflow execution',
      version: 1,
      group: ['core', 'flow'],
      icon: 'fas:clock',
      color: '#9C27B0',
      inputs: ['main'],
      outputs: ['main'],
      properties: [
        {
          name: 'delayType',
          displayName: 'Delay Type',
          type: 'options',
          required: true,
          default: 'fixed',
          options: [
            { name: 'Fixed Duration', value: 'fixed' },
            { name: 'Until Specific Time', value: 'until' },
            { name: 'Random Duration', value: 'random' },
          ],
        },
        {
          name: 'duration',
          displayName: 'Duration',
          type: 'number',
          required: true,
          default: 5,
          description: 'Duration in seconds',
          displayOptions: {
            show: {
              delayType: ['fixed'],
            },
          },
        },
        {
          name: 'unit',
          displayName: 'Time Unit',
          type: 'options',
          default: 'seconds',
          options: [
            { name: 'Seconds', value: 'seconds' },
            { name: 'Minutes', value: 'minutes' },
            { name: 'Hours', value: 'hours' },
            { name: 'Days', value: 'days' },
          ],
          displayOptions: {
            show: {
              delayType: ['fixed'],
            },
          },
        },
        {
          name: 'untilTime',
          displayName: 'Until Time',
          type: 'dateTime',
          required: true,
          description: 'Wait until this specific date/time',
          displayOptions: {
            show: {
              delayType: ['until'],
            },
          },
        },
        {
          name: 'minDuration',
          displayName: 'Minimum Duration',
          type: 'number',
          required: true,
          default: 1,
          description: 'Minimum duration in seconds',
          displayOptions: {
            show: {
              delayType: ['random'],
            },
          },
        },
        {
          name: 'maxDuration',
          displayName: 'Maximum Duration',
          type: 'number',
          required: true,
          default: 10,
          description: 'Maximum duration in seconds',
          displayOptions: {
            show: {
              delayType: ['random'],
            },
          },
        },
      ],
      resources: {
        memoryMB: 8,
        timeoutSeconds: 86400, // 24 hours max
      },
    };
  }

  async execute(context: NodeExecutionContext): Promise<NodeExecutionResult> {
    const { delayType, duration, unit = 'seconds', untilTime, minDuration, maxDuration } = context.parameters;

    try {
      let delayMs: number;
      let delayReason: string;

      switch (delayType) {
        case 'fixed':
          delayMs = this.convertToMilliseconds(duration, unit);
          delayReason = `Fixed delay of ${duration} ${unit}`;
          break;
          
        case 'until':
          const targetTime = new Date(this.replaceVariables(untilTime, context));
          const now = new Date();
          delayMs = Math.max(0, targetTime.getTime() - now.getTime());
          delayReason = `Wait until ${targetTime.toISOString()}`;
          break;
          
        case 'random':
          const min = this.convertToMilliseconds(minDuration, 'seconds');
          const max = this.convertToMilliseconds(maxDuration, 'seconds');
          delayMs = Math.random() * (max - min) + min;
          delayReason = `Random delay between ${minDuration}s and ${maxDuration}s`;
          break;
          
        default:
          return this.createErrorResult(`Unknown delay type: ${delayType}`);
      }

      this.logger.log(`Starting delay: ${delayReason} (${delayMs}ms)`);

      // Perform the actual delay
      await this.sleep(delayMs);

      this.logger.log(`Delay completed: ${delayReason}`);

      // Pass through input data unchanged
      const outputData = {
        ...context.inputData[0],
        _delay: {
          type: delayType,
          duration: delayMs,
          reason: delayReason,
          startTime: new Date(Date.now() - delayMs).toISOString(),
          endTime: new Date().toISOString(),
        },
      };

      return this.createSuccessResult(outputData, {
        delayType,
        delayMs,
        delayReason,
      });
    } catch (error) {
      this.logger.error(`Delay execution failed: ${error.message}`);
      return this.createErrorResult(error.message);
    }
  }

  private convertToMilliseconds(value: number, unit: string): number {
    const multipliers = {
      seconds: 1000,
      minutes: 60 * 1000,
      hours: 60 * 60 * 1000,
      days: 24 * 60 * 60 * 1000,
    };

    return value * (multipliers[unit] || 1000);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}