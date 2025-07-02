import { Injectable } from '@nestjs/common';
import { BaseNodeExecutor, NodeExecutionContext, NodeExecutionResult } from '../../core/abstracts/base-node.interface';
import axios from 'axios';

@Injectable()
export class HttpRequestExecutor extends BaseNodeExecutor {
  async execute(context: NodeExecutionContext): Promise<NodeExecutionResult> {
    try {
      const { url, method = 'GET', headers = {}, body, timeout = 30000 } = context.configuration;

      if (!url) {
        return this.createErrorResult('URL is required');
      }

      const response = await axios({
        method: method.toLowerCase(),
        url,
        headers,
        data: body,
        timeout,
      });

      return this.createSuccessResult({
        statusCode: response.status,
        data: response.data,
        headers: response.headers,
      });

    } catch (error) {
      return this.createErrorResult(`HTTP Request failed: ${error.message}`);
    }
  }
}
