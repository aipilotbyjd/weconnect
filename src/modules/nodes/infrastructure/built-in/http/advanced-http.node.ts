import { NodeDefinition } from '../../../domain/entities/node-definition.entity';
import {
  INodeExecutor,
  NodeExecutionContext,
  NodeExecutionResult,
} from '../../../../../core/abstracts/base-node.interface';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

export const AdvancedHttpNodeDefinition = new NodeDefinition({
  name: 'AdvancedHTTP',
  displayName: 'Advanced HTTP Request',
  description: 'Make advanced HTTP requests with full control over headers, authentication, and response handling',
  version: 1,
  group: ['http'],
  icon: 'fa:globe',
  defaults: {
    name: 'Advanced HTTP Request',
    color: '#2196F3',
  },
  inputs: ['main'],
  outputs: ['main', 'error'],
  credentials: [
    {
      name: 'httpBasicAuth',
      required: false,
    },
    {
      name: 'httpBearerAuth',
      required: false,
    },
    {
      name: 'httpApiKey',
      required: false,
    },
  ],
  properties: [
    {
      name: 'method',
      displayName: 'Method',
      type: 'options',
      options: [
        { name: 'GET', value: 'GET' },
        { name: 'POST', value: 'POST' },
        { name: 'PUT', value: 'PUT' },
        { name: 'PATCH', value: 'PATCH' },
        { name: 'DELETE', value: 'DELETE' },
        { name: 'HEAD', value: 'HEAD' },
        { name: 'OPTIONS', value: 'OPTIONS' },
      ],
      default: 'GET',
      required: true,
    },
    {
      name: 'url',
      displayName: 'URL',
      type: 'string',
      default: '',
      required: true,
      placeholder: 'https://api.example.com/endpoint',
    },
    {
      name: 'headers',
      displayName: 'Headers',
      type: 'json',
      default: {},
      description: 'HTTP headers as JSON object',
    },
    {
      name: 'queryParameters',
      displayName: 'Query Parameters',
      type: 'json',
      default: {},
      description: 'URL query parameters as JSON object',
    },
    {
      name: 'body',
      displayName: 'Body',
      type: 'json',
      default: {},
      displayOptions: {
        show: {
          method: ['POST', 'PUT', 'PATCH'],
        },
      },
      description: 'Request body data',
    },
    {
      name: 'bodyType',
      displayName: 'Body Type',
      type: 'options',
      options: [
        { name: 'JSON', value: 'json' },
        { name: 'Form Data', value: 'form' },
        { name: 'Raw Text', value: 'raw' },
        { name: 'XML', value: 'xml' },
      ],
      default: 'json',
      displayOptions: {
        show: {
          method: ['POST', 'PUT', 'PATCH'],
        },
      },
    },
    {
      name: 'timeout',
      displayName: 'Timeout (ms)',
      type: 'number',
      default: 30000,
      description: 'Request timeout in milliseconds',
    },
    {
      name: 'followRedirects',
      displayName: 'Follow Redirects',
      type: 'boolean',
      default: true,
    },
    {
      name: 'validateSSL',
      displayName: 'Validate SSL',
      type: 'boolean',
      default: true,
    },
    {
      name: 'responseFormat',
      displayName: 'Response Format',
      type: 'options',
      options: [
        { name: 'Auto Detect', value: 'auto' },
        { name: 'JSON', value: 'json' },
        { name: 'Text', value: 'text' },
        { name: 'Binary', value: 'binary' },
      ],
      default: 'auto',
    },
    {
      name: 'includeResponseHeaders',
      displayName: 'Include Response Headers',
      type: 'boolean',
      default: false,
    },
    {
      name: 'retryOnFailure',
      displayName: 'Retry on Failure',
      type: 'boolean',
      default: false,
    },
    {
      name: 'maxRetries',
      displayName: 'Max Retries',
      type: 'number',
      default: 3,
      displayOptions: {
        show: {
          retryOnFailure: [true],
        },
      },
    },
    {
      name: 'retryDelay',
      displayName: 'Retry Delay (ms)',
      type: 'number',
      default: 1000,
      displayOptions: {
        show: {
          retryOnFailure: [true],
        },
      },
    },
  ],
});

export class AdvancedHttpNodeExecutor implements INodeExecutor {
  async execute(context: NodeExecutionContext): Promise<NodeExecutionResult> {
    const startTime = Date.now();
    
    try {
      const config = this.buildRequestConfig(context);
      const maxRetries = context.parameters.retryOnFailure ? (context.parameters.maxRetries || 3) : 0;
      const retryDelay = context.parameters.retryDelay || 1000;

      let lastError: any;
      
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const response = await axios(config);
          return this.processResponse(response, context, Date.now() - startTime);
        } catch (error) {
          lastError = error;
          
          if (attempt < maxRetries) {
            await this.delay(retryDelay * Math.pow(2, attempt)); // Exponential backoff
            continue;
          }
        }
      }

