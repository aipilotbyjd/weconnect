import { NodeDefinition } from '../../../domain/entities/node-definition.entity';
import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '../../../domain/interfaces/node-executor.interface';
import * as nodemailer from 'nodemailer';

export const SMTPNodeDefinition = new NodeDefinition({
  name: 'SMTP',
  displayName: 'Send Email (SMTP)',
  description: 'Send emails using SMTP server',
  version: 1,
  group: ['communication'],
  icon: 'fa:envelope',
  defaults: {
    name: 'Send Email',
    color: '#FF6600',
  },
  inputs: ['main'],
  outputs: ['main'],
  credentials: [
    {
      name: 'smtp',
      required: true,
    },
  ],
  properties: [
    {
      name: 'fromEmail',
      displayName: 'From Email',
      type: 'string',
      default: '',
      placeholder: 'sender@example.com',
      description: 'Email address of the sender',
    },
    {
      name: 'fromName',
      displayName: 'From Name',
      type: 'string',
      default: '',
      placeholder: 'John Doe',
      description: 'Name of the sender',
    },
    {
      name: 'toEmail',
      displayName: 'To Email',
      type: 'string',
      default: '',
      required: true,
      placeholder: 'recipient@example.com',
      description: 'Email address of the recipient',
    },
    {
      name: 'ccEmail',
      displayName: 'CC',
      type: 'string',
      default: '',
      placeholder: 'cc@example.com',
      description: 'CC recipients (comma-separated)',
    },
    {
      name: 'bccEmail',
      displayName: 'BCC',
      type: 'string',
      default: '',
      placeholder: 'bcc@example.com',
      description: 'BCC recipients (comma-separated)',
    },
    {
      name: 'subject',
      displayName: 'Subject',
      type: 'string',
      default: '',
      required: true,
      placeholder: 'Email Subject',
    },
    {
      name: 'emailType',
      displayName: 'Email Type',
      type: 'options',
      options: [
        { name: 'Text', value: 'text' },
        { name: 'HTML', value: 'html' },
      ],
      default: 'html',
    },
    {
      name: 'message',
      displayName: 'Message',
      type: 'string',
      default: '',
      required: true,
      placeholder: 'Email content',
      description: 'The email message content',
    },
    {
      name: 'attachments',
      displayName: 'Attachments',
      type: 'json',
      default: [],
      description: 'Array of attachment objects with filename and content/path',
    },
    {
      name: 'options',
      displayName: 'Options',
      type: 'collection',
      default: {},
      options: [
        {
          name: 'replyTo',
          displayName: 'Reply To',
          type: 'string',
          default: '',
          placeholder: 'replyto@example.com',
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
          name: 'headers',
          displayName: 'Custom Headers',
          type: 'json',
          default: {},
        },
      ],
    },
  ],
});

export class SMTPNodeExecutor implements INodeExecutor {
  async execute(context: NodeExecutionContext): Promise<NodeExecutionResult> {
    const startTime = Date.now();
    const credentials = context.credentials?.smtp;
    
    if (!credentials) {
      return {
        success: false,
        error: 'SMTP credentials not configured',
        metadata: {
          executionTime: Date.now() - startTime,
        },
      };
    }

    try {
      // Create transporter
      const transporterConfig: any = {
        host: credentials.host,
        port: credentials.port || 587,
        secure: credentials.secure || false,
        auth: {
          user: credentials.user,
          pass: credentials.password,
        },
      };

      if (credentials.tlsCiphers) {
        transporterConfig.tls = {
          ciphers: credentials.tlsCiphers,
        };
      }

      const transporter = nodemailer.createTransport(transporterConfig);

      // Process each input item
      const results: any[] = [];
      const inputData = context.inputData.length > 0 ? context.inputData : [{}];

      for (const item of inputData) {
        const {
          fromEmail,
          fromName,
          toEmail,
          ccEmail,
          bccEmail,
          subject,
          emailType,
          message,
          attachments,
          options,
        } = context.parameters;

        // Resolve variables in email fields
        const resolvedTo = this.resolveField(toEmail, item);
        const resolvedSubject = this.resolveField(subject, item);
        const resolvedMessage = this.resolveField(message, item);

        // Build mail options
        const mailOptions: any = {
          from: fromName ? `"${fromName}" <${fromEmail || credentials.user}>` : (fromEmail || credentials.user),
          to: resolvedTo,
          subject: resolvedSubject,
        };

        if (ccEmail) {
          mailOptions.cc = this.resolveField(ccEmail, item);
        }

        if (bccEmail) {
          mailOptions.bcc = this.resolveField(bccEmail, item);
        }

        if (emailType === 'html') {
          mailOptions.html = resolvedMessage;
        } else {
          mailOptions.text = resolvedMessage;
        }

        if (attachments && attachments.length > 0) {
          mailOptions.attachments = attachments;
        }

        if (options?.replyTo) {
          mailOptions.replyTo = options.replyTo;
        }

        if (options?.priority) {
          mailOptions.priority = options.priority;
        }

        if (options?.headers) {
          mailOptions.headers = options.headers;
        }

        // Send email
        const info = await transporter.sendMail(mailOptions);

        results.push({
          ...item,
          messageId: info.messageId,
          response: info.response,
          accepted: info.accepted,
          rejected: info.rejected,
          envelope: info.envelope,
        });
      }

      // Close transporter
      transporter.close();

      return {
        success: true,
        data: results,
        metadata: {
          executionTime: Date.now() - startTime,
          itemsProcessed: results.length,
          emailsSent: results.length,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        metadata: {
          executionTime: Date.now() - startTime,
        },
      };
    }
  }

  private resolveField(field: string, data: any): string {
    // Simple variable replacement {{variableName}}
    return field.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] || match;
    });
  }
}
