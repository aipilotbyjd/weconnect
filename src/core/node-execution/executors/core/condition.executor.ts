import { Injectable, Logger } from '@nestjs/common';
import {
  BaseUnifiedNodeExecutor,
  NodeExecutionContext,
  NodeExecutionResult,
  NodeSchema,
} from '../../interfaces/unified-node-executor.interface';

@Injectable()
export class ConditionNodeExecutor extends BaseUnifiedNodeExecutor {
  private readonly logger = new Logger(ConditionNodeExecutor.name);

  getSchema(): NodeSchema {
    return {
      name: 'condition',
      displayName: 'Condition',
      description: 'Route workflow based on conditions',
      version: 1,
      group: ['core', 'logic'],
      icon: 'fas:code-branch',
      color: '#FF9800',
      inputs: ['main'],
      outputs: ['true', 'false'],
      properties: [
        {
          name: 'conditions',
          displayName: 'Conditions',
          type: 'json',
          required: true,
          default: [
            {
              field: '',
              operator: 'equals',
              value: '',
              logicalOperator: 'AND',
            },
          ],
          description: 'Array of conditions to evaluate',
        },
        {
          name: 'combineOperation',
          displayName: 'Combine Operation',
          type: 'options',
          default: 'AND',
          options: [
            { name: 'AND (All conditions must be true)', value: 'AND' },
            { name: 'OR (Any condition must be true)', value: 'OR' },
          ],
          description: 'How to combine multiple conditions',
        },
      ],
      resources: {
        memoryMB: 16,
        timeoutSeconds: 10,
      },
    };
  }

  async execute(context: NodeExecutionContext): Promise<NodeExecutionResult> {
    const { conditions, combineOperation = 'AND' } = context.parameters;

    try {
      if (!Array.isArray(conditions) || conditions.length === 0) {
        return this.createErrorResult('At least one condition is required');
      }

      const inputData = context.inputData[0] || {};
      const results: boolean[] = [];

      for (const condition of conditions) {
        const result = this.evaluateCondition(condition, inputData, context);
        results.push(result);

        this.logger.debug(
          `Condition evaluated: ${condition.field} ${condition.operator} ${condition.value} = ${result}`,
        );
      }

      let finalResult: boolean;

      if (combineOperation === 'AND') {
        finalResult = results.every((r) => r === true);
      } else {
        finalResult = results.some((r) => r === true);
      }

      this.logger.log(`Condition node result: ${finalResult}`);

      // Return result with multiple outputs
      const outputData = {
        conditionResult: finalResult,
        evaluatedConditions: conditions.map((condition, index) => ({
          ...condition,
          result: results[index],
        })),
        inputData,
      };

      return {
        success: true,
        data: [outputData],
        outputs: {
          [finalResult ? 'true' : 'false']: [outputData],
        },
        shouldContinue: true,
        nextNodes: [finalResult ? 'true' : 'false'],
        metadata: {
          conditionResult: finalResult,
          conditionsEvaluated: conditions.length,
          combineOperation,
        },
      };
    } catch (error) {
      this.logger.error(`Condition evaluation failed: ${error.message}`);
      return this.createErrorResult(error.message);
    }
  }

