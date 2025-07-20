import { NodeDefinition } from '../../../domain/entities/node-definition.entity';
import {
  INodeExecutor,
  NodeExecutionContext,
  NodeExecutionResult,
} from '../../../../../core/abstracts/base-node.interface';

export const WebhookTriggerNodeDefinition = new NodeDefinition({
  name: 'WebhookTrigger',
  displayName: 'Webhook Trigger',
  description: 'Trigger workflow execution via HTTP webhook',
  version: 1,
  group: ['trigger'],
  icon: 'fa:satellite-dish',
  defaults: {
    name: 'Webhook Trigger',
    color: '#4CAF50',
  },
  inputs: [],
  outputs: ['main'],
  properties: [
    {
      name: 'httpMethod',
      displayName: 'HTTP Method',
      type: 'options',
      options: [
        { name: 'GET', value: 'GET' },
        { name: 'POST', value: 'POST' },
        { name: 'PUT', value: 'PUT' },
        { name: 'PATCH', value: 'PATCH' },
        { name: 'DELETE', value: 'DELETE' },
        { name: 'ANY', value: 'ANY' },
      ],
      default: 'POST',
      required: true,
    },
    {
      name: 'path',
      displayName: 'Webhook Path',
      type: 'string',
      default: '',
      placeholder: 'my-webhook-endpoint',
      description: 'Custom path for the webhook URL (optional)',
    },
    {
      name: 'authentication',
      displayName: 'Authentication',
      type: 'options',
      options: [
        { name: 'None', value: 'none' },
        { name: 'API Key', value: 'apiKey' },
        { name: 'Basic Auth', value: 'basicAuth' },
        { name: 'Bearer Token', value: 'bearerToken' },
        { name: 'Custom Header', value: 'customHeader' },
      ],
      default: 'none',
    },
    {
      name: 'apiKey',
      displayName: 'API Key',
      type: 'string',
      default: '',
      displayOptions: {
        show: {
          authentication: ['apiKey'],
        },
      },
      description: 'API key for webhook authentication',
    },
    {
      name: 'apiKeyHeader',
      displayName: 'API Key Header Name',
      type: 'string',
      default: 'X-API-Key',
      displayOptions: {
        show: {
          authentication: ['apiKey'],
        },
      },
    },
    {
      name: 'username',
      displayName: 'Username',
      type: 'string',
      default: '',
      displayOptions: {
        show: {
          authentication: ['basicAuth'],
        },
      },
    },
    {
      name: 'password',
      displayName: 'Password',
      type: 'string',
      default: '',
      displayOptions: {
        show: {
          authentication: ['basicAuth'],
        },
      },
    },
    {
      name: 'bearerToken',
      displayName: 'Bearer Token',
      type: 'string',
      default: '',
      displayOptions: {
        show: {
          authentication: ['bearerToken'],
        },
      },
    },
    {
      name: 'customHeaderName',
      displayName: 'Header Name',
      type: 'string',
      default: '',
      displayOptions: {
        show: {
          authentication: ['customHeader'],
        },
      },
    },
    {
      name: 'customHeaderValue',
      displayName: 'Header Value',
      type: 'string',
      default: '',
      displayOptions: {
        show: {
          authentication: ['customHeader'],
        },
      },
    },
    {
      name: 'responseMode',
      displayName: 'Response Mode',
      type: 'options',
      options: [
        { name: 'Return Last Node', value: 'lastNode' },
        { name: 'Return First Node', value: 'firstNode' },
        { name: 'No Response', value: 'noResponse' },
        { name: 'Custom Response', value: 'custom' },
      ],
      default: 'lastNode',
      description: 'What to return as HTTP response',
    },
    {
      name: 'customResponse',
      displayName: 'Custom Response',
      type: 'json',
      default: { message: 'Workflow executed successfully' },
      displayOptions: {
        show: {
          responseMode: ['custom'],
        },
      },
    },
    {
      name: 'responseStatusCode',
      displayName: 'Response Status Code',
      type: 'number',
      default: 200,
      displayOptions: {
        show: {
          responseMode: ['custom'],
        },
      },
    },
    {
      name: 'responseHeaders',
      displayName: 'Response Headers',
      type: 'json',
      default: {},
      displayOptions: {
        show: {
          responseMode: ['custom'],
        },
      },
    },
    {
      name: 'enableCors',
      displayName: 'Enable CORS',
      type: 'boolean',
      default: true,
      description: 'Enable Cross-Origin Resource Sharing',
    },
    {
      name: 'corsOrigins',
      displayName: 'CORS Origins',
      type: 'string',
      default: '*',
      displayOptions: {
        show: {
          enableCors: [true],
        },
      },
      description: 'Allowed origins for CORS (comma-separated)',
    },
    {
      name: 'rateLimitEnabled',
      displayName: 'Enable Rate Limiting',
      type: 'boolean',
      default: false,
    },
    {
      name: 'rateLimitRequests',
      displayName: 'Max Requests',
      type: 'number',
      default: 100,
      displayOptions: {
        show: {
          rateLimitEnabled: [true],
        },
      },
      description: 'Maximum requests per time window',
    },
    {
      name: 'rateLimitWindow',
      displayName: 'Time Window (minutes)',
      type: 'number',
      default: 15,
      displayOptions: {
        show: {
          rateLimitEnabled: [true],
        },
      },
    },
    {
      name: 'logRequests',
      displayName: 'Log Requests',
      type: 'boolean',
      default: true,
      description: 'Log incoming webhook requests',
    },
    {
      name: 'validatePayload',
      displayName: 'Validate Payload',
      type: 'boolean',
      default: false,
      description: 'Validate incoming payload against schema',
    },
    {
      name: 'payloadSchema',
      displayName: 'Payload Schema (JSON Schema)',
      type: 'json',
      default: {},
      displayOptions: {
        show: {
          validatePayload: [true],
        },
      },
    },
  ],
});

