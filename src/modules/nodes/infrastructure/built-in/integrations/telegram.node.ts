import { NodeDefinition } from '../../../domain/entities/node-definition.entity';
import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '../../../domain/interfaces/node-executor.interface';

export const TelegramNodeDefinition = new NodeDefinition({
  name: 'Telegram',
  displayName: 'Telegram',
  description: 'Send messages via Telegram Bot API',
  version: 1,
  group: ['communication'],
  icon: 'fa:telegram',
  defaults: {
    name: 'Telegram',
    color: '#0088cc',
  },
  inputs: ['main'],
  outputs: ['main'],
  credentials: [
    {
      name: 'telegramBot',
      required: true,
    },
  ],
  properties: [
    {
      name: 'operation',
      displayName: 'Operation',
      type: 'options',
      options: [
        { name: 'Send Message', value: 'sendMessage' },
        { name: 'Send Photo', value: 'sendPhoto' },
        { name: 'Send Document', value: 'sendDocument' },
      ],
      default: 'sendMessage',
      required: true,
    },
    {
      name: 'chatId',
      displayName: 'Chat ID',
      type: 'string',
      required: true,
      placeholder: '@channel_name or 123456789',
      description: 'Telegram chat ID or channel username',
    },
    {
      name: 'text',
      displayName: 'Message Text',
      type: 'string',
      required: true,
      placeholder: 'Hello from WeConnect!',
      description: 'Message text to send',
    },
    {
      name: 'parseMode',
      displayName: 'Parse Mode',
      type: 'options',
      options: [
        { name: 'None', value: '' },
        { name: 'Markdown', value: 'Markdown' },
        { name: 'HTML', value: 'HTML' },
      ],
      default: '',
      description: 'Message formatting mode',
    },
    {
      name: 'disableWebPagePreview',
      displayName: 'Disable Web Page Preview',
      type: 'boolean',
      default: false,
      description: 'Disable link previews for web links',
    },
    {
      name: 'photoUrl',
      displayName: 'Photo URL',
      type: 'string',
      placeholder: 'https://example.com/image.jpg',
      description: 'URL of photo to send (for sendPhoto operation)',
    },
    {
      name: 'caption',
      displayName: 'Caption',
      type: 'string',
      placeholder: 'Photo caption',
      description: 'Caption for photo or document',
    },
  ],
});

export class TelegramNodeExecutor implements INodeExecutor {
  async execute(context: NodeExecutionContext): Promise<NodeExecutionResult> {
    const startTime = Date.now();
    
    try {
      const { operation, chatId, text, parseMode, disableWebPagePreview, photoUrl, caption } = context.parameters;
      
      // Simulate Telegram Bot API integration
      // In a real implementation, you would use Telegram Bot API
      
      if (operation === 'sendMessage') {
        if (!text) {
          throw new Error('Message text is required');
        }
        
        const messageData = {
          ok: true,
          result: {
            message_id: Date.now(),
            from: {
              id: 123456789,
              is_bot: true,
              first_name: 'WeConnect Bot',
              username: 'weconnect_bot',
            },
            chat: {
              id: parseInt(chatId) || 0,
              type: 'private',
            },
            date: Math.floor(Date.now() / 1000),
            text,
          },
        };
        
        return {
          success: true,
          data: [messageData],
          metadata: {
            executionTime: Date.now() - startTime,
            itemsProcessed: 1,
            operation: 'sendMessage',
          },
        };
      } else if (operation === 'sendPhoto') {
        if (!photoUrl) {
          throw new Error('Photo URL is required for sending photo');
        }
        
        const photoData = {
          ok: true,
          result: {
            message_id: Date.now(),
            from: {
              id: 123456789,
              is_bot: true,
              first_name: 'WeConnect Bot',
              username: 'weconnect_bot',
            },
            chat: {
              id: parseInt(chatId) || 0,
              type: 'private',
            },
            date: Math.floor(Date.now() / 1000),
            photo: [
              {
                file_id: `photo_${Date.now()}`,
                file_unique_id: `unique_${Date.now()}`,
                width: 1280,
                height: 720,
                file_size: 102400,
              },
            ],
            caption: caption || '',
          },
        };
        
        return {
          success: true,
          data: [photoData],
          metadata: {
            executionTime: Date.now() - startTime,
            itemsProcessed: 1,
            operation: 'sendPhoto',
          },
        };
      } else if (operation === 'sendDocument') {
        const documentData = {
          ok: true,
          result: {
            message_id: Date.now(),
            from: {
              id: 123456789,
              is_bot: true,
              first_name: 'WeConnect Bot',
              username: 'weconnect_bot',
            },
            chat: {
              id: parseInt(chatId) || 0,
              type: 'private',
            },
            date: Math.floor(Date.now() / 1000),
            document: {
              file_name: 'document.pdf',
              mime_type: 'application/pdf',
              file_id: `doc_${Date.now()}`,
              file_unique_id: `unique_doc_${Date.now()}`,
              file_size: 51200,
            },
            caption: caption || '',
          },
        };
        
        return {
          success: true,
          data: [documentData],
          metadata: {
            executionTime: Date.now() - startTime,
            itemsProcessed: 1,
            operation: 'sendDocument',
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
}
