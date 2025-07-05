import { Injectable, Logger } from '@nestjs/common';
import { DynamicTool } from '@langchain/core/tools';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

export enum BuiltInToolType {
  HTTP_REQUEST = 'http_request',
  WORKFLOW_DATA = 'workflow_data',
  EMAIL_SENDER = 'email_sender',
  SLACK_SENDER = 'slack_sender',
  DATABASE_QUERY = 'database_query',
  TEXT_PROCESSOR = 'text_processor',
  DATE_TIME = 'date_time',
  JSON_PARSER = 'json_parser',
  CALCULATOR = 'calculator',
  WEB_SEARCH = 'web_search'
}

export interface ToolConfig {
  name: string;
  description: string;
  parameters?: Record<string, any>;
}

@Injectable()
export class AIToolService {
  private readonly logger = new Logger(AIToolService.name);

  constructor(private readonly httpService: HttpService) {}

  /**
   * Get all available built-in tools
   */
  getAvailableTools(): ToolConfig[] {
    return [
      {
        name: BuiltInToolType.HTTP_REQUEST,
        description: 'Make HTTP requests to external APIs',
        parameters: {
          url: { type: 'string', required: true },
          method: { type: 'string', default: 'GET' },
          headers: { type: 'object', default: {} },
          body: { type: 'object', default: null }
        }
      },
      {
        name: BuiltInToolType.WORKFLOW_DATA,
        description: 'Access data from previous workflow nodes',
        parameters: {
          nodeId: { type: 'string', required: true },
          dataPath: { type: 'string', default: '' }
        }
      },
      {
        name: BuiltInToolType.EMAIL_SENDER,
        description: 'Send emails using configured SMTP',
        parameters: {
          to: { type: 'string', required: true },
          subject: { type: 'string', required: true },
          body: { type: 'string', required: true },
          html: { type: 'boolean', default: false }
        }
      },
      {
        name: BuiltInToolType.TEXT_PROCESSOR,
        description: 'Process and manipulate text data',
        parameters: {
          text: { type: 'string', required: true },
          operation: { 
            type: 'string', 
            required: true,
            enum: ['uppercase', 'lowercase', 'trim', 'length', 'split', 'replace']
          }
        }
      },
      {
        name: BuiltInToolType.DATE_TIME,
        description: 'Get current date/time or format dates',
        parameters: {
          operation: { 
            type: 'string', 
            required: true,
            enum: ['now', 'format', 'add', 'subtract']
          },
          format: { type: 'string', default: 'ISO' }
        }
      },
      {
        name: BuiltInToolType.JSON_PARSER,
        description: 'Parse, stringify, or manipulate JSON data',
        parameters: {
          operation: { 
            type: 'string', 
            required: true,
            enum: ['parse', 'stringify', 'extract', 'merge']
          },
          data: { type: 'any', required: true }
        }
      },
      {
        name: BuiltInToolType.CALCULATOR,
        description: 'Perform mathematical calculations',
        parameters: {
          expression: { type: 'string', required: true }
        }
      }
    ];
  }

  /**
   * Create LangChain tools based on configuration
   */
  createTools(toolConfigs: ToolConfig[], workflowContext?: any): DynamicTool[] {
    const tools: DynamicTool[] = [];

    for (const config of toolConfigs) {
      try {
        const tool = this.createSingleTool(config, workflowContext);
        if (tool) {
          tools.push(tool);
        }
      } catch (error) {
        this.logger.error(`Failed to create tool ${config.name}:`, error);
      }
    }

    return tools;
  }

  /**
   * Create a single LangChain tool
   */
  private createSingleTool(config: ToolConfig, workflowContext?: any): DynamicTool | null {
    switch (config.name) {
      case BuiltInToolType.HTTP_REQUEST:
        return this.createHttpRequestTool();

      case BuiltInToolType.WORKFLOW_DATA:
        return this.createWorkflowDataTool(workflowContext);

      case BuiltInToolType.TEXT_PROCESSOR:
        return this.createTextProcessorTool();

      case BuiltInToolType.DATE_TIME:
        return this.createDateTimeTool();

      case BuiltInToolType.JSON_PARSER:
        return this.createJsonParserTool();

      case BuiltInToolType.CALCULATOR:
        return this.createCalculatorTool();

      default:
        this.logger.warn(`Unknown tool type: ${config.name}`);
        return null;
    }
  }

  /**
   * Create HTTP Request Tool
   */
  private createHttpRequestTool(): DynamicTool {
    return new DynamicTool({
      name: 'http_request',
      description: 'Make HTTP requests to external APIs. Input should be JSON with url, method (optional), headers (optional), and body (optional).',
      func: async (input: string) => {
        try {
          const params = JSON.parse(input);
          const { url, method = 'GET', headers = {}, body } = params;

          const response = await lastValueFrom(
            this.httpService.request({
              url,
              method,
              headers,
              data: body,
            })
          );

          return JSON.stringify({
            status: response.status,
            headers: response.headers,
            data: response.data,
          });
        } catch (error) {
          return JSON.stringify({
            error: error.message,
            status: error.response?.status || 'unknown',
          });
        }
      },
    });
  }

