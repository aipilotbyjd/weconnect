import * as nodemailer from 'nodemailer';
import { NodeDefinition } from '../../../domain/entities/node-definition.entity';
import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '../../../../../core/abstracts/base-node.interface';

export const EmailOperationsNodeDefinition = new NodeDefinition({
  name: 'EmailOperations',
  displayName: 'Email Operations',
  description: 'Comprehensive email operations including sending, reading, and managing emails',
  version: 1,
  group: ['communication'],
  icon: 'fa:envelope',
  defaults: {
    name: 'Email Operations',
    color: '#e74c3c',
  },
  inputs: ['main'],
  outputs: ['main'],
  credentials: [
    {
      name: 'emailCredentials',
      required: true,
    },
  ],
  properties: [
    {
      name: 'operation',
      displayName: 'Operation',
      type: 'options',
      options: [
        { name: 'Send Email', value: 'sendEmail' },
        { name: 'Send Bulk Email', value: 'sendBulkEmail' },
        { name: 'Send Template Email', value: 'sendTemplateEmail' },
        { name: 'Verify Email', value: 'verifyEmail' },
      ],
      default: 'sendEmail',
      required: true,
    },
    {
      name: 'to',
      displayName: 'To',
      type: 'string',
      required: true,
      placeholder: 'recipient@example.com',
      description: 'Recipient email address(es), comma-separated for multiple',
      displayOptions: {
        show: {
          operation: ['sendEmail', 'sendTemplateEmail'],
        },
      },
    },
    {
      name: 'cc',
      displayName: 'CC',
      type: 'string',
      placeholder: 'cc@example.com',
      description: 'CC email address(es), comma-separated for multiple',
      displayOptions: {
        show: {
          operation: ['sendEmail', 'sendTemplateEmail'],
        },
      },
    },
    {
      name: 'bcc',
      displayName: 'BCC',
      type: 'string',
      placeholder: 'bcc@example.com',
      description: 'BCC email address(es), comma-separated for multiple',
      displayOptions: {
        show: {
          operation: ['sendEmail', 'sendTemplateEmail'],
        },
      },
    },
    {
      name: 'subject',
      displayName: 'Subject',
      type: 'string',
      required: true,
      placeholder: 'Email subject',
      displayOptions: {
        show: {
          operation: ['sendEmail', 'sendTemplateEmail'],
        },
      },
    },
    {
      name: 'body',
      displayName: 'Email Body',
      type: 'string',
      typeOptions: {
        multipleValues: false,
      },
      required: true,
      placeholder: 'Email content',
      displayOptions: {
        show: {
          operation: ['sendEmail'],
        },
      },
    },
    {
      name: 'bodyType',
      displayName: 'Body Type',
      type: 'options',
      options: [
        { name: 'Plain Text', value: 'text' },
        { name: 'HTML', value: 'html' },
      ],
      default: 'text',
      displayOptions: {
        show: {
          operation: ['sendEmail'],
        },
      },
    },
    {
      name: 'attachments',
      displayName: 'Attachments',
      type: 'collection',
      placeholder: 'Add attachment',
      typeOptions: {
        multipleValues: true,
      },
      default: [],
      options: [
        {
          name: 'filename',
          displayName: 'Filename',
          type: 'string',
          required: true,
        },
        {
          name: 'path',
          displayName: 'File Path',
          type: 'string',
          required: true,
        },
        {
          name: 'contentType',
          displayName: 'Content Type',
          type: 'string',
          placeholder: 'application/pdf',
        },
      ],
      displayOptions: {
        show: {
          operation: ['sendEmail', 'sendTemplateEmail'],
        },
      },
    },
    {
      name: 'recipientList',
      displayName: 'Recipient List',
      type: 'collection',
      placeholder: 'Add recipient',
      typeOptions: {
        multipleValues: true,
      },
      default: [],
      options: [
        {
          name: 'email',
          displayName: 'Email',
          type: 'string',
          required: true,
        },
        {
          name: 'name',
          displayName: 'Name',
          type: 'string',
        },
        {
          name: 'customFields',
          displayName: 'Custom Fields',
          type: 'json',
          default: {},
        },
      ],
      displayOptions: {
        show: {
          operation: ['sendBulkEmail'],
        },
      },
    },
    {
      name: 'bulkSubject',
      displayName: 'Subject Template',
      type: 'string',
      required: true,
      placeholder: 'Hello {{name}}, welcome!',
      description: 'Use {{fieldName}} for personalization',
      displayOptions: {
        show: {
          operation: ['sendBulkEmail'],
        },
      },
    },
    {
      name: 'bulkBody',
      displayName: 'Body Template',
      type: 'string',
      typeOptions: {
        multipleValues: false,
      },
      required: true,
      placeholder: 'Dear {{name}}, your email is {{email}}',
      description: 'Use {{fieldName}} for personalization',
      displayOptions: {
        show: {
          operation: ['sendBulkEmail'],
        },
      },
    },
    {
      name: 'templateId',
      displayName: 'Template ID',
      type: 'string',
      required: true,
      placeholder: 'template-123',
      displayOptions: {
        show: {
          operation: ['sendTemplateEmail'],
        },
      },
    },
    {
      name: 'templateData',
      displayName: 'Template Data',
      type: 'json',
      default: {},
      description: 'Data to populate template variables',
      displayOptions: {
        show: {
          operation: ['sendTemplateEmail'],
        },
      },
    },
    {
      name: 'emailToVerify',
      displayName: 'Email to Verify',
      type: 'string',
      required: true,
      placeholder: 'test@example.com',
      displayOptions: {
        show: {
          operation: ['verifyEmail'],
        },
      },
    },
    {
      name: 'priority',
      displayName: 'Priority',
      type: 'options',
      options: [
        { name: 'High', value: 'high' },
        { name: 'Normal', value: 'normal' },
        { name: 'Low', value: 'low' },
      ],
      default: 'normal',
    },
    {
      name: 'deliveryTime',
      displayName: 'Delivery Time',
      type: 'string',
      description: 'Schedule email delivery (leave empty for immediate)',
    },
  ],
});

