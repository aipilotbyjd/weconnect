import { NodeDefinition } from '../../../domain/entities/node-definition.entity';
import {
  INodeExecutor,
  NodeExecutionContext,
  NodeExecutionResult,
} from '../../../../../core/abstracts/base-node.interface';

export const GmailNodeDefinition = new NodeDefinition({
  name: 'Gmail',
  displayName: 'Gmail',
  description: 'Send emails via Gmail API',
  version: 1,
  group: ['communication'],
  icon: 'fa:envelope',
  defaults: {
    name: 'Gmail',
    color: '#EA4335',
  },
  inputs: ['main'],
  outputs: ['main'],
  credentials: [
    {
      name: 'gmailOAuth2',
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
        { name: 'Get Messages', value: 'getMessages' },
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
      description: 'Email recipient',
    },
    {
      name: 'subject',
      displayName: 'Subject',
      type: 'string',
      required: true,
      placeholder: 'Email subject',
    },
    {
      name: 'message',
      displayName: 'Message',
      type: 'string',
      required: true,
      placeholder: 'Email content',
      description: 'Email body content',
    },
    {
      name: 'attachments',
      displayName: 'Attachments',
      type: 'json',
      default: [],
      description: 'Array of attachment objects',
    },
  ],
});

export class GmailNodeExecutor implements INodeExecutor {
  async execute(context: NodeExecutionContext): Promise<NodeExecutionResult> {
    const startTime = Date.now();

    try {
      const { operation, to, subject, message, attachments } =
        context.parameters;

      // Simulate Gmail API integration
      // In a real implementation, you would use Google APIs client library

      if (operation === 'sendEmail') {
        if (!to || !subject || !message) {
          throw new Error(
            'To, Subject, and Message are required for sending email',
          );
        }

        // Simulate sending email
        const emailData = {
          messageId: `msg_${Date.now()}`,
          to,
          subject,
          message,
          attachments: attachments || [],
          sentAt: new Date().toISOString(),
          status: 'sent',
        };

        return {
          success: true,
          data: [emailData],
          metadata: {
            executionTime: Date.now() - startTime,
            itemsProcessed: 1,
            operation: 'sendEmail',
          },
        };
      } else if (operation === 'getMessages') {
        // Simulate getting messages
        const messages = [
          {
            id: 'msg_001',
            subject: 'Sample Email 1',
            from: 'sender1@example.com',
            snippet: 'This is a sample email...',
            date: new Date().toISOString(),
          },
          {
            id: 'msg_002',
            subject: 'Sample Email 2',
            from: 'sender2@example.com',
            snippet: 'Another sample email...',
            date: new Date().toISOString(),
          },
        ];

        return {
          success: true,
          data: messages,
          metadata: {
            executionTime: Date.now() - startTime,
            itemsProcessed: messages.length,
            operation: 'getMessages',
          },
        };
      }

      throw new Error(`Unknown operation: ${operation}`);
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

  validate(configuration: Record<string, any>): boolean {
    // Basic validation - override in specific implementations
    return true;
  }

  getConfigurationSchema(): any {
    return {
      type: 'object',
      properties: {},
      required: [],
    };
  }
}
