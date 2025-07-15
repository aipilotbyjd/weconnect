import { Injectable, Logger } from '@nestjs/common';
import { 
  BaseUnifiedNodeExecutor, 
  NodeExecutionContext, 
  NodeExecutionResult, 
  NodeSchema 
} from '../../interfaces/unified-node-executor.interface';

@Injectable()
export class TriggerNodeExecutor extends BaseUnifiedNodeExecutor {
  private readonly logger = new Logger(TriggerNodeExecutor.name);

  getSchema(): NodeSchema {
    return {
      name: 'trigger',
      displayName: 'Trigger',
      description: 'Start point for workflow execution',
      version: 1,
      group: ['core', 'triggers'],
      icon: 'fas:play',
      color: '#4CAF50',
      inputs: [],
      outputs: ['main'],
      properties: [
        {
          name: 'triggerType',
          displayName: 'Trigger Type',
          type: 'options',
          required: true,
          default: 'manual',
          options: [
            { name: 'Manual', value: 'manual' },
            { name: 'Webhook', value: 'webhook' },
            { name: 'Schedule', value: 'schedule' },
            { name: 'Email', value: 'email' },
          ],
        },
        {
          name: 'webhookPath',
          displayName: 'Webhook Path',
          type: 'string',
          placeholder: '/webhook/my-workflow',
          description: 'Custom webhook path (optional)',
          displayOptions: {
            show: {
              triggerType: ['webhook'],
            },
          },
        },
        {
          name: 'cronExpression',
          displayName: 'Cron Expression',
          type: 'string',
          required: true,
          placeholder: '0 9 * * 1-5',
          description: 'Cron expression for scheduling',
          displayOptions: {
            show: {
              triggerType: ['schedule'],
            },
          },
        },
        {
          name: 'emailAddress',
          displayName: 'Email Address',
          type: 'string',
          required: true,
          placeholder: 'trigger@example.com',
          description: 'Email address to monitor',
          displayOptions: {
            show: {
              triggerType: ['email'],
            },
          },
        },
        {
          name: 'initialData',
          displayName: 'Initial Data',
          type: 'json',
          default: {},
          description: 'Initial data to pass to the workflow',
        },
      ],
      resources: {
        memoryMB: 16,
        timeoutSeconds: 5,
      },
    };
  }

  async execute(context: NodeExecutionContext): Promise<NodeExecutionResult> {
    const { triggerType, initialData = {} } = context.parameters;

    try {
      this.logger.log(`Trigger executed: ${triggerType}`);

      // Merge initial data with any input data
      const outputData = {
        ...initialData,
        ...context.inputData[0],
        _trigger: {
          type: triggerType,
          executionId: context.executionId,
          workflowId: context.workflowId,
          timestamp: new Date().toISOString(),
        },
      };

      return this.createSuccessResult(outputData, {
        triggerType,
        triggeredAt: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(`Trigger execution failed: ${error.message}`);
      return this.createErrorResult(error.message);
    }
  }
}