import { NodeDefinition } from '../../../domain/entities/node-definition.entity';
import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '../../../domain/interfaces/node-executor.interface';
import { WebClient } from '@slack/web-api';

export const SlackNodeDefinition = new NodeDefinition({
  name: 'Slack',
  displayName: 'Slack',
  description: 'Send messages and interact with Slack',
  version: 1,
  group: ['communication'],
  icon: 'fa:slack',
  defaults: {
    name: 'Slack',
    color: '#4A154B',
  },
  inputs: ['main'],
  outputs: ['main'],
  credentials: [
    {
      name: 'slackApi',
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
        { name: 'Get Channel Info', value: 'getChannelInfo' },
        { name: 'List Channels', value: 'listChannels' },
      ],
      default: 'sendMessage',
      required: true,
    },
    {
      name: 'channel',
      displayName: 'Channel',
      type: 'string',
      required: true,
      placeholder: '#general',
      description: 'Channel name or ID',
    },
    {
      name: 'text',
      displayName: 'Text',
      type: 'string',
      required: true,
      placeholder: 'Hello from WeConnect!',
      description: 'Message text',
    },
    {
      name: 'username',
      displayName: 'Username',
      type: 'string',
      placeholder: 'WeConnect Bot',
      description: 'Bot username (optional)',
    },
    {
      name: 'attachments',
      displayName: 'Attachments',
      type: 'json',
      default: [],
      description: 'Message attachments',
    },
  ],
});

export class SlackNodeExecutor implements INodeExecutor {
  async execute(context: NodeExecutionContext): Promise<NodeExecutionResult> {
    const startTime = Date.now();

    try {
      const { operation, channel, text, username, attachments } = context.parameters;

      // Simulate Slack API integration
      // In a real implementation, you would use Slack Web API client

      if (operation === 'sendMessage') {
        if (!channel || !text) {
          throw new Error('Channel and Text are required for sending message');
        }

        // Simulate sending message
        const messageData = {
          ok: true,
          channel: channel,
          ts: Date.now().toString(),
          message: {
            text,
            username: username || 'WeConnect Bot',
            ts: Date.now().toString(),
            type: 'message',
            subtype: 'bot_message',
            attachments: attachments || [],
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
      } else if (operation === 'getChannelInfo') {
        // Simulate getting channel info
        const channelInfo = {
          ok: true,
          channel: {
            id: 'C1234567890',
            name: channel.replace('#', ''),
            is_channel: true,
            is_group: false,
            is_im: false,
            created: 1234567890,
            is_archived: false,
            is_general: channel === '#general',
            members: ['U1234567890', 'U0987654321'],
            topic: {
              value: 'Channel topic',
              creator: 'U1234567890',
              last_set: 1234567890,
            },
            purpose: {
              value: 'Channel purpose',
              creator: 'U1234567890',
              last_set: 1234567890,
            },
          },
        };

        return {
          success: true,
          data: [channelInfo],
          metadata: {
            executionTime: Date.now() - startTime,
            itemsProcessed: 1,
            operation: 'getChannelInfo',
          },
        };
      } else if (operation === 'listChannels') {
        // Simulate listing channels
        const channelsList = {
          ok: true,
          channels: [
            {
              id: 'C1234567890',
              name: 'general',
              is_channel: true,
              created: 1234567890,
              is_archived: false,
              is_general: true,
              members: ['U1234567890', 'U0987654321'],
            },
            {
              id: 'C2345678901',
              name: 'random',
              is_channel: true,
              created: 1234567891,
              is_archived: false,
              is_general: false,
              members: ['U1234567890'],
            },
          ],
        };

        return {
          success: true,
          data: [channelsList],
          metadata: {
            executionTime: Date.now() - startTime,
            itemsProcessed: channelsList.channels.length,
            operation: 'listChannels',
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
