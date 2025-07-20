import { NodeDefinition } from '../../../domain/entities/node-definition.entity';
import {
  INodeExecutor,
  NodeExecutionContext,
  NodeExecutionResult,
} from '../../../../../core/abstracts/base-node.interface';

export const DataTransformerNodeDefinition = new NodeDefinition({
  name: 'DataTransformer',
  displayName: 'Data Transformer',
  description: 'Transform, filter, and manipulate data with powerful operations',
  version: 1,
  group: ['data'],
  icon: 'fa:exchange-alt',
  defaults: {
    name: 'Data Transformer',
    color: '#FF9800',
  },
  inputs: ['main'],
  outputs: ['main'],
  properties: [
    {
      name: 'operation',
      displayName: 'Operation',
      type: 'options',
      options: [
        { name: 'Map Fields', value: 'map' },
        { name: 'Filter Data', value: 'filter' },
        { name: 'Sort Data', value: 'sort' },
        { name: 'Group By', value: 'groupBy' },
        { name: 'Aggregate', value: 'aggregate' },
        { name: 'Merge Objects', value: 'merge' },
        { name: 'Split Array', value: 'split' },
        { name: 'Flatten Object', value: 'flatten' },
        { name: 'Custom JavaScript', value: 'javascript' },
      ],
      default: 'map',
      required: true,
    },
    {
      name: 'fieldMapping',
      displayName: 'Field Mapping',
      type: 'json',
      default: {},
      displayOptions: {
        show: {
          operation: ['map'],
        },
      },
      description: 'Map input fields to output fields. Example: {"newField": "oldField", "computed": "field1 + field2"}',
    },
    {
      name: 'filterCondition',
      displayName: 'Filter Condition',
      type: 'string',
      default: '',
      displayOptions: {
        show: {
          operation: ['filter'],
        },
      },
      description: 'JavaScript expression to filter items. Example: item.age > 18',
    },
    {
      name: 'sortField',
      displayName: 'Sort Field',
      type: 'string',
      default: '',
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
      default: '',
      displayOptions: {
        show: {
          operation: ['groupBy'],
        },
      },
    },
    {
      name: 'aggregateFunction',
      displayName: 'Aggregate Function',
      type: 'options',
      options: [
        { name: 'Count', value: 'count' },
        { name: 'Sum', value: 'sum' },
        { name: 'Average', value: 'avg' },
        { name: 'Min', value: 'min' },
        { name: 'Max', value: 'max' },
        { name: 'Collect', value: 'collect' },
      ],
      default: 'count',
      displayOptions: {
        show: {
          operation: ['aggregate'],
        },
      },
    },
    {
      name: 'aggregateField',
      displayName: 'Aggregate Field',
      type: 'string',
      default: '',
      displayOptions: {
        show: {
          operation: ['aggregate'],
          aggregateFunction: ['sum', 'avg', 'min', 'max', 'collect'],
        },
      },
    },
    {
      name: 'mergeStrategy',
      displayName: 'Merge Strategy',
      type: 'options',
      options: [
        { name: 'Shallow Merge', value: 'shallow' },
        { name: 'Deep Merge', value: 'deep' },
        { name: 'Overwrite', value: 'overwrite' },
      ],
      default: 'shallow',
      displayOptions: {
        show: {
          operation: ['merge'],
        },
      },
    },
    {
      name: 'splitField',
      displayName: 'Array Field to Split',
      type: 'string',
      default: '',
      displayOptions: {
        show: {
          operation: ['split'],
        },
      },
      description: 'Field containing array to split into separate items',
    },
    {
      name: 'flattenDepth',
      displayName: 'Flatten Depth',
      type: 'number',
      default: 1,
      displayOptions: {
        show: {
          operation: ['flatten'],
        },
      },
      description: 'How many levels deep to flatten (0 = unlimited)',
    },
    {
      name: 'javascriptCode',
      displayName: 'JavaScript Code',
      type: 'string',
      default: '// Transform the data\nreturn items.map(item => {\n  // Your transformation logic here\n  return item;\n});',
      displayOptions: {
        show: {
          operation: ['javascript'],
        },
      },
      description: 'Custom JavaScript code. Available variables: items (array), item (current item in loop)',
    },
    {
      name: 'continueOnError',
      displayName: 'Continue on Error',
      type: 'boolean',
      default: false,
      description: 'Continue processing even if some items fail',
    },
  ],
});

