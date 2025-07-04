import { Injectable, Logger } from '@nestjs/common';
import { WorkflowNode } from '../../../domain/entities/workflow-node.entity';
import { NodeExecutor } from '../node-executor.interface';

export interface ConditionConfig {
  conditions: Array<{
    field: string;
    operator: string;
    value: any;
    combineWith?: 'AND' | 'OR';
  }>;
  defaultOutput?: 'true' | 'false';
}

@Injectable()
export class ConditionNodeExecutor implements NodeExecutor {
  private readonly logger = new Logger(ConditionNodeExecutor.name);

  constructor() { }

  async execute(
    node: WorkflowNode,
    inputData: Record<string, any>,
    executionId: string,
  ): Promise<Record<string, any>> {
    const config = node.configuration as ConditionConfig;
    this.logger.log(`Evaluating condition node: ${node.name}`);

    try {
      const result = this.evaluateConditions(inputData, config.conditions);

      // Return data with condition result
      const output: Record<string, any> = {
        ...inputData,
        _condition: {
          nodeId: node.id,
          nodeName: node.name,
          result,
          timestamp: new Date().toISOString(),
          evaluatedConditions: config.conditions.map(cond => ({
            ...cond,
            fieldValue: this.getValueByPath(inputData, cond.field),
            result: this.evaluateSingleCondition(inputData, cond),
          })),
        },
        _conditionBranch: result ? 'true' : 'false',
      };

      return output;
    } catch (error) {
      this.logger.error(`Condition node ${node.name} failed:`, error);
      throw error;
    }
  }

  async validate(configuration: Record<string, any>): Promise<boolean> {
    const config = configuration as ConditionConfig;
    return !!(config.conditions && Array.isArray(config.conditions) && config.conditions.length > 0);
  }

  private evaluateConditions(data: any, conditions: ConditionConfig['conditions']): boolean {
    if (!conditions || conditions.length === 0) return true;

    let result = this.evaluateSingleCondition(data, conditions[0]);

    for (let i = 1; i < conditions.length; i++) {
      const condition = conditions[i];
      const currentResult = this.evaluateSingleCondition(data, condition);
      const combineWith = conditions[i - 1].combineWith || 'AND';

      if (combineWith === 'AND') {
        result = result && currentResult;
      } else {
        result = result || currentResult;
      }
    }

    return result;
  }

  private evaluateSingleCondition(data: any, condition: any): boolean {
    const { field, operator, value } = condition;
    const fieldValue = this.getValueByPath(data, field);

    switch (operator) {
      case 'equals':
      case '==':
        return fieldValue == value;

      case 'strictEquals':
      case '===':
        return fieldValue === value;

      case 'notEquals':
      case '!=':
        return fieldValue != value;

      case 'strictNotEquals':
      case '!==':
        return fieldValue !== value;

      case 'greater':
      case '>':
        return Number(fieldValue) > Number(value);

      case 'greaterOrEqual':
      case '>=':
        return Number(fieldValue) >= Number(value);

      case 'less':
      case '<':
        return Number(fieldValue) < Number(value);

      case 'lessOrEqual':
      case '<=':
        return Number(fieldValue) <= Number(value);

      case 'contains':
        return String(fieldValue).toLowerCase().includes(String(value).toLowerCase());

      case 'notContains':
        return !String(fieldValue).toLowerCase().includes(String(value).toLowerCase());

      case 'startsWith':
        return String(fieldValue).startsWith(String(value));

      case 'endsWith':
        return String(fieldValue).endsWith(String(value));

      case 'matches':
        try {
          const regex = new RegExp(value);
          return regex.test(String(fieldValue));
        } catch {
          return false;
        }

      case 'in':
        return Array.isArray(value) ? value.includes(fieldValue) : false;

      case 'notIn':
        return Array.isArray(value) ? !value.includes(fieldValue) : true;

      case 'exists':
      case 'isSet':
        return fieldValue !== undefined && fieldValue !== null;

      case 'notExists':
      case 'isNotSet':
        return fieldValue === undefined || fieldValue === null;

      case 'isEmpty':
        return fieldValue === '' || fieldValue === null || fieldValue === undefined ||
          (Array.isArray(fieldValue) && fieldValue.length === 0) ||
          (typeof fieldValue === 'object' && Object.keys(fieldValue).length === 0);

      case 'isNotEmpty':
        return !(fieldValue === '' || fieldValue === null || fieldValue === undefined ||
          (Array.isArray(fieldValue) && fieldValue.length === 0) ||
          (typeof fieldValue === 'object' && Object.keys(fieldValue).length === 0));

      case 'isTrue':
        return fieldValue === true || fieldValue === 'true' || fieldValue === 1 || fieldValue === '1';

      case 'isFalse':
        return fieldValue === false || fieldValue === 'false' || fieldValue === 0 || fieldValue === '0';

      case 'isNumber':
        return !isNaN(Number(fieldValue)) && fieldValue !== null && fieldValue !== '';

      case 'isString':
        return typeof fieldValue === 'string';

      case 'isArray':
        return Array.isArray(fieldValue);

      case 'isObject':
        return typeof fieldValue === 'object' && fieldValue !== null && !Array.isArray(fieldValue);

      default:
        this.logger.warn(`Unknown operator: ${operator}`);
        return false;
    }
  }

  private getValueByPath(obj: any, path: string): any {
    if (!path) return obj;

    const keys = path.split('.');
    let value = obj;

    for (const key of keys) {
      if (value === null || value === undefined) return undefined;

      // Handle array index notation like items[0]
      const arrayMatch = key.match(/^(.+)\[(\d+)\]$/);
      if (arrayMatch) {
        value = value[arrayMatch[1]];
        if (Array.isArray(value)) {
          value = value[parseInt(arrayMatch[2])];
        }
      } else {
        value = value[key];
      }
    }

    return value;
  }
}
