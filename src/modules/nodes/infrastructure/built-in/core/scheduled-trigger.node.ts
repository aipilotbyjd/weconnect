import { NodeDefinition } from '../../../domain/entities/node-definition.entity';
import {
  INodeExecutor,
  NodeExecutionContext,
  NodeExecutionResult,
} from '../../../../../core/abstracts/base-node.interface';

export const ScheduledTriggerNodeDefinition = new NodeDefinition({
  name: 'ScheduledTrigger',
  displayName: 'Scheduled Trigger',
  description: 'Triggers workflow execution on a schedule',
  version: 1,
  group: ['trigger'],
  icon: 'fa:clock',
  defaults: {
    name: 'Scheduled Trigger',
    color: '#ff6d5a',
  },
  inputs: [],
  outputs: ['main'],
  properties: [
    {
      name: 'cronExpression',
      displayName: 'Cron Expression',
      type: 'string',
      default: '0 0 * * *',
      placeholder: '0 0 * * *',
      description:
        'Cron expression for scheduling (e.g., "0 0 * * *" for daily at midnight)',
      required: true,
    },
    {
      name: 'timezone',
      displayName: 'Timezone',
      type: 'string',
      default: 'UTC',
      placeholder: 'America/New_York',
      description: 'Timezone for the schedule',
    },
    {
      name: 'info',
      displayName: 'Info',
      type: 'string',
      default:
        'This node will trigger the workflow according to the specified schedule. The schedule is managed separately from the workflow definition.',
      description: 'Schedule information',
    },
  ],
});

export class ScheduledTriggerNodeExecutor implements INodeExecutor {
  async execute(context: NodeExecutionContext): Promise<NodeExecutionResult> {
    const startTime = Date.now();

    try {
      // When a scheduled workflow runs, this node simply passes through the input data
      const inputData = context.inputData.length > 0 ? context.inputData : [{}];

      // Add execution metadata
      const outputData = inputData.map((item) => ({
        ...item,
        executionTime: new Date().toISOString(),
        mode: 'scheduled',
        scheduledAt: context.parameters?.cronExpression || '0 0 * * *',
        timezone: context.parameters?.timezone || 'UTC',
      }));

      return {
        success: true,
        data: outputData,
        metadata: {
          executionTime: Date.now() - startTime,
          itemsProcessed: outputData.length,
          executionMode: 'scheduled',
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