export class DataTransformerNodeExecutor implements INodeExecutor {
  async execute(context: NodeExecutionContext): Promise<NodeExecutionResult> {
    const startTime = Date.now();
    
    try {
      const inputData = context.inputData || [];
      const operation = context.parameters.operation;
      const continueOnError = context.parameters.continueOnError || false;

      let result: any;

      switch (operation) {
        case 'map':
          result = await this.mapFields(inputData, context.parameters.fieldMapping, continueOnError);
          break;
        case 'filter':
          result = await this.filterData(inputData, context.parameters.filterCondition, continueOnError);
          break;
        case 'sort':
          result = await this.sortData(inputData, context.parameters.sortField, context.parameters.sortOrder);
          break;
        case 'groupBy':
          result = await this.groupByField(inputData, context.parameters.groupByField);
          break;
        case 'aggregate':
          result = await this.aggregateData(
            inputData, 
            context.parameters.groupByField,
            context.parameters.aggregateFunction,
            context.parameters.aggregateField
          );
          break;
        case 'merge':
          result = await this.mergeObjects(inputData, context.parameters.mergeStrategy);
          break;
        case 'split':
          result = await this.splitArray(inputData, context.parameters.splitField);
          break;
        case 'flatten':
          result = await this.flattenObjects(inputData, context.parameters.flattenDepth);
          break;
        case 'javascript':
          result = await this.executeJavaScript(inputData, context.parameters.javascriptCode);
          break;
        default:
          throw new Error(`Unsupported operation: ${operation}`);
      }

      return {
        success: true,
        data: result,
        metadata: {
          executionTime: Date.now() - startTime,
          operation,
          itemsProcessed: Array.isArray(inputData) ? inputData.length : 1,
          itemsOutput: Array.isArray(result) ? result.length : 1,
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

  private async mapFields(data: any[], fieldMapping: any, continueOnError: boolean): Promise<any[]> {
    const mapping = typeof fieldMapping === 'string' ? JSON.parse(fieldMapping) : fieldMapping;
    const results: any[] = [];
    const errors: any[] = [];

    for (const item of data) {
      try {
        const mappedItem: any = {};
        
        for (const [newField, expression] of Object.entries(mapping)) {
          if (typeof expression === 'string') {
            // Simple field mapping or expression
            if (expression.includes('+') || expression.includes('-') || expression.includes('*') || expression.includes('/')) {
              // Mathematical expression
              mappedItem[newField] = this.evaluateExpression(expression, item);
            } else {
              // Simple field reference
              mappedItem[newField] = this.getNestedValue(item, expression as string);
            }
          } else {
            mappedItem[newField] = expression;
          }
        }
        
        results.push(mappedItem);
      } catch (error) {
        if (continueOnError) {
          errors.push({ item, error: error.message });
        } else {
          throw error;
        }
      }
    }

    return results;
  }

  private async filterData(data: any[], condition: string, continueOnError: boolean): Promise<any[]> {
    if (!condition) return data;

    const results: any[] = [];
    
    for (const item of data) {
      try {
        const shouldInclude = this.evaluateCondition(condition, item);
        if (shouldInclude) {
          results.push(item);
        }
      } catch (error) {
        if (!continueOnError) {
          throw error;
        }
      }
    }

    return results;
  }

  private async sortData(data: any[], sortField: string, sortOrder: string): Promise<any[]> {
    if (!sortField) return data;

    return [...data].sort((a, b) => {
      const aVal = this.getNestedValue(a, sortField);
      const bVal = this.getNestedValue(b, sortField);
      
      let comparison = 0;
      if (aVal > bVal) comparison = 1;
      if (aVal < bVal) comparison = -1;
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }

  private async groupByField(data: any[], groupField: string): Promise<any[]> {
    if (!groupField) return data;

    const groups: { [key: string]: any[] } = {};
    
    for (const item of data) {
      const groupValue = this.getNestedValue(item, groupField);
      const key = String(groupValue);
      
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
    }

    return Object.entries(groups).map(([key, items]) => ({
      groupKey: key,
      items,
      count: items.length,
    }));
  }

  private async aggregateData(
    data: any[], 
    groupField: string, 
    aggregateFunction: string, 
    aggregateField: string
  ): Promise<any[]> {
    const grouped = await this.groupByField(data, groupField);
    
    return grouped.map(group => {
      let aggregateValue: any;
      
      switch (aggregateFunction) {
        case 'count':
          aggregateValue = group.count;
          break;
        case 'sum':
          aggregateValue = group.items.reduce((sum, item) => 
            sum + (Number(this.getNestedValue(item, aggregateField)) || 0), 0);
          break;
        case 'avg':
          const sum = group.items.reduce((sum, item) => 
            sum + (Number(this.getNestedValue(item, aggregateField)) || 0), 0);
          aggregateValue = sum / group.count;
          break;
        case 'min':
          aggregateValue = Math.min(...group.items.map(item => 
            Number(this.getNestedValue(item, aggregateField)) || 0));
          break;
        case 'max':
          aggregateValue = Math.max(...group.items.map(item => 
            Number(this.getNestedValue(item, aggregateField)) || 0));
          break;
        case 'collect':
          aggregateValue = group.items.map(item => this.getNestedValue(item, aggregateField));
          break;
        default:
          aggregateValue = group.count;
      }

      return {
        groupKey: group.groupKey,
        [aggregateFunction]: aggregateValue,
        count: group.count,
      };
    });
  }

  private async mergeObjects(data: any[], strategy: string): Promise<any> {
    if (data.length === 0) return {};
    if (data.length === 1) return data[0];

    let result = {};
    
    for (const item of data) {
      if (strategy === 'deep') {
        result = this.deepMerge(result, item);
      } else {
        result = { ...result, ...item };
      }
    }

    return result;
  }

  private async splitArray(data: any[], splitField: string): Promise<any[]> {
    const results: any[] = [];
    
    for (const item of data) {
      const arrayValue = this.getNestedValue(item, splitField);
      
      if (Array.isArray(arrayValue)) {
        for (const arrayItem of arrayValue) {
          results.push({
            ...item,
            [splitField]: arrayItem,
          });
        }
      } else {
        results.push(item);
      }
    }

    return results;
  }

  private async flattenObjects(data: any[], depth: number): Promise<any[]> {
    return data.map(item => this.flattenObject(item, depth));
  }

  private async executeJavaScript(data: any[], code: string): Promise<any> {
    // Create a safe execution context
    const context = {
      items: data,
      console: {
        log: (...args: any[]) => console.log('[DataTransformer]', ...args),
      },
      Math,
      Date,
      JSON,
      String,
      Number,
      Boolean,
      Array,
      Object,
    };

    // Create function with the provided code
    const func = new Function('items', 'console', 'Math', 'Date', 'JSON', 'String', 'Number', 'Boolean', 'Array', 'Object', code);
    
    return func(
      context.items,
      context.console,
      context.Math,
      context.Date,
      context.JSON,
      context.String,
      context.Number,
      context.Boolean,
      context.Array,
      context.Object
    );
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private evaluateExpression(expression: string, item: any): any {
    // Simple expression evaluator - replace field references with values
    let evaluatedExpression = expression;
    
    // Find field references (words that aren't operators)
    const fieldMatches = expression.match(/[a-zA-Z_][a-zA-Z0-9_.]*(?![+\-*/()])/g);
    
    if (fieldMatches) {
      for (const field of fieldMatches) {
        const value = this.getNestedValue(item, field);
        evaluatedExpression = evaluatedExpression.replace(
          new RegExp(`\\b${field}\\b`, 'g'), 
          String(value || 0)
        );
      }
    }

    // Safely evaluate the expression
    try {
      return Function(`"use strict"; return (${evaluatedExpression})`)();
    } catch {
      return null;
    }
  }

  private evaluateCondition(condition: string, item: any): boolean {
    // Replace 'item.' references with actual values
    let evaluatedCondition = condition.replace(/item\.([a-zA-Z_][a-zA-Z0-9_.]*)/g, (match, field) => {
      const value = this.getNestedValue(item, field);
      return typeof value === 'string' ? `"${value}"` : String(value);
    });

    // Replace standalone 'item' with the item object
    evaluatedCondition = evaluatedCondition.replace(/\bitem\b/g, JSON.stringify(item));

    try {
      return Function(`"use strict"; return (${evaluatedCondition})`)();
    } catch {
      return false;
    }
  }

  private deepMerge(target: any, source: any): any {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  private flattenObject(obj: any, depth: number, currentDepth: number = 0): any {
    const result: any = {};
    
    for (const key in obj) {
      const value = obj[key];
      
      if (value && typeof value === 'object' && !Array.isArray(value) && 
          (depth === 0 || currentDepth < depth)) {
        const flattened = this.flattenObject(value, depth, currentDepth + 1);
        for (const flatKey in flattened) {
          result[`${key}.${flatKey}`] = flattened[flatKey];
        }
      } else {
        result[key] = value;
      }
    }
    
    return result;
  }

  validate(configuration: Record<string, any>): boolean {
    return !!configuration.operation;
  }

  getConfigurationSchema(): any {
    return {
      type: 'object',
      properties: {
        operation: { 
          type: 'string', 
          enum: ['map', 'filter', 'sort', 'groupBy', 'aggregate', 'merge', 'split', 'flatten', 'javascript'] 
        },
      },
      required: ['operation'],
    };
  }
}