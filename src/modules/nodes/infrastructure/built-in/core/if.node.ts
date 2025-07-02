import { NodeDefinition } from '../../../domain/entities/node-definition.entity';
import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '../../../domain/interfaces/node-executor.interface';

export const IfNodeDefinition = new NodeDefinition({
  name: 'If',
  displayName: 'IF',
  description: 'Conditional logic node - route data based on conditions',
  version: 1,
  group: ['transform'],
  icon: 'fa:map-signs',
  defaults: {
    name: 'IF',
    color: '#408000',
  },
  inputs: ['main'],
  outputs: ['true', 'false'],
  properties: [
    {
      name: 'conditions',
      displayName: 'Conditions',
      type: 'collection',
      placeholder: 'Add Condition',
      default: {},
      typeOptions: {
        multipleValues: true,
      },
      description: 'The conditions to check',
    },
    {
      name: 'combineOperation',
      displayName: 'Combine',
      type: 'options',
      options: [
        { name: 'AND', value: 'AND' },
        { name: 'OR', value: 'OR' },
      ],
      default: 'AND',
      description: 'How to combine multiple conditions',
    },
  ],
});

export class IfNodeExecutor implements INodeExecutor {
  async execute(context: NodeExecutionContext): Promise<NodeExecutionResult> {
    const startTime = Date.now();
    
    try {
      const { conditions, combineOperation } = context.parameters;
      const items = context.inputData || [{}];
      
      const trueItems: any[] = [];
      const falseItems: any[] = [];
      
      for (const item of items) {
        const conditionResults = this.evaluateConditions(item, conditions);
        const finalResult = combineOperation === 'AND' 
          ? conditionResults.every(r => r)
          : conditionResults.some(r => r);
        
        if (finalResult) {
          trueItems.push(item);
        } else {
          falseItems.push(item);
        }
      }
      
      return {
        success: true,
        data: [trueItems, falseItems], // First output is true, second is false
        metadata: {
          executionTime: Date.now() - startTime,
          itemsProcessed: items.length,
          trueItems: trueItems.length,
          falseItems: falseItems.length,
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

  private evaluateConditions(item: any, conditions: any): boolean[] {
    if (!conditions || typeof conditions !== 'object') {
      return [true]; // Default to true if no conditions
    }

    const results: boolean[] = [];
    
    // Simple condition evaluation - can be extended
    Object.keys(conditions).forEach(key => {
      const condition = conditions[key];
      const itemValue = item[key];
      
      if (condition.operation === 'equal') {
        results.push(itemValue === condition.value);
      } else if (condition.operation === 'notEqual') {
        results.push(itemValue !== condition.value);
      } else if (condition.operation === 'contains') {
        results.push(String(itemValue).includes(String(condition.value)));
      } else if (condition.operation === 'exists') {
        results.push(itemValue !== undefined && itemValue !== null);
      } else {
        results.push(true); // Default to true for unknown operations
      }
    });
    
    return results;
  }
}
