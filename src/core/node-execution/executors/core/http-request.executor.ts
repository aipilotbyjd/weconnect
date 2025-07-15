import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { 
  BaseUnifiedNodeExecutor, 
  NodeExecutionContext, 
  NodeExecutionResult, 
  NodeSchema 
} from '../../interfaces/unified-node-executor.interface';

@Injectable()
export class HttpRequestNodeExecutor extends BaseUnifiedNodeExecutor {
  private readonly logger = new Logger(HttpRequestNodeExecutor.name);

  constructor(private readonly httpService: HttpService) {
    super();
  }

  getSchema(): NodeSchema {
    return {
      name: 'httpRequest',
      displayName: 'HTTP Request',
      description: 'Make HTTP requests to any API or webhook',
      version: 1,
      group: ['core', 'network'],
      icon: 'fas:globe',
      color: '#2196F3',
      inputs: ['main'],
      outputs: ['main'],
      properties: [
        {
          name: 'method',
          displayName: 'Method',
          type: 'options',
          required: true,
          default: 'GET',
          options: [
            { name: 'GET', value: 'GET' },
            { name: 'POST', value: 'POST' },
            { name: 'PUT', value: 'PUT' },
            { name: 'PATCH', value: 'PATCH' },
            { name: 'DELETE', value: 'DELETE' },
            { name: 'HEAD', value: 'HEAD' },
            { name: 'OPTIONS', value: 'OPTIONS' },
          ],
        },
        {
          name: 'url',
          displayName: 'URL',
          type: 'string',
          required: true,
          placeholder: 'https://api.example.com/endpoint',
          description: 'The URL to make the request to',
        },
        {
          name: 'headers',
          displayName: 'Headers',
          type: 'json',
          default: {},
          description: 'HTTP headers as JSON object',
        },
        {
          name: 'body',
          displayName: 'Body',
          type: 'json',
          description: 'Request body (for POST, PUT, PATCH)',
          displayOptions: {
            show: {
              method: ['POST', 'PUT', 'PATCH'],
            },
          },
        },
        {
          name: 'queryParameters',
          displayName: 'Query Parameters',
          type: 'json',
          default: {},
          description: 'URL query parameters as JSON object',
        },
        {
          name: 'timeout',
          displayName: 'Timeout (seconds)',
          type: 'number',
          default: 30,
          description: 'Request timeout in seconds',
        },
        {
          name: 'followRedirects',
          displayName: 'Follow Redirects',
          type: 'boolean',
          default: true,
          description: 'Whether to follow HTTP redirects',
        },
        {
          name: 'ignoreSSLIssues',
          displayName: 'Ignore SSL Issues',
          type: 'boolean',
          default: false,
          description: 'Ignore SSL certificate issues (not recommended for production)',
        },
        {
          name: 'responseFormat',
          displayName: 'Response Format',
          type: 'options',
          default: 'json',
          options: [
            { name: 'JSON', value: 'json' },
            { name: 'Text', value: 'text' },
            { name: 'Binary', value: 'binary' },
          ],
        },
      ],
      resources: {
        memoryMB: 32,
        timeoutSeconds: 60,
        rateLimitPerMinute: 200,
      },
    };
  }

  async execute(context: NodeExecutionContext): Promise<NodeExecutionResult> {
    const {
      method,
      url,
      headers = {},
      body,
      queryParameters = {},
      timeout = 30,
      followRedirects = true,
      ignoreSSLIssues = false,
      responseFormat = 'json',
    } = context.parameters;

    try {
      // Replace variables in URL and other parameters
      const processedUrl = this.replaceVariables(url, context);
      const processedHeaders = this.processObject(headers, context);
      const processedBody = body ? this.processObject(body, context) : undefined;
      const processedQuery = this.processObject(queryParameters, context);

      // Build URL with query parameters
      const urlObj = new URL(processedUrl);
      Object.entries(processedQuery).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          urlObj.searchParams.append(key, String(value));
        }
      });

      const requestConfig: any = {
        method: method.toUpperCase(),
        url: urlObj.toString(),
        headers: processedHeaders,
        timeout: timeout * 1000, // Convert to milliseconds
        maxRedirects: followRedirects ? 5 : 0,
      };

      if (processedBody && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
        requestConfig.data = processedBody;
      }

      if (ignoreSSLIssues) {
        requestConfig.httpsAgent = new (require('https').Agent)({
          rejectUnauthorized: false,
        });
      }

      if (responseFormat === 'binary') {
        requestConfig.responseType = 'arraybuffer';
      }

      this.logger.log(`Making ${method} request to: ${urlObj.toString()}`);

      const response = await lastValueFrom(
        this.httpService.request(requestConfig)
      );

      let responseData: any;
      
      switch (responseFormat) {
        case 'json':
          responseData = response.data;
          break;
        case 'text':
          responseData = typeof response.data === 'string' 
            ? response.data 
            : JSON.stringify(response.data);
          break;
        case 'binary':
          responseData = {
            data: Buffer.from(response.data).toString('base64'),
            contentType: response.headers['content-type'],
            size: response.data.byteLength,
          };
          break;
        default:
          responseData = response.data;
      }

      const result = {
        statusCode: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: responseData,
        url: urlObj.toString(),
        method: method.toUpperCase(),
      };

      return this.createSuccessResult(result, {
        statusCode: response.status,
        responseSize: JSON.stringify(responseData).length,
        apiCallsUsed: 1,
      });
    } catch (error) {
      this.logger.error(`HTTP request failed: ${error.message}`);
      
      // Handle HTTP errors with response data
      if (error.response) {
        const errorResult = {
          statusCode: error.response.status,
          statusText: error.response.statusText,
          headers: error.response.headers,
          data: error.response.data,
          error: error.message,
        };
        
        return this.createErrorResult(
          `HTTP ${error.response.status}: ${error.response.statusText}`
        );
      }
      
      return this.createErrorResult(error.message);
    }
  }

  private processObject(obj: any, context: NodeExecutionContext): any {
    if (typeof obj === 'string') {
      return this.replaceVariables(obj, context);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.processObject(item, context));
    }
    
    if (obj && typeof obj === 'object') {
      const processed: any = {};
      for (const [key, value] of Object.entries(obj)) {
        processed[key] = this.processObject(value, context);
      }
      return processed;
    }
    
    return obj;
  }
}