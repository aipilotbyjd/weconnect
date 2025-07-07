import { NodeDefinition } from '../../../domain/entities/node-definition.entity';
import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '../../../../../core/abstracts/base-node.interface';

export const JsonTransformNodeDefinition = new NodeDefinition({
  name: 'JsonTransform',
  displayName: 'JSON Transform',
  description: 'Transform JSON data using JSONPath expressions and custom mapping',
  version: 1,
  group: ['data'],
  icon: 'fa:code',
  defaults: {
    name: 'JSON Transform',
    color: '#8B5CF6',
  },
  inputs: ['main'],
  outputs: ['main'],
  properties: [
    {
      name: 'operation',
      displayName: 'Operation',
      type: 'options',
      options: [
        { name: 'Extract Values', value: 'extract' },
        { name: 'Transform Structure', value: 'transform' },
        { name: 'Filter Array', value: 'filter' },
        { name: 'Sort Array', value: 'sort' },
        { name: 'Group By', value: 'groupBy' },
      ],
      default: 'extract',
      required: true,
    },
    {
      name: 'jsonPath',
      displayName: 'JSON Path',
      type: 'string',
      placeholder: '$.data[*].name',
      description: 'JSONPath expression to extract data',
      displayOptions: {
        show: {
          operation: ['extract'],
        },
      },
    },
    {
      name: 'mapping',
      displayName: 'Field Mapping',
      type: 'json',
      default: {
        'newField': '$.oldField',
        'userName': '$.user.name',
        'userEmail': '$.user.email'
      },
      description: 'Map fields using JSONPath expressions',
      displayOptions: {
        show: {
          operation: ['transform'],
        },
      },
    },
    {
      name: 'filterExpression',
      displayName: 'Filter Expression',
      type: 'string',
      placeholder: 'item.status === "active"',
      description: 'JavaScript expression to filter array items',
      displayOptions: {
        show: {
          operation: ['filter'],
        },
      },
    },
    {
      name: 'sortField',
      displayName: 'Sort Field',
      type: 'string',
      placeholder: 'createdAt',
      description: 'Field to sort by',
      displayOptions: {
        show: {
          operation: ['sort'],
        },
      },
    },
    {
      name: 'sortOrder',
      displayName: 'Sort Order',
      type: 'options',
      options: [
        { name: 'Ascending', value: 'asc' },
        { name: 'Descending', value: 'desc' },
      ],
      default: 'asc',
      displayOptions: {
        show: {
          operation: ['sort'],
        },
      },
    },
    {
      name: 'groupByField',
      displayName: 'Group By Field',
      type: 'string',
      placeholder: 'category',
      description: 'Field to group array items by',
      displayOptions: {
        show: {
          operation: ['groupBy'],
        },
      },
    },
  ],
});

export class JsonTransformNodeExecutor implements INodeExecutor {
  async execute(context: NodeExecutionContext): Promise<NodeExecutionResult> {
    const startTime = Date.now();
    
    try {
      const { operation, jsonPath, mapping, filterExpression, sortField, sortOrder, groupByField } = context.parameters;
      const results: any[] = [];

      for (const item of context.inputData) {
        let result;

        switch (operation) {
          case 'extract':
            result = this.extractValues(item, jsonPath);
            break;
          case 'transform':
            result = this.transformStructure(item, mapping);
            break;
          case 'filter':
            result = this.filterArray(item, filterExpression);
            break;
          case 'sort':
            result = this.sortArray(item, sortField, sortOrder);
            break;
          case 'groupBy':
            result = this.groupBy(item, groupByField);
            break;
          default:
            throw new Error(`Unknown operation: ${operation}`);
        }

        results.push(result);
      }

      return {
        success: true,
        data: results,
        metadata: {
          executionTime: Date.now() - startTime,
          itemsProcessed: results.length,
          operation,
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

  private extractValues(data: any, jsonPath: string): any {
    if (!jsonPath) {
      throw new Error('JSON Path is required for extract operation');
    }

    try {
      if (jsonPath.startsWith('$.')) {
        const path = jsonPath.substring(2);
        return this.getNestedValue(data, path);
      }
      return data;
    } catch (error) {
      throw new Error(`Failed to extract values: ${error.message}`);
    }
  }

  private transformStructure(data: any, mapping: Record<string, string>): any {
    if (!mapping || typeof mapping !== 'object') {
      throw new Error('Field mapping is required for transform operation');
    }

    const result: Record<string, any> = {};

    for (const [newField, jsonPath] of Object.entries(mapping)) {
      try {
        if (typeof jsonPath === 'string' && jsonPath.startsWith('$.')) {
          const path = jsonPath.substring(2);
          result[newField] = this.getNestedValue(data, path);
        } else {
          result[newField] = jsonPath;
        }
      } catch (error) {
        result[newField] = null;
      }
    }

    return result;
  }

  private filterArray(data: any, expression: string): any {
    if (!Array.isArray(data)) {
      throw new Error('Input data must be an array for filter operation');
    }

    if (!expression) {
      throw new Error('Filter expression is required');
    }

    try {
      return data.filter(item => {
        // Simple expression evaluation (in production, use a safer evaluator)
        const func = new Function('item', `return ${expression}`);
        return func(item);
      });
    } catch (error) {
      throw new Error(`Failed to filter array: ${error.message}`);
    }
  }

  private sortArray(data: any, field: string, order: string = 'asc'): any {
    if (!Array.isArray(data)) {
      throw new Error('Input data must be an array for sort operation');
    }

    if (!field) {
      throw new Error('Sort field is required');
    }

    try {
      return [...data].sort((a, b) => {
        const aVal = this.getNestedValue(a, field);
        const bVal = this.getNestedValue(b, field);

        if (aVal < bVal) return order === 'asc' ? -1 : 1;
        if (aVal > bVal) return order === 'asc' ? 1 : -1;
        return 0;
      });
    } catch (error) {
      throw new Error(`Failed to sort array: ${error.message}`);
    }
  }

  private groupBy(data: any, field: string): any {
    if (!Array.isArray(data)) {
      throw new Error('Input data must be an array for groupBy operation');
    }

    if (!field) {
      throw new Error('Group by field is required');
    }

    try {
      const groups: Record<string, any[]> = {};

      for (const item of data) {
        const groupKey = this.getNestedValue(item, field);
        const key = String(groupKey);
        
        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(item);
      }

      return groups;
    } catch (error) {
      throw new Error(`Failed to group array: ${error.message}`);
    }
  }

  private getNestedValue(obj: any, path: string): any {
    if (!path) return obj;
    
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (current === null || current === undefined) {
        return undefined;
      }
      
      // Handle array notation [index] or [*]
      if (key.includes('[') && key.includes(']')) {
        const arrayKey = key.substring(0, key.indexOf('['));
        const indexPart = key.substring(key.indexOf('[') + 1, key.indexOf(']'));
        
        if (arrayKey) {
          current = current[arrayKey];
        }
        
        if (indexPart === '*') {
          // Return all array items
          return current;
        } else {
          const index = parseInt(indexPart);
          current = current[index];
        }
      } else {
        current = current[key];
      }
    }
    
    return current;
  }

  validate(configuration: Record<string, any>): boolean {
    // Basic validation - override in specific implementations
    return true;
  }

  getConfigurationSchema(): any {
    return {
      type: 'object',
      properties: {},
      required: []
    };
  }

}