export class WebhookTriggerNodeExecutor implements INodeExecutor {
  async execute(context: NodeExecutionContext): Promise<NodeExecutionResult> {
    const startTime = Date.now();
    
    try {
      // This is a trigger node, so it processes incoming webhook data
      const webhookData = context.inputData || {};
      
      // Extract webhook request information
      const requestData = {
        method: webhookData.method || 'POST',
        headers: webhookData.headers || {},
        query: webhookData.query || {},
        body: webhookData.body || {},
        params: webhookData.params || {},
        ip: webhookData.ip,
        userAgent: webhookData.userAgent,
        timestamp: new Date().toISOString(),
      };

      // Validate authentication if configured
      const authResult = this.validateAuthentication(requestData, context.parameters);
      if (!authResult.valid) {
        return {
          success: false,
          error: authResult.error,
          metadata: {
            executionTime: Date.now() - startTime,
            statusCode: 401,
          },
        };
      }

      // Validate HTTP method
      const allowedMethod = context.parameters.httpMethod || 'POST';
      if (allowedMethod !== 'ANY' && requestData.method !== allowedMethod) {
        return {
          success: false,
          error: `Method ${requestData.method} not allowed. Expected ${allowedMethod}`,
          metadata: {
            executionTime: Date.now() - startTime,
            statusCode: 405,
          },
        };
      }

      // Validate payload schema if enabled
      if (context.parameters.validatePayload) {
        const validationResult = this.validatePayloadSchema(
          requestData.body, 
          context.parameters.payloadSchema
        );
        if (!validationResult.valid) {
          return {
            success: false,
            error: `Payload validation failed: ${validationResult.error}`,
            metadata: {
              executionTime: Date.now() - startTime,
              statusCode: 400,
            },
          };
        }
      }

      // Log request if enabled
      if (context.parameters.logRequests) {
        console.log('[WebhookTrigger] Incoming request:', {
          method: requestData.method,
          headers: requestData.headers,
          body: requestData.body,
          timestamp: requestData.timestamp,
        });
      }

      // Prepare output data
      const outputData = {
        webhook: requestData,
        // Flatten common fields for easier access
        body: requestData.body,
        headers: requestData.headers,
        query: requestData.query,
        method: requestData.method,
        timestamp: requestData.timestamp,
      };

      return {
        success: true,
        data: outputData,
        metadata: {
          executionTime: Date.now() - startTime,
          trigger: 'webhook',
          method: requestData.method,
          statusCode: 200,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        metadata: {
          executionTime: Date.now() - startTime,
          statusCode: 500,
        },
      };
    }
  }

  private validateAuthentication(requestData: any, parameters: any): { valid: boolean; error?: string } {
    const authType = parameters.authentication || 'none';

    switch (authType) {
      case 'none':
        return { valid: true };

      case 'apiKey':
        const headerName = parameters.apiKeyHeader || 'X-API-Key';
        const expectedKey = parameters.apiKey;
        const providedKey = requestData.headers[headerName.toLowerCase()];
        
        if (!expectedKey) {
          return { valid: false, error: 'API key not configured' };
        }
        
        if (providedKey !== expectedKey) {
          return { valid: false, error: 'Invalid API key' };
        }
        
        return { valid: true };

      case 'basicAuth':
        const authHeader = requestData.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Basic ')) {
          return { valid: false, error: 'Basic authentication required' };
        }

        const credentials = Buffer.from(authHeader.slice(6), 'base64').toString();
        const [username, password] = credentials.split(':');
        
        if (username !== parameters.username || password !== parameters.password) {
          return { valid: false, error: 'Invalid credentials' };
        }
        
        return { valid: true };

      case 'bearerToken':
        const bearerHeader = requestData.headers.authorization;
        if (!bearerHeader || !bearerHeader.startsWith('Bearer ')) {
          return { valid: false, error: 'Bearer token required' };
        }

        const token = bearerHeader.slice(7);
        if (token !== parameters.bearerToken) {
          return { valid: false, error: 'Invalid bearer token' };
        }
        
        return { valid: true };

      case 'customHeader':
        const customHeaderName = parameters.customHeaderName?.toLowerCase();
        const expectedValue = parameters.customHeaderValue;
        const actualValue = requestData.headers[customHeaderName];
        
        if (!customHeaderName || !expectedValue) {
          return { valid: false, error: 'Custom header authentication not properly configured' };
        }
        
        if (actualValue !== expectedValue) {
          return { valid: false, error: 'Invalid custom header value' };
        }
        
        return { valid: true };

      default:
        return { valid: false, error: 'Unknown authentication type' };
    }
  }

