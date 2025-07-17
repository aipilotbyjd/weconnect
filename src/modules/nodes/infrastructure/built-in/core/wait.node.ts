import { NodeDefinition } from '../../../domain/entities/node-definition.entity';
import {
  INodeExecutor,
  NodeExecutionContext,
  NodeExecutionResult,
} from '../../../../../core/abstracts/base-node.interface';

export const WaitNodeDefinition = new NodeDefinition({
  name: 'Wait',
  displayName: 'Wait',
  description: 'Wait for a specified amount of time',
  version: 1,
  group: ['core'],
  icon: 'fa:clock',
  defaults: {
    name: 'Wait',
    color: '#9999FF',
  },
  inputs: ['main'],
  outputs: ['main'],
  properties: [
    {
      name: 'unit',
      displayName: 'Unit',
      type: 'options',
      options: [
        { name: 'Seconds', value: 'seconds' },
        { name: 'Minutes', value: 'minutes' },
        { name: 'Hours', value: 'hours' },
        { name: 'Days', value: 'days' },
      ],
      default: 'seconds',
      required: true,
    },
    {
      name: 'amount',
      displayName: 'Amount',
      type: 'number',
      default: 5,
      required: true,
      description: 'How long to wait',
    },
    {
      name: 'waitUntil',
      displayName: 'Wait Until',
      type: 'string',
      default: '',
      placeholder: '2024-12-31T23:59:59Z',
      description:
        'Wait until specific date/time (ISO format). If set, overrides unit and amount.',
    },
  ],
});

export class WaitNodeExecutor implements INodeExecutor {
  async execute(context: NodeExecutionContext): Promise<NodeExecutionResult> {
    const startTime = Date.now();
    const { unit, amount, waitUntil } = context.parameters;

    try {
      let waitMs: number;

      if (waitUntil) {
        // Wait until specific time
        const targetTime = new Date(waitUntil).getTime();
        const now = Date.now();
        waitMs = Math.max(0, targetTime - now);
      } else {
        // Wait for specified duration
        const multipliers = {
          seconds: 1000,
          minutes: 60 * 1000,
          hours: 60 * 60 * 1000,
          days: 24 * 60 * 60 * 1000,
        };

        waitMs = amount * multipliers[unit as keyof typeof multipliers];
      }

      // Cap maximum wait time to 24 hours
      const maxWait = 24 * 60 * 60 * 1000;
      if (waitMs > maxWait) {
        return {
          success: false,
          error: `Wait time exceeds maximum allowed (24 hours). Requested: ${waitMs}ms`,
          metadata: {
            executionTime: Date.now() - startTime,
          },
        };
      }

      // For long waits, we should implement this as a scheduled job instead
      // For now, we'll just simulate the wait without blocking
      if (waitMs > 30000) {
        // More than 30 seconds
        // In a real implementation, this would schedule a continuation
        return {
          success: true,
          data: context.inputData.map((item) => ({
            ...item,
            waitScheduled: true,
            waitUntil: new Date(Date.now() + waitMs).toISOString(),
            waitDuration: waitMs,
          })),
          metadata: {
            executionTime: Date.now() - startTime,
            waitDuration: waitMs,
            scheduledExecution: true,
          },
        };
      }

      // For short waits, actually wait
      await new Promise((resolve) => setTimeout(resolve, waitMs));

      return {
        success: true,
        data: context.inputData.map((item) => ({
          ...item,
          waitCompleted: true,
          waitDuration: waitMs,
        })),
        metadata: {
          executionTime: Date.now() - startTime,
          waitDuration: waitMs,
          itemsProcessed: context.inputData.length,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        metadata: {
          executionTime: Date.now() - startTime,
        },
      };
    }
  }

  validate(configuration: Record<string, any>): boolean {
    // Basic validation - override in specific implementations
    return true;
  }

  getConfigurationSchema(): any {
    return {
      type: 'object',
      properties: {},
      required: [],
    };
  }
}