export class EmailOperationsNodeExecutor implements INodeExecutor {
  async execute(context: NodeExecutionContext): Promise<NodeExecutionResult> {
    const startTime = Date.now();
    
    try {
      const { operation } = context.parameters;
      const credentials = context.credentials?.emailCredentials;
      
      if (!credentials) {
        throw new Error('Email credentials are required');
      }

      const transporter = nodemailer.createTransport({
        host: credentials.host,
        port: credentials.port,
        secure: credentials.secure || false,
        auth: {
          user: credentials.username,
          pass: credentials.password,
        },
      });

      let result: any;

      switch (operation) {
        case 'sendEmail':
          result = await this.sendSingleEmail(context, transporter);
          break;
        case 'sendBulkEmail':
          result = await this.sendBulkEmail(context, transporter);
          break;
        case 'sendTemplateEmail':
          result = await this.sendTemplateEmail(context, transporter);
          break;
        case 'verifyEmail':
          result = await this.verifyEmail(context, transporter);
          break;
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }

      return {
        success: true,
        data: [result],
        metadata: {
          executionTime: Date.now() - startTime,
          operation,
          itemsProcessed: Array.isArray(result.sent) ? result.sent.length : 1,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        metadata: {
          executionTime: Date.now() - startTime,
          operation: context.parameters.operation,
        },
      };
    }
  }

  private async sendSingleEmail(context: NodeExecutionContext, transporter: any) {
    const { to, cc, bcc, subject, body, bodyType, attachments, priority, deliveryTime } = context.parameters;
    
    const mailOptions: any = {
      from: context.credentials?.emailCredentials?.username,
      to,
      cc,
      bcc,
      subject,
      priority,
    };

    if (bodyType === 'html') {
      mailOptions.html = body;
    } else {
      mailOptions.text = body;
    }

    if (attachments && attachments.length > 0) {
      mailOptions.attachments = attachments.map((att: any) => ({
        filename: att.filename,
        path: att.path,
        contentType: att.contentType,
      }));
    }

    if (deliveryTime) {
      const deliveryDate = new Date(deliveryTime);
      if (deliveryDate > new Date()) {
        // Schedule for later delivery (implementation would depend on your job queue)
        return {
          status: 'scheduled',
          scheduledFor: deliveryDate.toISOString(),
          messageId: `scheduled-${Date.now()}`,
        };
      }
    }

    const info = await transporter.sendMail(mailOptions);
    
    return {
      status: 'sent',
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response,
    };
  }

  private async sendBulkEmail(context: NodeExecutionContext, transporter: any) {
    const { recipientList, bulkSubject, bulkBody, priority } = context.parameters;
    
    const sent: any[] = [];
    const failed: any[] = [];

    for (const recipient of recipientList) {
      try {
        const personalizedSubject = this.replaceTokens(bulkSubject, {
          ...recipient.customFields,
          email: recipient.email,
          name: recipient.name,
        });
        
        const personalizedBody = this.replaceTokens(bulkBody, {
          ...recipient.customFields,
          email: recipient.email,
          name: recipient.name,
        });

        const mailOptions = {
          from: context.credentials?.emailCredentials?.username,
          to: recipient.email,
          subject: personalizedSubject,
          text: personalizedBody,
          priority,
        };

        const info = await transporter.sendMail(mailOptions);
        sent.push({
          email: recipient.email,
          messageId: info.messageId,
          status: 'sent',
        });
      } catch (error) {
        failed.push({
          email: recipient.email,
          error: error.message,
          status: 'failed',
        });
      }
    }

    return {
      status: 'completed',
      sent,
      failed,
      totalSent: sent.length,
      totalFailed: failed.length,
    };
  }

  private async sendTemplateEmail(context: NodeExecutionContext, transporter: any) {
    const { to, cc, bcc, subject, templateId, templateData, attachments, priority } = context.parameters;
    
    // This is a placeholder for template processing
    // In a real implementation, you would load and process the template
    const processedSubject = this.replaceTokens(subject, templateData);
    const processedBody = this.replaceTokens(`Template ${templateId} content`, templateData);

    const mailOptions: any = {
      from: context.credentials?.emailCredentials?.username,
      to,
      cc,
      bcc,
      subject: processedSubject,
      html: processedBody,
      priority,
    };

    if (attachments && attachments.length > 0) {
      mailOptions.attachments = attachments.map((att: any) => ({
        filename: att.filename,
        path: att.path,
        contentType: att.contentType,
      }));
    }

    const info = await transporter.sendMail(mailOptions);
    
    return {
      status: 'sent',
      messageId: info.messageId,
      templateId,
      accepted: info.accepted,
      rejected: info.rejected,
    };
  }

  private async verifyEmail(context: NodeExecutionContext, transporter: any) {
    const { emailToVerify } = context.parameters;
    
    try {
      const verification = await transporter.verify();
      
      // Basic email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isValidFormat = emailRegex.test(emailToVerify);
      
      return {
        email: emailToVerify,
        valid: isValidFormat,
        smtpConnection: verification,
        format: isValidFormat ? 'valid' : 'invalid',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        email: emailToVerify,
        valid: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  private replaceTokens(template: string, data: any): string {
    let result = template;
    for (const [key, value] of Object.entries(data)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, String(value));
    }
    return result;
  }

  validate(configuration: Record<string, any>): boolean {
    // Basic validation - override in specific implementations
    return true;
  }

  getConfigurationSchema(): any {
    return {
      type: 'object',
      properties: {},
      required: []
    };
  }

}