import { NodeDefinition } from '../../../domain/entities/node-definition.entity';
import {
  INodeExecutor,
  NodeExecutionContext,
  NodeExecutionResult,
} from '../../../../../core/abstracts/base-node.interface';
import { WebClient } from '@slack/web-api';

export const SlackNodeDefinition = new NodeDefinition({
  name: 'Slack',
  displayName: 'Slack',
  description: 'Send messages and interact with Slack workspace',
  version: 1,
  group: ['communication', 'integrations'],
  icon: 'simple-icons:slack',
  defaults: {
    name: 'Slack',
    color: '#4A154B',
  },
  inputs: ['main'],
  outputs: ['main'],
  credentials: [
    {
      name: 'slack',
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
        { name: 'Update Message', value: 'updateMessage' },
        { name: 'Delete Message', value: 'deleteMessage' },
        { name: 'Send DM', value: 'sendDirectMessage' },
        { name: 'Upload File', value: 'uploadFile' },
        { name: 'Get Channel Info', value: 'getChannelInfo' },
        { name: 'List Channels', value: 'listChannels' },
        { name: 'Create Channel', value: 'createChannel' },
        { name: 'Invite to Channel', value: 'inviteToChannel' },
        { name: 'Get User Info', value: 'getUserInfo' },
        { name: 'List Users', value: 'listUsers' },
        { name: 'Set Status', value: 'setStatus' },
        { name: 'Add Reaction', value: 'addReaction' },
        { name: 'Remove Reaction', value: 'removeReaction' },
        { name: 'Pin Message', value: 'pinMessage' },
        { name: 'Unpin Message', value: 'unpinMessage' },
      ],
      default: 'sendMessage',
      required: true,
    },
    {
      name: 'channel',
      displayName: 'Channel',
      type: 'string',
      displayOptions: {
        show: {
          operation: [
            'sendMessage',
            'updateMessage',
            'deleteMessage',
            'uploadFile',
            'getChannelInfo',
            'inviteToChannel',
            'addReaction',
            'removeReaction',
            'pinMessage',
            'unpinMessage',
          ],
        },
      },
      required: true,
      placeholder: '#general or C1234567890',
      description: 'Channel name, ID, or @username for DM',
    },
    {
      name: 'text',
      displayName: 'Message Text',
      type: 'string',
      displayOptions: {
        show: {
          operation: ['sendMessage', 'updateMessage', 'sendDirectMessage'],
        },
      },
      required: true,
      placeholder: 'Hello from WeConnect!',
      description: 'Message text to send',
    },
    {
      name: 'user',
      displayName: 'User',
      type: 'string',
      displayOptions: {
        show: {
          operation: ['sendDirectMessage', 'getUserInfo', 'inviteToChannel'],
        },
      },
      required: true,
      placeholder: '@username or U1234567890',
      description: 'User ID or username',
    },
    {
      name: 'messageTs',
      displayName: 'Message Timestamp',
      type: 'string',
      displayOptions: {
        show: {
          operation: [
            'updateMessage',
            'deleteMessage',
            'addReaction',
            'removeReaction',
            'pinMessage',
            'unpinMessage',
          ],
        },
      },
      required: true,
      description: 'Timestamp of the message to modify',
    },
    {
      name: 'blocks',
      displayName: 'Message Blocks',
      type: 'json',
      default: [],
      displayOptions: {
        show: {
          operation: ['sendMessage', 'updateMessage', 'sendDirectMessage'],
        },
      },
      description: 'Slack Block Kit blocks for rich formatting',
    },
    {
      name: 'attachments',
      displayName: 'Attachments',
      type: 'json',
      default: [],
      displayOptions: {
        show: {
          operation: ['sendMessage', 'updateMessage', 'sendDirectMessage'],
        },
      },
      description: 'Legacy message attachments',
    },
    {
      name: 'threadTs',
      displayName: 'Thread Timestamp',
      type: 'string',
      default: '',
      displayOptions: {
        show: {
          operation: ['sendMessage', 'sendDirectMessage'],
        },
      },
      description: 'Timestamp of parent message to reply in thread',
    },
    {
      name: 'asUser',
      displayName: 'Post as User',
      type: 'boolean',
      default: false,
      displayOptions: {
        show: {
          operation: ['sendMessage', 'sendDirectMessage'],
        },
      },
      description: 'Post message as the authenticated user',
    },
    {
      name: 'username',
      displayName: 'Bot Username',
      type: 'string',
      default: '',
      displayOptions: {
        show: {
          operation: ['sendMessage', 'sendDirectMessage'],
        },
      },
      description: 'Override bot username',
    },
    {
      name: 'iconEmoji',
      displayName: 'Icon Emoji',
      type: 'string',
      default: '',
      displayOptions: {
        show: {
          operation: ['sendMessage', 'sendDirectMessage'],
        },
      },
      placeholder: ':robot_face:',
      description: 'Emoji to use as bot icon',
    },
    {
      name: 'iconUrl',
      displayName: 'Icon URL',
      type: 'string',
      default: '',
      displayOptions: {
        show: {
          operation: ['sendMessage', 'sendDirectMessage'],
        },
      },
      description: 'URL to image to use as bot icon',
    },
    {
      name: 'filePath',
      displayName: 'File Path',
      type: 'string',
      displayOptions: {
        show: {
          operation: ['uploadFile'],
        },
      },
      required: true,
      description: 'Path to file to upload',
    },
    {
      name: 'fileContent',
      displayName: 'File Content',
      type: 'string',
      displayOptions: {
        show: {
          operation: ['uploadFile'],
        },
      },
      description: 'File content as string (alternative to file path)',
    },
    {
      name: 'fileName',
      displayName: 'File Name',
      type: 'string',
      displayOptions: {
        show: {
          operation: ['uploadFile'],
        },
      },
      description: 'Name for the uploaded file',
    },
    {
      name: 'fileTitle',
      displayName: 'File Title',
      type: 'string',
      displayOptions: {
        show: {
          operation: ['uploadFile'],
        },
      },
      description: 'Title for the file',
    },
    {
      name: 'initialComment',
      displayName: 'Initial Comment',
      type: 'string',
      displayOptions: {
        show: {
          operation: ['uploadFile'],
        },
      },
      description: 'Initial comment for the file',
    },
    {
      name: 'channelName',
      displayName: 'Channel Name',
      type: 'string',
      displayOptions: {
        show: {
          operation: ['createChannel'],
        },
      },
      required: true,
      description: 'Name for the new channel',
    },
    {
      name: 'isPrivate',
      displayName: 'Private Channel',
      type: 'boolean',
      default: false,
      displayOptions: {
        show: {
          operation: ['createChannel'],
        },
      },
      description: 'Create as private channel',
    },
    {
      name: 'statusText',
      displayName: 'Status Text',
      type: 'string',
      displayOptions: {
        show: {
          operation: ['setStatus'],
        },
      },
      required: true,
      description: 'Status message text',
    },
    {
      name: 'statusEmoji',
      displayName: 'Status Emoji',
      type: 'string',
      displayOptions: {
        show: {
          operation: ['setStatus'],
        },
      },
      placeholder: ':coffee:',
      description: 'Emoji for status',
    },
    {
      name: 'statusExpiration',
      displayName: 'Status Expiration',
      type: 'number',
      displayOptions: {
        show: {
          operation: ['setStatus'],
        },
      },
      description: 'Unix timestamp when status expires',
    },
    {
      name: 'reaction',
      displayName: 'Reaction Emoji',
      type: 'string',
      displayOptions: {
        show: {
          operation: ['addReaction', 'removeReaction'],
        },
      },
      required: true,
      placeholder: 'thumbsup',
      description: 'Emoji name for reaction (without colons)',
    },
    {
      name: 'includeArchived',
      displayName: 'Include Archived',
      type: 'boolean',
      default: false,
      displayOptions: {
        show: {
          operation: ['listChannels'],
        },
      },
      description: 'Include archived channels in results',
    },
    {
      name: 'limit',
      displayName: 'Limit',
      type: 'number',
      default: 100,
      displayOptions: {
        show: {
          operation: ['listChannels', 'listUsers'],
        },
      },
      description: 'Maximum number of items to return',
    },
  ],
});