  /**
   * Create Workflow Data Tool
   */
  private createWorkflowDataTool(workflowContext?: any): DynamicTool {
    return new DynamicTool({
      name: 'workflow_data',
      description: 'Get data from previous workflow nodes. Input should be JSON with nodeId and optional dataPath.',
      func: async (input: string) => {
        try {
          const params = JSON.parse(input);
          const { nodeId, dataPath = '' } = params;

          if (!workflowContext || !workflowContext.previousNodeOutputs) {
            return JSON.stringify({ error: 'No workflow context available' });
          }

          const nodeData = workflowContext.previousNodeOutputs[nodeId];
          if (!nodeData) {
            return JSON.stringify({ error: `No data found for node ${nodeId}` });
          }

          // If dataPath is provided, extract specific data
          if (dataPath) {
            const pathParts = dataPath.split('.');
            let result = nodeData;
            for (const part of pathParts) {
              result = result?.[part];
            }
            return JSON.stringify(result);
          }

          return JSON.stringify(nodeData);
        } catch (error) {
          return JSON.stringify({ error: error.message });
        }
      },
    });
  }

  /**
   * Create Text Processor Tool
   */
  private createTextProcessorTool(): DynamicTool {
    return new DynamicTool({
      name: 'text_processor',
      description: 'Process text data. Input should be JSON with text and operation (uppercase, lowercase, trim, length, split, replace).',
      func: async (input: string) => {
        try {
          const params = JSON.parse(input);
          const { text, operation, ...args } = params;

          switch (operation) {
            case 'uppercase':
              return text.toUpperCase();
            case 'lowercase':
              return text.toLowerCase();
            case 'trim':
              return text.trim();
            case 'length':
              return text.length.toString();
            case 'split':
              return JSON.stringify(text.split(args.separator || ' '));
            case 'replace':
              return text.replace(new RegExp(args.search || '', args.flags || 'g'), args.replace || '');
            default:
              return JSON.stringify({ error: `Unknown operation: ${operation}` });
          }
        } catch (error) {
          return JSON.stringify({ error: error.message });
        }
      },
    });
  }

  /**
   * Create Date Time Tool
   */
  private createDateTimeTool(): DynamicTool {
    return new DynamicTool({
      name: 'date_time',
      description: 'Work with dates and times. Input should be JSON with operation (now, format, add, subtract) and optional parameters.',
      func: async (input: string) => {
        try {
          const params = JSON.parse(input);
          const { operation, format = 'ISO', date, amount, unit } = params;

          const now = new Date();

          switch (operation) {
            case 'now':
              return format === 'ISO' ? now.toISOString() : now.toLocaleString();
            case 'format':
              const targetDate = date ? new Date(date) : now;
              return format === 'ISO' ? targetDate.toISOString() : targetDate.toLocaleString();
            case 'add':
            case 'subtract':
              const baseDate = date ? new Date(date) : now;
              const multiplier = operation === 'add' ? 1 : -1;
              const amountMs = this.convertToMilliseconds(amount, unit) * multiplier;
              const resultDate = new Date(baseDate.getTime() + amountMs);
              return format === 'ISO' ? resultDate.toISOString() : resultDate.toLocaleString();
            default:
              return JSON.stringify({ error: `Unknown operation: ${operation}` });
          }
        } catch (error) {
          return JSON.stringify({ error: error.message });
        }
      },
    });
  }

  /**
   * Create JSON Parser Tool
   */
  private createJsonParserTool(): DynamicTool {
    return new DynamicTool({
      name: 'json_parser',
      description: 'Parse, stringify, or manipulate JSON data. Input should be JSON with operation and data.',
      func: async (input: string) => {
        try {
          const params = JSON.parse(input);
          const { operation, data, path, mergeData } = params;

          switch (operation) {
            case 'parse':
              return JSON.stringify(JSON.parse(data));
            case 'stringify':
              return JSON.stringify(data);
            case 'extract':
              const pathParts = path.split('.');
              let result = data;
              for (const part of pathParts) {
                result = result?.[part];
              }
              return JSON.stringify(result);
            case 'merge':
              return JSON.stringify({ ...data, ...mergeData });
            default:
              return JSON.stringify({ error: `Unknown operation: ${operation}` });
          }
        } catch (error) {
          return JSON.stringify({ error: error.message });
        }
      },
    });
  }

  /**
   * Create Calculator Tool
   */
  private createCalculatorTool(): DynamicTool {
    return new DynamicTool({
      name: 'calculator',
      description: 'Perform mathematical calculations. Input should be a mathematical expression as a string.',
      func: async (input: string) => {
        try {
          // Basic safe evaluation - only allow numbers and basic operators
          const sanitized = input.replace(/[^0-9+\-*/().\s]/g, '');
          if (sanitized !== input) {
            return JSON.stringify({ error: 'Invalid characters in expression' });
          }

          // Use Function constructor for safe evaluation
          const result = new Function(`"use strict"; return (${sanitized})`)();
          return result.toString();
        } catch (error) {
          return JSON.stringify({ error: error.message });
        }
      },
    });
  }

  /**
   * Helper method to convert time units to milliseconds
   */
  private convertToMilliseconds(amount: number, unit: string): number {
    const units = {
      milliseconds: 1,
      seconds: 1000,
      minutes: 60 * 1000,
      hours: 60 * 60 * 1000,
      days: 24 * 60 * 60 * 1000,
    };

    return amount * (units[unit] || 1);
  }
}