  private validatePayloadSchema(payload: any, schema: any): { valid: boolean; error?: string } {
    if (!schema || Object.keys(schema).length === 0) {
      return { valid: true };
    }

    try {
      // Basic JSON Schema validation
      // In a real implementation, you'd use a proper JSON Schema validator like Ajv
      return this.basicSchemaValidation(payload, schema);
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  private basicSchemaValidation(data: any, schema: any): { valid: boolean; error?: string } {
    if (schema.type) {
      const actualType = Array.isArray(data) ? 'array' : typeof data;
      if (actualType !== schema.type) {
        return { valid: false, error: `Expected type ${schema.type}, got ${actualType}` };
      }
    }

    if (schema.required && Array.isArray(schema.required)) {
      for (const requiredField of schema.required) {
        if (!(requiredField in data)) {
          return { valid: false, error: `Missing required field: ${requiredField}` };
        }
      }
    }

    if (schema.properties && typeof data === 'object' && data !== null) {
      for (const [key, value] of Object.entries(data)) {
        if (schema.properties[key]) {
          const fieldValidation = this.basicSchemaValidation(value, schema.properties[key]);
          if (!fieldValidation.valid) {
            return { valid: false, error: `Field ${key}: ${fieldValidation.error}` };
          }
        }
      }
    }

    return { valid: true };
  }

  validate(configuration: Record<string, any>): boolean {
    return !!configuration.httpMethod;
  }

  getConfigurationSchema(): any {
    return {
      type: 'object',
      properties: {
        httpMethod: { 
          type: 'string', 
          enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'ANY'] 
        },
        authentication: {
          type: 'string',
          enum: ['none', 'apiKey', 'basicAuth', 'bearerToken', 'customHeader']
        },
      },
      required: ['httpMethod'],
    };
  }

  // Method to generate webhook URL (would be called by the webhook service)
  generateWebhookUrl(workflowId: string, nodeId: string, baseUrl: string, customPath?: string): string {
    const path = customPath || `webhook/${workflowId}/${nodeId}`;
    return `${baseUrl}/${path}`;
  }

  // Method to get response configuration for webhook service
  getResponseConfig(parameters: any, workflowResult?: any): any {
    const responseMode = parameters.responseMode || 'lastNode';
    
    switch (responseMode) {
      case 'noResponse':
        return {
          statusCode: 204,
          body: null,
        };
      
      case 'custom':
        return {
          statusCode: parameters.responseStatusCode || 200,
          headers: parameters.responseHeaders || {},
          body: parameters.customResponse || { message: 'Success' },
        };
      
      case 'firstNode':
        return {
          statusCode: 200,
          body: workflowResult?.firstNodeOutput || { message: 'Workflow executed' },
        };
      
      case 'lastNode':
      default:
        return {
          statusCode: 200,
          body: workflowResult?.lastNodeOutput || { message: 'Workflow executed' },
        };
    }
  }
}