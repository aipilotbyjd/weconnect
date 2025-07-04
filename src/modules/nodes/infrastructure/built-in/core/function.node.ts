import { NodeDefinition } from '../../../domain/entities/node-definition.entity';
import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '../../../domain/interfaces/node-executor.interface';

export const FunctionNodeDefinition = new NodeDefinition({
  name: 'Function',
  displayName: 'Function',
  description: 'Execute custom JavaScript code',
  version: 1,
  group: ['transform'],
  icon: 'fa:code',
  defaults: {
    name: 'Function',
    color: '#FF9922',
  },
  inputs: ['main'],
  outputs: ['main'],
  properties: [
    {
      name: 'functionCode',
      displayName: 'Function',
      type: 'string',
      required: true,
      default: `// Code for each item
for (let item of $input.all()) {
  item.myNewField = 1;
}

return $input.all();`,
      description: 'JavaScript code to execute. Use $input to access input data.',
    },
  ],
});

export class FunctionNodeExecutor implements INodeExecutor {
  async execute(context: NodeExecutionContext): Promise<NodeExecutionResult> {
    const startTime = Date.now();

    try {
      const { functionCode } = context.parameters;
      const items = context.inputData || [{}];

      if (!functionCode || typeof functionCode !== 'string') {
        throw new Error('Function code is required');
      }

      // Create a safe execution context
      const $input = {
        all: () => JSON.parse(JSON.stringify(items)), // Deep clone to prevent mutation
        first: () => items[0] ? JSON.parse(JSON.stringify(items[0])) : undefined,
        last: () => items[items.length - 1] ? JSON.parse(JSON.stringify(items[items.length - 1])) : undefined,
        item: (index: number) => items[index] ? JSON.parse(JSON.stringify(items[index])) : undefined,
      };

      // Create execution context with limited globals
      const executionContext = {
        $input,
        $json: JSON,
        console: {
          log: (...args: any[]) => console.log('[Function Node]', ...args),
        },
        // Add utility functions
        $now: () => new Date(),
        $uuid: () => require('crypto').randomUUID(),
      };

      // Execute the function code
      const func = new Function(...Object.keys(executionContext), functionCode);
      const result = await func(...Object.values(executionContext));

      // Ensure result is an array
      const returnData = Array.isArray(result) ? result : [result];

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
        error: `Function execution error: ${error.message}`,
        metadata: {
          executionTime: Date.now() - startTime,
        },
      };
    }
  }
}