  private evaluateCondition(
    condition: any,
    inputData: any,
    context: NodeExecutionContext,
  ): boolean {
    const { field, operator, value } = condition;

    // Get the actual value from input data
    const actualValue = this.getFieldValue(field, inputData, context);
    const expectedValue = this.replaceVariables(String(value), context);

    switch (operator) {
      case 'equals':
        return this.compareValues(actualValue, expectedValue, '===');
      case 'notEquals':
        return this.compareValues(actualValue, expectedValue, '!==');
      case 'contains':
        return String(actualValue)
          .toLowerCase()
          .includes(String(expectedValue).toLowerCase());
      case 'notContains':
        return !String(actualValue)
          .toLowerCase()
          .includes(String(expectedValue).toLowerCase());
      case 'startsWith':
        return String(actualValue)
          .toLowerCase()
          .startsWith(String(expectedValue).toLowerCase());
      case 'endsWith':
        return String(actualValue)
          .toLowerCase()
          .endsWith(String(expectedValue).toLowerCase());
      case 'greaterThan':
        return this.compareNumbers(actualValue, expectedValue, '>');
      case 'greaterThanOrEqual':
        return this.compareNumbers(actualValue, expectedValue, '>=');
      case 'lessThan':
        return this.compareNumbers(actualValue, expectedValue, '<');
      case 'lessThanOrEqual':
        return this.compareNumbers(actualValue, expectedValue, '<=');
      case 'isEmpty':
        return this.isEmpty(actualValue);
      case 'isNotEmpty':
        return !this.isEmpty(actualValue);
      case 'isNull':
        return actualValue === null || actualValue === undefined;
      case 'isNotNull':
        return actualValue !== null && actualValue !== undefined;
      case 'regex':
        try {
          const regex = new RegExp(expectedValue);
          return regex.test(String(actualValue));
        } catch (error) {
          this.logger.warn(`Invalid regex pattern: ${expectedValue}`);
          return false;
        }
      case 'in':
        try {
          const arrayValue = JSON.parse(expectedValue);
          return Array.isArray(arrayValue) && arrayValue.includes(actualValue);
        } catch (error) {
          return String(expectedValue)
            .split(',')
            .map((v) => v.trim())
            .includes(String(actualValue));
        }
      case 'notIn':
        try {
          const arrayValue = JSON.parse(expectedValue);
          return Array.isArray(arrayValue) && !arrayValue.includes(actualValue);
        } catch (error) {
          return !String(expectedValue)
            .split(',')
            .map((v) => v.trim())
            .includes(String(actualValue));
        }
      default:
        this.logger.warn(`Unknown operator: ${operator}`);
        return false;
    }
  }

  private getFieldValue(
    field: string,
    inputData: any,
    context: NodeExecutionContext,
  ): any {
    if (!field) return inputData;

    // Handle special field references
    if (field.startsWith('$input.')) {
      const path = field.substring(7);
      return this.getNestedValue(inputData, path);
    }

    if (field.startsWith('$node.')) {
      const path = field.substring(6);
      return this.getNestedValue(context.previousNodeOutputs, path);
    }

    if (field.startsWith('$vars.')) {
      const path = field.substring(6);
      return this.getNestedValue(context.workflowVariables, path);
    }

    // Direct field access
    return this.getNestedValue(inputData, field);
  }

  private getNestedValue(obj: any, path: string): any {
    if (!path) return obj;
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private compareValues(actual: any, expected: any, operator: string): boolean {
    // Try to convert to numbers if both look like numbers
    const actualNum = Number(actual);
    const expectedNum = Number(expected);

    if (!isNaN(actualNum) && !isNaN(expectedNum)) {
      switch (operator) {
        case '===':
          return actualNum === expectedNum;
        case '!==':
          return actualNum !== expectedNum;
        default:
          return false;
      }
    }

    // String comparison
    switch (operator) {
      case '===':
        return String(actual) === String(expected);
      case '!==':
        return String(actual) !== String(expected);
      default:
        return false;
    }
  }

  private compareNumbers(
    actual: any,
    expected: any,
    operator: string,
  ): boolean {
    const actualNum = Number(actual);
    const expectedNum = Number(expected);

    if (isNaN(actualNum) || isNaN(expectedNum)) {
      return false;
    }

    switch (operator) {
      case '>':
        return actualNum > expectedNum;
      case '>=':
        return actualNum >= expectedNum;
      case '<':
        return actualNum < expectedNum;
      case '<=':
        return actualNum <= expectedNum;
      default:
        return false;
    }
  }

  private isEmpty(value: any): boolean {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
  }
}
