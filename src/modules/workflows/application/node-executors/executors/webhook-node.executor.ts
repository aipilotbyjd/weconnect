import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { createHmac } from 'crypto';
import { WorkflowNode } from '../../../domain/entities/workflow-node.entity';
import { NodeExecutor } from '../node-executor.interface';

export interface WebhookConfig {
  url?: string;
  method?: string;
  headers?: Record<string, string>;
  authentication?: {
    type: 'none' | 'basic' | 'bearer' | 'apiKey' | 'hmac';
    credentials?: {
      username?: string;
      password?: string;
      token?: string;
      apiKey?: string;
      secret?: string;
      headerName?: string;
    };
  };
  responseType?: 'json' | 'text' | 'binary';
  timeout?: number;
  retryOnFail?: boolean;
  maxRetries?: number;
}

@Injectable()
export class WebhookNodeExecutor implements NodeExecutor {
  private readonly logger = new Logger(WebhookNodeExecutor.name);

  constructor(private httpService: HttpService) { }

  async execute(
    node: WorkflowNode,
    inputData: Record<string, any>,
    executionId: string,
  ): Promise<Record<string, any>> {
    const config = node.configuration as WebhookConfig;

    // If no URL is configured, this might be a webhook trigger
    if (!config.url) {
      return this.handleWebhookTrigger(node, inputData, executionId);
    }

    // Otherwise, it's a webhook action (calling external webhook)
    return this.callWebhook(node, inputData, executionId, config);
  }

  async validate(configuration: Record<string, any>): Promise<boolean> {
    const config = configuration as WebhookConfig;
    // Webhook can be either trigger (no URL) or action (with URL)
    return true;
  }

  private async handleWebhookTrigger(
    node: WorkflowNode,
    inputData: Record<string, any>,
    executionId: string,
  ): Promise<Record<string, any>> {
    this.logger.log(`Processing webhook trigger: ${node.name}`);

    // For webhook triggers, the input data is the webhook payload
    return {
      ...inputData,
      _webhook: {
        nodeId: node.id,
        nodeName: node.name,
        type: 'trigger',
        timestamp: new Date().toISOString(),
        headers: inputData._headers || {},
        query: inputData._query || {},
        body: inputData._body || inputData,
      },
    };
  }

  private async callWebhook(
    node: WorkflowNode,
    inputData: Record<string, any>,
    executionId: string,
    config: WebhookConfig,
  ): Promise<Record<string, any>> {
    const method = config.method || 'POST';
    const url = this.replaceVariables(config.url!, inputData);

    this.logger.log(`Calling webhook: ${method} ${url}`);

    try {
      const headers = this.buildHeaders(config, inputData);
      const data = this.preparePayload(inputData, config);

      const response = await lastValueFrom(
        this.httpService.request({
          method,
          url,
          headers,
          data: ['GET', 'HEAD'].includes(method.toUpperCase()) ? undefined : data,
          params: ['GET', 'HEAD'].includes(method.toUpperCase()) ? data : undefined,
          timeout: config.timeout || 30000,
          responseType: config.responseType === 'binary' ? 'arraybuffer' : 'json',
        }),
      );

      return {
        ...inputData,
        _webhook: {
          nodeId: node.id,
          nodeName: node.name,
          type: 'action',
          timestamp: new Date().toISOString(),
          request: {
            url,
            method,
            headers,
          },
          response: {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
            data: response.data,
          },
        },
        webhookResponse: response.data,
      };
    } catch (error: any) {
      this.logger.error(`Webhook call failed: ${error.message}`);

      if (config.retryOnFail && (!error.response || error.response.status >= 500)) {
        throw error; // Let the queue system handle retries
      }

      return {
        ...inputData,
        _webhook: {
          nodeId: node.id,
          nodeName: node.name,
          type: 'action',
          timestamp: new Date().toISOString(),
          error: {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
          },
        },
        webhookError: true,
      };
    }
  }

  private buildHeaders(config: WebhookConfig, inputData: Record<string, any>): Record<string, string> {
    let headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...config.headers,
    };

    // Replace variables in headers
    for (const [key, value] of Object.entries(headers)) {
      headers[key] = this.replaceVariables(value, inputData);
    }

    // Add authentication headers
    if (config.authentication) {
      switch (config.authentication.type) {
        case 'basic':
          const credentials = config.authentication.credentials!;
          const auth = Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64');
          headers['Authorization'] = `Basic ${auth}`;
          break;

        case 'bearer':
          headers['Authorization'] = `Bearer ${config.authentication.credentials!.token}`;
          break;

        case 'apiKey':
          const headerName = config.authentication.credentials!.headerName || 'X-API-Key';
          headers[headerName] = config.authentication.credentials!.apiKey!;
          break;

        case 'hmac':
          // HMAC will be added after payload is prepared
          break;
      }
    }

    return headers;
  }

  private preparePayload(inputData: Record<string, any>, config: WebhookConfig): any {
    // Remove internal fields
    const payload = { ...inputData };
    delete payload._webhook;
    delete payload._condition;
    delete payload._action;
    delete payload._headers;
    delete payload._query;
    delete payload._body;

    return payload;
  }

  private addHmacSignature(
    headers: Record<string, string>,
    payload: any,
    secret: string,
  ): void {
    const payloadString = JSON.stringify(payload);
    const signature = createHmac('sha256', secret)
      .update(payloadString)
      .digest('hex');

    headers['X-Webhook-Signature'] = signature;
    headers['X-Webhook-Signature-256'] = `sha256=${signature}`;
  }

  private replaceVariables(str: string, data: Record<string, any>): string {
    return str.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
      const keys = key.trim().split('.');
      let value = data;

      for (const k of keys) {
        value = value?.[k];
      }

      return value !== undefined ? String(value) : match;
    });
  }
}
