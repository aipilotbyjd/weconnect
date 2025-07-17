import { Injectable, Logger } from '@nestjs/common';
import { WorkflowNode } from '../../../domain/entities/workflow-node.entity';
import { NodeExecutor } from '../node-executor.interface';

export interface ActionConfig {
  actionType: string;
  parameters?: Record<string, any>;
  outputKey?: string;
}

@Injectable()
export class ActionNodeExecutor implements NodeExecutor {
  private readonly logger = new Logger(ActionNodeExecutor.name);

  async execute(
    node: WorkflowNode,
    inputData: Record<string, any>,
    executionId: string,
  ): Promise<Record<string, any>> {
    const config = node.configuration as ActionConfig;
    this.logger.log(
      `Executing action node: ${node.name} (${config.actionType})`,
    );

    try {
      let result: any;

      switch (config.actionType) {
        case 'transform':
          result = this.transformData(inputData, config.parameters);
          break;

        case 'filter':
          result = this.filterData(inputData, config.parameters);
          break;

        case 'aggregate':
          result = this.aggregateData(inputData, config.parameters);
          break;

        case 'merge':
          result = this.mergeData(inputData, config.parameters);
          break;

        case 'split':
          result = this.splitData(inputData, config.parameters);
          break;

        default:
          result = inputData;
      }

      const outputKey = config.outputKey || 'actionResult';
      return {
        ...inputData,
        [outputKey]: result,
        _action: {
          nodeId: node.id,
          nodeName: node.name,
          actionType: config.actionType,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.logger.error(`Action node ${node.name} failed:`, error);
      throw error;
    }
  }

  async validate(configuration: Record<string, any>): Promise<boolean> {
    const config = configuration as ActionConfig;
    return !!config.actionType;
  }

  private transformData(data: any, params: any): any {
    if (!params || !params.mapping) return data;

    const result = {};
    for (const [key, value] of Object.entries(params.mapping)) {
      result[key] = this.getValueByPath(data, value as string);
    }
    return result;
  }

  private filterData(data: any, params: any): any {
    if (!params || !params.condition) return data;

    if (Array.isArray(data)) {
      return data.filter((item) =>
        this.evaluateCondition(item, params.condition),
      );
    }

    return this.evaluateCondition(data, params.condition) ? data : null;
  }

  private aggregateData(data: any, params: any): any {
    if (!Array.isArray(data) || !params || !params.operation) return data;

    switch (params.operation) {
      case 'count':
        return data.length;

      case 'sum':
        return data.reduce(
          (sum, item) => sum + (this.getValueByPath(item, params.field) || 0),
          0,
        );

      case 'average':
        const total = data.reduce(
          (sum, item) => sum + (this.getValueByPath(item, params.field) || 0),
          0,
        );
        return data.length > 0 ? total / data.length : 0;

      case 'min':
        return Math.min(
          ...data.map((item) => this.getValueByPath(item, params.field) || 0),
        );

      case 'max':
        return Math.max(
          ...data.map((item) => this.getValueByPath(item, params.field) || 0),
        );

      default:
        return data;
    }
  }

  private mergeData(data: any, params: any): any {
    if (!params || !params.sources) return data;

    const result = { ...data };
    for (const source of params.sources) {
      const sourceData = this.getValueByPath(data, source);
      if (typeof sourceData === 'object' && sourceData !== null) {
        Object.assign(result, sourceData);
      }
    }
    return result;
  }

  private splitData(data: any, params: any): any {
    if (!params || !params.delimiter) return data;

    if (typeof data === 'string') {
      return data.split(params.delimiter);
    }

    if (
      params.field &&
      typeof this.getValueByPath(data, params.field) === 'string'
    ) {
      return this.getValueByPath(data, params.field).split(params.delimiter);
    }

    return data;
  }

  private evaluateCondition(data: any, condition: any): boolean {
    if (!condition) return true;

    const { field, operator, value } = condition;
    const fieldValue = this.getValueByPath(data, field);

    switch (operator) {
      case 'equals':
        return fieldValue === value;
      case 'notEquals':
        return fieldValue !== value;
      case 'greater':
        return fieldValue > value;
      case 'less':
        return fieldValue < value;
      case 'contains':
        return String(fieldValue).includes(value);
      case 'startsWith':
        return String(fieldValue).startsWith(value);
      case 'endsWith':
        return String(fieldValue).endsWith(value);
      case 'exists':
        return fieldValue !== undefined && fieldValue !== null;
      case 'notExists':
        return fieldValue === undefined || fieldValue === null;
      default:
        return true;
    }
  }

  private getValueByPath(obj: any, path: string): any {
    if (!path) return obj;

    const keys = path.split('.');
    let value = obj;

    for (const key of keys) {
      value = value?.[key];
    }

    return value;
  }
}
