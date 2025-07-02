import axios, { AxiosRequestConfig } from 'axios';
import { NodeDefinition } from '../../../domain/entities/node-definition.entity';
import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '../../../domain/interfaces/node-executor.interface';

export const HttpRequestNodeDefinition = new NodeDefinition({
  name: 'HttpRequest',
  displayName: 'HTTP Request',
  description: 'Makes HTTP requests to external APIs',
  version: 1,
  group: ['regular'],
  icon: 'fa:cloud',
  defaults: {
    name: 'HTTP Request',
    color: '#0066cc',
  },
  inputs: ['main'],
  outputs: ['main'],
  properties: [
    {
      name: 'method',
      displayName: 'Method',
      type: 'options',
      options: [
        { name: 'GET', value: 'GET' },
        { name: 'POST', value: 'POST' },
        { name: 'PUT', value: 'PUT' },
        { name: 'DELETE', value: 'DELETE' },
        { name: 'PATCH', value: 'PATCH' },
      ],
      default: 'GET',
      required: true,
    },
    {
      name: 'url',
      displayName: 'URL',
      type: 'string',
      required: true,
      placeholder: 'https://api.example.com/data',
    },
    {
      name: 'headers',
      displayName: 'Headers',
      type: 'json',
      default: {},
      description: 'Request headers as JSON object',
    },
    {
      name: 'body',
      displayName: 'Body',
      type: 'json',
      default: {},
      description: 'Request body for POST/PUT/PATCH requests',
    },
    {
      name: 'timeout',
      displayName: 'Timeout (ms)',
      type: 'number',
      default: 30000,
      description: 'Request timeout in milliseconds',
    },
  ],
});

export class HttpRequestNodeExecutor implements INodeExecutor {
  async execute(context: NodeExecutionContext): Promise<NodeExecutionResult> {
    const startTime = Date.now();
    
    try {
      const { method, url, headers, body, timeout } = context.parameters;
      
      if (!url) {
        throw new Error('URL is required');
      }

      const config: AxiosRequestConfig = {
        method: method || 'GET',
        url,
        headers: headers || {},
        timeout: timeout || 30000,
      };

      // Add body for methods that support it
      if (['POST', 'PUT', 'PATCH'].includes(method) && body) {
        config.data = body;
      }

      const response = await axios(config);
      
      return {
        success: true,
        data: [{
          statusCode: response.status,
          headers: response.headers,
          body: response.data,
        }],
        metadata: {
          executionTime: Date.now() - startTime,
          itemsProcessed: 1,
          statusCode: response.status,
        },
      };
    } catch (error) {
      const errorMessage = axios.isAxiosError(error) 
        ? `HTTP ${error.response?.status}: ${error.message}`
        : error.message;
      
      return {
        success: false,
        error: errorMessage,
        metadata: {
          executionTime: Date.now() - startTime,
          statusCode: error.response?.status,
        },
      };
    }
  }
}