      // If we get here, all retries failed
      return this.handleError(lastError, Date.now() - startTime);
      
    } catch (error) {
      return this.handleError(error, Date.now() - startTime);
    }
  }

  private buildRequestConfig(context: NodeExecutionContext): AxiosRequestConfig {
    const config: AxiosRequestConfig = {
      method: context.parameters.method || 'GET',
      url: context.parameters.url,
      timeout: context.parameters.timeout || 30000,
      maxRedirects: context.parameters.followRedirects ? 5 : 0,
      validateStatus: () => true, // Don't throw on HTTP error status codes
    };

    // Add headers
    if (context.parameters.headers) {
      config.headers = typeof context.parameters.headers === 'string' 
        ? JSON.parse(context.parameters.headers)
        : context.parameters.headers;
    }

    // Add query parameters
    if (context.parameters.queryParameters) {
      config.params = typeof context.parameters.queryParameters === 'string'
        ? JSON.parse(context.parameters.queryParameters)
        : context.parameters.queryParameters;
    }

    // Add authentication
    this.addAuthentication(config, context);

    // Add body for POST/PUT/PATCH requests
    if (['POST', 'PUT', 'PATCH'].includes(config.method?.toUpperCase() || '')) {
      this.addRequestBody(config, context);
    }

    // SSL validation
    if (!context.parameters.validateSSL) {
      config.httpsAgent = new (require('https').Agent)({
        rejectUnauthorized: false,
      });
    }

    return config;
  }

  private addAuthentication(config: AxiosRequestConfig, context: NodeExecutionContext): void {
    const { credentials } = context;

    if (credentials?.httpBasicAuth) {
      config.auth = {
        username: credentials.httpBasicAuth.username,
        password: credentials.httpBasicAuth.password,
      };
    } else if (credentials?.httpBearerAuth) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${credentials.httpBearerAuth.token}`,
      };
    } else if (credentials?.httpApiKey) {
      const { key, value, location } = credentials.httpApiKey;
      
      if (location === 'header') {
        config.headers = {
          ...config.headers,
          [key]: value,
        };
      } else if (location === 'query') {
        config.params = {
          ...config.params,
          [key]: value,
        };
      }
    }
  }

  private addRequestBody(config: AxiosRequestConfig, context: NodeExecutionContext): void {
    const bodyType = context.parameters.bodyType || 'json';
    const body = context.parameters.body;

    if (!body) return;

    switch (bodyType) {
      case 'json':
        config.data = typeof body === 'string' ? JSON.parse(body) : body;
        config.headers = {
          ...config.headers,
          'Content-Type': 'application/json',
        };
        break;
      
      case 'form':
        const formData = new URLSearchParams();
        const formBody = typeof body === 'string' ? JSON.parse(body) : body;
        Object.entries(formBody).forEach(([key, value]) => {
          formData.append(key, String(value));
        });
        config.data = formData;
        config.headers = {
          ...config.headers,
          'Content-Type': 'application/x-www-form-urlencoded',
        };
        break;
      
      case 'raw':
        config.data = typeof body === 'string' ? body : JSON.stringify(body);
        break;
      
      case 'xml':
        config.data = typeof body === 'string' ? body : JSON.stringify(body);
        config.headers = {
          ...config.headers,
          'Content-Type': 'application/xml',
        };
        break;
    }
  }

  private processResponse(
    response: AxiosResponse, 
    context: NodeExecutionContext, 
    executionTime: number
  ): NodeExecutionResult {
    const responseFormat = context.parameters.responseFormat || 'auto';
    const includeHeaders = context.parameters.includeResponseHeaders || false;

    let responseData: any;

    // Process response data based on format
    switch (responseFormat) {
      case 'json':
        responseData = response.data;
        break;
      case 'text':
        responseData = String(response.data);
        break;
      case 'binary':
        responseData = Buffer.from(response.data);
        break;
      case 'auto':
      default:
        const contentType = response.headers['content-type'] || '';
        if (contentType.includes('application/json')) {
          responseData = response.data;
        } else {
          responseData = String(response.data);
        }
        break;
    }

    const result: any = {
      data: responseData,
      statusCode: response.status,
      statusText: response.statusText,
    };

    if (includeHeaders) {
      result.headers = response.headers;
    }

    // Check if response indicates an error
    const isError = response.status >= 400;

    return {
      success: !isError,
      data: result,
      error: isError ? `HTTP ${response.status}: ${response.statusText}` : undefined,
      metadata: {
        executionTime,
        statusCode: response.status,
        url: context.parameters.url,
        method: context.parameters.method,
      },
    };
  }

  private handleError(error: any, executionTime: number): NodeExecutionResult {
    let errorMessage = 'Unknown error occurred';
    let statusCode: number | undefined;

    if (error.response) {
      // Server responded with error status
      errorMessage = `HTTP ${error.response.status}: ${error.response.statusText}`;
      statusCode = error.response.status;
    } else if (error.request) {
      // Request was made but no response received
      errorMessage = 'No response received from server';
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = 'Request timeout';
    } else {
      errorMessage = error.message || 'Request failed';
    }

    return {
      success: false,
      error: errorMessage,
      metadata: {
        executionTime,
        statusCode,
        errorCode: error.code,
      },
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  validate(configuration: Record<string, any>): boolean {
    return !!(configuration.url && configuration.method);
  }

  getConfigurationSchema(): any {
    return {
      type: 'object',
      properties: {
        url: { type: 'string', format: 'uri' },
        method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'] },
      },
      required: ['url', 'method'],
    };
  }
}