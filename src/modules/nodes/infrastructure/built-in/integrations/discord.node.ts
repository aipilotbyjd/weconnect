import { NodeDefinition } from '../../../domain/entities/node-definition.entity';
import {
  INodeExecutor,
  NodeExecutionContext,
  NodeExecutionResult,
} from '../../../../../core/abstracts/base-node.interface';

export const DiscordNodeDefinition = new NodeDefinition({
  name: 'Discord',
  displayName: 'Discord',
  description: 'Send messages and interact with Discord',
  version: 1,
  group: ['communication'],
  icon: 'fa:discord',
  defaults: {
    name: 'Discord',
    color: '#5865F2',
  },
  inputs: ['main'],
  outputs: ['main'],
  credentials: [
    {
      name: 'discordWebhook',
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
        { name: 'Send Embed', value: 'sendEmbed' },
      ],
      default: 'sendMessage',
      required: true,
    },
    {
      name: 'content',
      displayName: 'Message Content',
      type: 'string',
      required: true,
      placeholder: 'Hello from WeConnect!',
      description: 'Message content to send',
    },
    {
      name: 'username',
      displayName: 'Username',
      type: 'string',
      placeholder: 'WeConnect Bot',
      description: 'Bot username (optional)',
    },
    {
      name: 'embedTitle',
      displayName: 'Embed Title',
      type: 'string',
      placeholder: 'Notification',
      description: 'Embed title (for embed messages)',
    },
    {
      name: 'embedDescription',
      displayName: 'Embed Description',
      type: 'string',
      placeholder: 'This is an embed message',
      description: 'Embed description (for embed messages)',
    },
    {
      name: 'embedColor',
      displayName: 'Embed Color',
      type: 'string',
      default: '#5865F2',
      placeholder: '#5865F2',
      description: 'Embed color in hex format',
    },
  ],
});

export class DiscordNodeExecutor implements INodeExecutor {
  async execute(context: NodeExecutionContext): Promise<NodeExecutionResult> {
    const startTime = Date.now();

    try {
      const {
        operation,
        content,
        username,
        embedTitle,
        embedDescription,
        embedColor,
      } = context.parameters;

      // Simulate Discord webhook integration
      // In a real implementation, you would use Discord webhook API

      if (operation === 'sendMessage') {
        if (!content) {
          throw new Error('Message content is required');
        }

        const messageData = {
          id: `discord_msg_${Date.now()}`,
          content,
          username: username || 'WeConnect Bot',
          timestamp: new Date().toISOString(),
          webhook_id: 'webhook_123456789',
          channel_id: 'channel_987654321',
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
      } else if (operation === 'sendEmbed') {
        if (!embedTitle || !embedDescription) {
          throw new Error('Embed title and description are required');
        }

        const embedData = {
          id: `discord_embed_${Date.now()}`,
          embeds: [
            {
              title: embedTitle,
              description: embedDescription,
              color: parseInt(embedColor.replace('#', ''), 16) || 0x5865f2,
              timestamp: new Date().toISOString(),
            },
          ],
          username: username || 'WeConnect Bot',
          timestamp: new Date().toISOString(),
          webhook_id: 'webhook_123456789',
          channel_id: 'channel_987654321',
        };

        return {
          success: true,
          data: [embedData],
          metadata: {
            executionTime: Date.now() - startTime,
            itemsProcessed: 1,
            operation: 'sendEmbed',
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
