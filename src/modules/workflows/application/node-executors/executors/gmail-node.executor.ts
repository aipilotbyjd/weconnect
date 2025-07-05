import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { WorkflowNode } from '../../../domain/entities/workflow-node.entity';
import { NodeExecutor } from '../node-executor.interface';
import { CredentialIntegrationService } from '../../../../credentials/application/services/credential-integration.service';

export interface GmailConfig {
  operation: 'sendEmail' | 'getMessage' | 'listMessages' | 'deleteMessage';
  // Send Email fields
  to?: string;
  cc?: string;
  bcc?: string;
  subject?: string;
  body?: string;
  isHTML?: boolean;
  attachments?: Array<{
    filename: string;
    content: string;
    encoding?: string;
  }>;
  // Get/List Messages fields
  messageId?: string;
  query?: string;
  maxResults?: number;
  // Authentication
  accessToken?: string;
  credentialId?: string;
}

@Injectable()
export class GmailNodeExecutor implements NodeExecutor {
  private readonly logger = new Logger(GmailNodeExecutor.name);

  constructor(
    private httpService: HttpService,
    private credentialIntegrationService: CredentialIntegrationService,
  ) {}

  async execute(
    node: WorkflowNode,
    inputData: Record<string, any>,
    executionId: string,
  ): Promise<Record<string, any>> {
    const config = node.configuration as GmailConfig;
    this.logger.log(`Executing Gmail operation: ${config.operation}`);

    try {
      const accessToken = await this.getAccessToken(config, inputData);
      let result: any;

      switch (config.operation) {
        case 'sendEmail':
          result = await this.sendEmail(config, inputData, accessToken);
          break;
        case 'getMessage':
          result = await this.getMessage(config, inputData, accessToken);
          break;
        case 'listMessages':
          result = await this.listMessages(config, inputData, accessToken);
          break;
        case 'deleteMessage':
          result = await this.deleteMessage(config, inputData, accessToken);
          break;
        default:
          throw new Error(`Unsupported Gmail operation: ${config.operation}`);
      }

      return {
        ...inputData,
        gmail: result,
        _gmail: {
          nodeId: node.id,
          nodeName: node.name,
          operation: config.operation,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.logger.error(`Gmail operation failed: ${error.message}`);
      
      return {
        ...inputData,
        gmail: null,
        gmailError: error.message,
        _gmail: {
          nodeId: node.id,
          nodeName: node.name,
          operation: config.operation,
          error: error.message,
          timestamp: new Date().toISOString(),
        },
      };
    }
  }

  async validate(configuration: Record<string, any>): Promise<boolean> {
    const config = configuration as GmailConfig;
    
    if (!config.operation) return false;
    if (!config.accessToken && !config.credentialId) return false;

    switch (config.operation) {
      case 'sendEmail':
        return !!(config.to && config.subject);
      case 'getMessage':
        return !!config.messageId;
      case 'listMessages':
        return true; // Optional query parameter
      case 'deleteMessage':
        return !!config.messageId;
      default:
        return false;
    }
  }

  private async getAccessToken(config: GmailConfig, inputData: Record<string, any>): Promise<string> {
    if (config.accessToken) {
      return this.replaceVariables(config.accessToken, inputData);
    }

    if (config.credentialId) {
      try {
        const credential = await this.credentialIntegrationService.getCredentialById(
          config.credentialId,
          inputData._credentialContext
        );
        return credential.data.access_token;
      } catch (error) {
        this.logger.error(`Failed to get Gmail credential: ${error.message}`);
        throw new Error(`Failed to retrieve Gmail credentials: ${error.message}`);
      }
    }

    // Try to get credential by service name
    if (inputData._credentialContext) {
      try {
        const credential = await this.credentialIntegrationService.getCredentialByService(
          'gmail',
          inputData._credentialContext
        );
        return credential.data.access_token;
      } catch (error) {
        this.logger.error(`Failed to get Gmail credential by service: ${error.message}`);
      }
    }

    throw new Error('No access token or credential ID provided');
  }

  private async sendEmail(
    config: GmailConfig,
    inputData: Record<string, any>,
    accessToken: string,
  ): Promise<any> {
    const to = this.replaceVariables(config.to!, inputData);
    const subject = this.replaceVariables(config.subject!, inputData);
    const body = this.replaceVariables(config.body || '', inputData);

    // Build email message
    const emailData = {
      to: to.split(',').map(email => email.trim()),
      subject,
      [config.isHTML ? 'html' : 'text']: body,
    };

    if (config.cc) {
      emailData['cc'] = this.replaceVariables(config.cc, inputData).split(',').map(email => email.trim());
    }

    if (config.bcc) {
      emailData['bcc'] = this.replaceVariables(config.bcc, inputData).split(',').map(email => email.trim());
    }

    // Create raw email message for Gmail API
    const rawMessage = this.createRawMessage(emailData);

    const response = await lastValueFrom(
      this.httpService.post(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
        { raw: rawMessage },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      )
    );

    return {
      messageId: response.data.id,
      threadId: response.data.threadId,
      status: 'sent',
      to: emailData.to,
      subject,
    };
  }

  private async getMessage(
    config: GmailConfig,
    inputData: Record<string, any>,
    accessToken: string,
  ): Promise<any> {
    const messageId = this.replaceVariables(config.messageId!, inputData);

    const response = await lastValueFrom(
      this.httpService.get(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )
    );

    const message = response.data;
    const headers = message.payload.headers;

    return {
      id: message.id,
      threadId: message.threadId,
      subject: headers.find(h => h.name === 'Subject')?.value || '',
      from: headers.find(h => h.name === 'From')?.value || '',
      to: headers.find(h => h.name === 'To')?.value || '',
      date: headers.find(h => h.name === 'Date')?.value || '',
      snippet: message.snippet,
      body: this.extractEmailBody(message.payload),
    };
  }

  private async listMessages(
    config: GmailConfig,
    inputData: Record<string, any>,
    accessToken: string,
  ): Promise<any> {
    const params = new URLSearchParams();
    
    if (config.query) {
      params.append('q', this.replaceVariables(config.query, inputData));
    }
    
    if (config.maxResults) {
      params.append('maxResults', config.maxResults.toString());
    }

    const response = await lastValueFrom(
      this.httpService.get(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )
    );

    return {
      messages: response.data.messages || [],
      resultSizeEstimate: response.data.resultSizeEstimate || 0,
      nextPageToken: response.data.nextPageToken,
    };
  }

  private async deleteMessage(
    config: GmailConfig,
    inputData: Record<string, any>,
    accessToken: string,
  ): Promise<any> {
    const messageId = this.replaceVariables(config.messageId!, inputData);

    await lastValueFrom(
      this.httpService.delete(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )
    );

    return {
      messageId,
      status: 'deleted',
    };
  }

  private createRawMessage(emailData: any): string {
    const boundary = '000000000000000000000000000';
    let message = '';

    // Add headers
    message += `To: ${emailData.to.join(', ')}\n`;
    if (emailData.cc) message += `Cc: ${emailData.cc.join(', ')}\n`;
    if (emailData.bcc) message += `Bcc: ${emailData.bcc.join(', ')}\n`;
    message += `Subject: ${emailData.subject}\n`;
    message += `Content-Type: ${emailData.html ? 'text/html' : 'text/plain'}; charset=UTF-8\n`;
    message += `\n`;

    // Add body
    message += emailData.html || emailData.text || '';

    // Encode in base64url format
    return Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  private extractEmailBody(payload: any): string {
    if (payload.body && payload.body.data) {
      return Buffer.from(payload.body.data, 'base64').toString();
    }

    if (payload.parts) {
      for (const part of payload.parts) {
        if (part.mimeType === 'text/plain' || part.mimeType === 'text/html') {
          if (part.body && part.body.data) {
            return Buffer.from(part.body.data, 'base64').toString();
          }
        }
      }
    }

    return '';
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
