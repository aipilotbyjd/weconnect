import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { WorkflowNode } from '../../../domain/entities/workflow-node.entity';
import { NodeExecutor } from '../node-executor.interface';

@Injectable()
export class HttpRequestNodeExecutor implements NodeExecutor {
  private readonly logger = new Logger(HttpRequestNodeExecutor.name);

  constructor(private httpService: HttpService) { }

  async execute(
    node: WorkflowNode,
    inputData: Record<string, any>,
    executionId: string,
  ): Promise<Record<string, any>> {
    const config = node.configuration;

    if (!config.url) {
      throw new Error('HTTP Request node requires URL configuration');
    }

    try {
      const method = config.method || 'GET';
      const url = this.replaceVariables(config.url, inputData);
      const headers = this.replaceVariables(config.headers || {}, inputData);
      const data = this.replaceVariables(config.body || {}, inputData);

      this.logger.log(`Executing HTTP ${method} request to ${url}`);

      const response = await lastValueFrom(
        this.httpService.request({
          method,
          url,
          headers,
          data: method !== 'GET' ? data : undefined,
          params: method === 'GET' ? data : undefined,
          timeout: config.timeout || 30000,
        }),
      );

      return {
        statusCode: response.status,
        headers: response.headers,
        data: response.data,
      };
    } catch (error) {
      this.logger.error(`HTTP request failed: ${error.message}`);

      if (error.response) {
        return {
          error: true,
          statusCode: error.response.status,
          data: error.response.data,
          message: error.message,
        };
      }

      throw error;
    }
  }

  async validate(configuration: Record<string, any>): Promise<boolean> {
    return !!configuration.url;
  }

  private replaceVariables(obj: any, data: Record<string, any>): any {
    if (typeof obj === 'string') {
      return obj.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
        const keys = key.trim().split('.');
        let value = data;

        for (const k of keys) {
          value = value?.[k];
        }

        return value !== undefined ? value : match;
      });
    }

    if (typeof obj === 'object' && obj !== null) {
      const result = Array.isArray(obj) ? [] : {};

      for (const key in obj) {
        result[key] = this.replaceVariables(obj[key], data);
      }

      return result;
    }

    return obj;
  }
}
