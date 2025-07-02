import { NodeDefinition } from '../../../domain/entities/node-definition.entity';
import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '../../../domain/interfaces/node-executor.interface';

export const SetNodeDefinition = new NodeDefinition({
  name: 'Set',
  displayName: 'Set',
  description: 'Sets values on the data',
  version: 1,
  group: ['transform'],
  icon: 'fa:pen',
  defaults: {
    name: 'Set',
    color: '#0000FF',
  },
  inputs: ['main'],
  outputs: ['main'],
  properties: [
    {
      name: 'keepOnlySet',
      displayName: 'Keep Only Set',
      type: 'boolean',
      default: false,
      description: 'If true, only the values set on this node are kept and all others are removed',
    },
    {
      name: 'values',
      displayName: 'Values',
      type: 'collection',
      placeholder: 'Add Value',
      default: {},
      typeOptions: {
        multipleValues: true,
      },
      description: 'The values to set',
    },
  ],
});

export class SetNodeExecutor implements INodeExecutor {
  async execute(context: NodeExecutionContext): Promise<NodeExecutionResult> {
    const startTime = Date.now();
    
    try {
      const { keepOnlySet, values } = context.parameters;
      const items = context.inputData || [{}];
      
      const returnData = items.map(item => {
        let newItem = keepOnlySet ? {} : { ...item };
        
        // Apply values to each item
        if (values && typeof values === 'object') {
          Object.keys(values).forEach(key => {
            newItem[key] = values[key];
          });
        }
        
        return newItem;
      });
      
      return {
        success: true,
        data: returnData,
        metadata: {
          executionTime: Date.now() - startTime,
          itemsProcessed: returnData.length,
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
}
