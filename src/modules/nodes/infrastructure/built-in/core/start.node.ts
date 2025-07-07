import { NodeDefinition } from '../../../domain/entities/node-definition.entity';
import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '../../../../../core/abstracts/base-node.interface';

export const StartNodeDefinition = new NodeDefinition({
  name: 'Start',
  displayName: 'Start',
  description: 'The entry point of every workflow',
  version: 1,
  group: ['trigger'],
  icon: 'fa:play',
  defaults: {
    name: 'Start',
    color: '#00ff00',
  },
  inputs: [],
  outputs: ['main'],
  properties: [
    {
      name: 'manualTrigger',
      displayName: 'Manual Trigger',
      type: 'boolean',
      default: true,
      description: 'Whether this workflow can be triggered manually',
    },
  ],
});

export class StartNodeExecutor implements INodeExecutor {
  async execute(context: NodeExecutionContext): Promise<NodeExecutionResult> {
    const startTime = Date.now();
    
    try {
      // Start node simply passes through any input data or creates initial data
      const outputData = context.inputData.length > 0 ? context.inputData : [{}];
      
      return {
        success: true,
        data: outputData,
        metadata: {
          executionTime: Date.now() - startTime,
          itemsProcessed: outputData.length,
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
      properties: {
        manualTrigger: {
          type: 'boolean'
        }
      }
    };
  }
}