export class SlackNodeExecutor implements INodeExecutor {
  private client: WebClient | null = null;

  async execute(context: NodeExecutionContext): Promise<NodeExecutionResult> {
    const startTime = Date.now();
    const credentials = context.credentials?.slack;

    if (!credentials) {
      return {
        success: false,
        error: 'Slack credentials not configured',
        metadata: {
          executionTime: Date.now() - startTime,
        },
      };
    }

    try {
      // Initialize Slack Web API client
      this.client = new WebClient(credentials.token);

      const { operation } = context.parameters;
      let result: any;

      switch (operation) {
        case 'sendMessage':
          result = await this.sendMessage(context);
          break;
        case 'updateMessage':
          result = await this.updateMessage(context);
          break;
        case 'deleteMessage':
          result = await this.deleteMessage(context);
          break;
        case 'sendDirectMessage':
          result = await this.sendDirectMessage(context);
          break;
        case 'uploadFile':
          result = await this.uploadFile(context);
          break;
        case 'getChannelInfo':
          result = await this.getChannelInfo(context);
          break;
        case 'listChannels':
          result = await this.listChannels(context);
          break;
        case 'createChannel':
          result = await this.createChannel(context);
          break;
        case 'inviteToChannel':
          result = await this.inviteToChannel(context);
          break;
        case 'getUserInfo':
          result = await this.getUserInfo(context);
          break;
        case 'listUsers':
          result = await this.listUsers(context);
          break;
        case 'setStatus':
          result = await this.setStatus(context);
          break;
        case 'addReaction':
          result = await this.addReaction(context);
          break;
        case 'removeReaction':
          result = await this.removeReaction(context);
          break;
        case 'pinMessage':
          result = await this.pinMessage(context);
          break;
        case 'unpinMessage':
          result = await this.unpinMessage(context);
          break;
        default:
          throw new Error(`Unsupported operation: ${operation}`);
      }

      return {
        success: true,
        data: result,
        metadata: {
          executionTime: Date.now() - startTime,
          operation,
          channel: context.parameters.channel,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.data?.error || error.message,
        metadata: {
          executionTime: Date.now() - startTime,
        },
      };
    }
  }

  private async sendMessage(context: NodeExecutionContext): Promise<any> {
    const {
      channel,
      text,
      blocks,
      attachments,
      threadTs,
      asUser,
      username,
      iconEmoji,
      iconUrl,
    } = context.parameters;

    const options: any = {
      channel: channel,
      text: text,
    };

    if (blocks && blocks.length > 0) options.blocks = blocks;
    if (attachments && attachments.length > 0)
      options.attachments = attachments;
    if (threadTs) options.thread_ts = threadTs;
    if (asUser) options.as_user = true;
    if (username) options.username = username;
    if (iconEmoji) options.icon_emoji = iconEmoji;
    if (iconUrl) options.icon_url = iconUrl;

    const result = await this.client!.chat.postMessage(options);
    return result;
  }

  private async updateMessage(context: NodeExecutionContext): Promise<any> {
    const { channel, messageTs, text, blocks, attachments } =
      context.parameters;

    const options: any = {
      channel: channel,
      ts: messageTs,
      text: text,
    };

    if (blocks && blocks.length > 0) options.blocks = blocks;
    if (attachments && attachments.length > 0)
      options.attachments = attachments;

    const result = await this.client!.chat.update(options);
    return result;
  }

  private async deleteMessage(context: NodeExecutionContext): Promise<any> {
    const { channel, messageTs } = context.parameters;

    const result = await this.client!.chat.delete({
      channel: channel,
      ts: messageTs,
    });

    return result;
  }

  private async sendDirectMessage(context: NodeExecutionContext): Promise<any> {
    const {
      user,
      text,
      blocks,
      attachments,
      threadTs,
      asUser,
      username,
      iconEmoji,
      iconUrl,
    } = context.parameters;

    // Open DM channel with user first
    const dmChannel = await this.client!.conversations.open({
      users: user,
    });

    const options: any = {
      channel: dmChannel.channel?.id,
      text: text,
    };

    if (blocks && blocks.length > 0) options.blocks = blocks;
    if (attachments && attachments.length > 0)
      options.attachments = attachments;
    if (threadTs) options.thread_ts = threadTs;
    if (asUser) options.as_user = true;
    if (username) options.username = username;
    if (iconEmoji) options.icon_emoji = iconEmoji;
    if (iconUrl) options.icon_url = iconUrl;

    const result = await this.client!.chat.postMessage(options);
    return result;
  }

  private async uploadFile(context: NodeExecutionContext): Promise<any> {
    const {
      channel,
      filePath,
      fileContent,
      fileName,
      fileTitle,
      initialComment,
    } = context.parameters;

    const options: any = {
      channels: channel,
    };

    if (filePath) {
      const fs = require('fs');
      options.file = fs.createReadStream(filePath);
    } else if (fileContent) {
      options.content = fileContent;
    } else {
      throw new Error('Either filePath or fileContent must be provided');
    }

    if (fileName) options.filename = fileName;
    if (fileTitle) options.title = fileTitle;
    if (initialComment) options.initial_comment = initialComment;

    const result = await this.client!.files.upload(options);
    return result;
  }

  private async getChannelInfo(context: NodeExecutionContext): Promise<any> {
    const { channel } = context.parameters;

    const result = await this.client!.conversations.info({
      channel: channel,
    });

    return result;
  }

  private async listChannels(context: NodeExecutionContext): Promise<any> {
    const { includeArchived, limit } = context.parameters;

    const result = await this.client!.conversations.list({
      exclude_archived: !includeArchived,
      limit: limit || 100,
      types: 'public_channel,private_channel',
    });

    return result;
  }

  private async createChannel(context: NodeExecutionContext): Promise<any> {
    const { channelName, isPrivate } = context.parameters;

    const result = await this.client!.conversations.create({
      name: channelName,
      is_private: isPrivate,
    });

    return result;
  }

  private async inviteToChannel(context: NodeExecutionContext): Promise<any> {
    const { channel, user } = context.parameters;

    const result = await this.client!.conversations.invite({
      channel: channel,
      users: user,
    });

    return result;
  }

  private async getUserInfo(context: NodeExecutionContext): Promise<any> {
    const { user } = context.parameters;

    const result = await this.client!.users.info({
      user: user,
    });

    return result;
  }

  private async listUsers(context: NodeExecutionContext): Promise<any> {
    const { limit } = context.parameters;

    const result = await this.client!.users.list({
      limit: limit || 100,
    });

    return result;
  }

  private async setStatus(context: NodeExecutionContext): Promise<any> {
    const { statusText, statusEmoji, statusExpiration } = context.parameters;

    const profile: any = {
      status_text: statusText,
    };

    if (statusEmoji) profile.status_emoji = statusEmoji;
    if (statusExpiration) profile.status_expiration = statusExpiration;

    const result = await this.client!.users.profile.set({
      profile: profile,
    });

    return result;
  }

  private async addReaction(context: NodeExecutionContext): Promise<any> {
    const { channel, messageTs, reaction } = context.parameters;

    const result = await this.client!.reactions.add({
      channel: channel,
      timestamp: messageTs,
      name: reaction,
    });

    return result;
  }

  private async removeReaction(context: NodeExecutionContext): Promise<any> {
    const { channel, messageTs, reaction } = context.parameters;

    const result = await this.client!.reactions.remove({
      channel: channel,
      timestamp: messageTs,
      name: reaction,
    });

    return result;
  }

  private async pinMessage(context: NodeExecutionContext): Promise<any> {
    const { channel, messageTs } = context.parameters;

    const result = await this.client!.pins.add({
      channel: channel,
      timestamp: messageTs,
    });

    return result;
  }

  private async unpinMessage(context: NodeExecutionContext): Promise<any> {
    const { channel, messageTs } = context.parameters;

    const result = await this.client!.pins.remove({
      channel: channel,
      timestamp: messageTs,
    });

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
      required: [],
    };
  }
}
