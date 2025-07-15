import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { 
  BaseUnifiedNodeExecutor, 
  NodeExecutionContext, 
  NodeExecutionResult, 
  NodeSchema 
} from '../../interfaces/unified-node-executor.interface';

export interface SlackCredentials {
  token: string;
  botToken?: string;
}

@Injectable()
export class SlackNodeExecutor extends BaseUnifiedNodeExecutor {
  private readonly logger = new Logger(SlackNodeExecutor.name);

  constructor(private readonly httpService: HttpService) {
    super();
  }

  getSchema(): NodeSchema {
    return {
      name: 'slack',
      displayName: 'Slack',
      description: 'Send messages and interact with Slack workspaces',
      version: 1,
      group: ['communication', 'productivity'],
      icon: 'fab:slack',
      color: '#4A154B',
      inputs: ['main'],
      outputs: ['main'],
      credentials: [
        {
          name: 'slackApi',
          required: true,
          displayName: 'Slack API',
        },
      ],
      properties: [
        {
          name: 'operation',
          displayName: 'Operation',
          type: 'options',
          required: true,
          default: 'sendMessage',
          options: [
            { name: 'Send Message', value: 'sendMessage' },
            { name: 'Get Channel Info', value: 'getChannelInfo' },
            { name: 'List Channels', value: 'listChannels' },
            { name: 'Delete Message', value: 'deleteMessage' },
            { name: 'Upload File', value: 'uploadFile' },
            { name: 'Get User Info', value: 'getUserInfo' },
            { name: 'Set Channel Topic', value: 'setChannelTopic' },
          ],
        },
        {
          name: 'channel',
          displayName: 'Channel',
          type: 'string',
          required: true,
          placeholder: '#general',
          description: 'Channel name (with #) or channel ID',
          displayOptions: {
            show: {
              operation: ['sendMessage', 'getChannelInfo', 'deleteMessage', 'uploadFile', 'setChannelTopic'],
            },
          },
        },
        {
          name: 'text',
          displayName: 'Message Text',
          type: 'string',
          required: true,
          placeholder: 'Hello from WeConnect!',
          description: 'The message text to send',
          displayOptions: {
            show: {
              operation: ['sendMessage'],
            },
          },
        },
        {
          name: 'username',
          displayName: 'Bot Username',
          type: 'string',
          placeholder: 'WeConnect Bot',
          description: 'Custom username for the bot (optional)',
          displayOptions: {
            show: {
              operation: ['sendMessage'],
            },
          },
        },
        {
          name: 'iconEmoji',
          displayName: 'Icon Emoji',
          type: 'string',
          placeholder: ':robot_face:',
          description: 'Emoji to use as bot icon',
          displayOptions: {
            show: {
              operation: ['sendMessage'],
            },
          },
        },
        {
          name: 'threadTs',
          displayName: 'Thread Timestamp',
          type: 'string',
          description: 'Timestamp of parent message to reply in thread',
          displayOptions: {
            show: {
              operation: ['sendMessage'],
            },
          },
        },
        {
          name: 'messageTs',
          displayName: 'Message Timestamp',
          type: 'string',
          required: true,
          description: 'Timestamp of message to delete',
          displayOptions: {
            show: {
              operation: ['deleteMessage'],
            },
          },
        },
        {
          name: 'userId',
          displayName: 'User ID',
          type: 'string',
          required: true,
          description: 'Slack user ID',
          displayOptions: {
            show: {
              operation: ['getUserInfo'],
            },
          },
        },
        {
          name: 'topic',
          displayName: 'Topic',
          type: 'string',
          required: true,
          description: 'New channel topic',
          displayOptions: {
            show: {
              operation: ['setChannelTopic'],
            },
          },
        },
        {
          name: 'fileContent',
          displayName: 'File Content',
          type: 'string',
          description: 'Content of the file to upload',
          displayOptions: {
            show: {
              operation: ['uploadFile'],
            },
          },
        },
        {
          name: 'fileName',
          displayName: 'File Name',
          type: 'string',
          placeholder: 'document.txt',
          description: 'Name of the file',
          displayOptions: {
            show: {
              operation: ['uploadFile'],
            },
          },
        },
        {
          name: 'attachments',
          displayName: 'Attachments',
          type: 'json',
          default: [],
          description: 'Message attachments (JSON format)',
          displayOptions: {
            show: {
              operation: ['sendMessage'],
            },
          },
        },
      ],
      resources: {
        memoryMB: 64,
        timeoutSeconds: 30,
        rateLimitPerMinute: 100,
      },
    };
  }

  async execute(context: NodeExecutionContext): Promise<NodeExecutionResult> {
    const { operation } = context.parameters;
    const credentials = context.credentials as SlackCredentials;

    if (!credentials?.token) {
      return this.createErrorResult('Slack API token is required');
    }

    try {
      let result: any;

      switch (operation) {
        case 'sendMessage':
          result = await this.sendMessage(context, credentials);
          break;
        case 'getChannelInfo':
          result = await this.getChannelInfo(context, credentials);
          break;
        case 'listChannels':
          result = await this.listChannels(context, credentials);
          break;
        case 'deleteMessage':
          result = await this.deleteMessage(context, credentials);
          break;
        case 'uploadFile':
          result = await this.uploadFile(context, credentials);
          break;
        case 'getUserInfo':
          result = await this.getUserInfo(context, credentials);
          break;
        case 'setChannelTopic':
          result = await this.setChannelTopic(context, credentials);
          break;
        default:
          return this.createErrorResult(`Unsupported operation: ${operation}`);
      }

      return this.createSuccessResult(result, {
        operation,
        apiCallsUsed: 1,
      });
    } catch (error) {
      this.logger.error(`Slack operation failed: ${error.message}`);
      return this.createErrorResult(error.message);
    }
  }

  async testConnection(credentials: Record<string, any>): Promise<boolean> {
    try {
      const response = await lastValueFrom(
        this.httpService.get('https://slack.com/api/auth.test', {
          headers: {
            'Authorization': `Bearer ${credentials.token}`,
          },
        })
      );

      return response.data.ok === true;
    } catch (error) {
      this.logger.error(`Slack connection test failed: ${error.message}`);
      return false;
    }
  }

  async getOptions(
    optionName: string,
    credentials: Record<string, any>,
    parameters: Record<string, any>
  ): Promise<{ name: string; value: any }[]> {
    if (optionName === 'channel') {
      try {
        const response = await lastValueFrom(
          this.httpService.get('https://slack.com/api/conversations.list', {
            headers: {
              'Authorization': `Bearer ${credentials.token}`,
            },
          })
        );

        if (response.data.ok) {
          return response.data.channels.map((channel: any) => ({
            name: `#${channel.name}`,
            value: channel.id,
          }));
        }
      } catch (error) {
        this.logger.error(`Failed to fetch channels: ${error.message}`);
      }
    }

    return [];
  }

  private async sendMessage(
    context: NodeExecutionContext,
    credentials: SlackCredentials
  ): Promise<any> {
    const { channel, text, username, iconEmoji, threadTs, attachments } = context.parameters;

    const payload: any = {
      channel: this.replaceVariables(channel, context),
      text: this.replaceVariables(text, context),
    };

    if (username) {
      payload.username = this.replaceVariables(username, context);
    }

    if (iconEmoji) {
      payload.icon_emoji = this.replaceVariables(iconEmoji, context);
    }

    if (threadTs) {
      payload.thread_ts = this.replaceVariables(threadTs, context);
    }

    if (attachments && Array.isArray(attachments)) {
      payload.attachments = attachments;
    }

    const response = await lastValueFrom(
      this.httpService.post('https://slack.com/api/chat.postMessage', payload, {
        headers: {
          'Authorization': `Bearer ${credentials.token}`,
          'Content-Type': 'application/json',
        },
      })
    );

    if (!response.data.ok) {
      throw new Error(`Slack API error: ${response.data.error}`);
    }

    return {
      messageTs: response.data.ts,
      channel: response.data.channel,
      text: payload.text,
      permalink: response.data.message?.permalink,
      status: 'sent',
    };
  }

  private async getChannelInfo(
    context: NodeExecutionContext,
    credentials: SlackCredentials
  ): Promise<any> {
    const channel = this.replaceVariables(context.parameters.channel, context);

    const response = await lastValueFrom(
      this.httpService.get(
        `https://slack.com/api/conversations.info?channel=${encodeURIComponent(channel)}`,
        {
          headers: {
            'Authorization': `Bearer ${credentials.token}`,
          },
        }
      )
    );

    if (!response.data.ok) {
      throw new Error(`Slack API error: ${response.data.error}`);
    }

    const channelInfo = response.data.channel;
    return {
      id: channelInfo.id,
      name: channelInfo.name,
      isChannel: channelInfo.is_channel,
      isPrivate: channelInfo.is_private,
      created: channelInfo.created,
      creator: channelInfo.creator,
      isArchived: channelInfo.is_archived,
      numMembers: channelInfo.num_members,
      topic: channelInfo.topic,
      purpose: channelInfo.purpose,
    };
  }

  private async listChannels(
    context: NodeExecutionContext,
    credentials: SlackCredentials
  ): Promise<any> {
    const response = await lastValueFrom(
      this.httpService.get(
        'https://slack.com/api/conversations.list?types=public_channel,private_channel',
        {
          headers: {
            'Authorization': `Bearer ${credentials.token}`,
          },
        }
      )
    );

    if (!response.data.ok) {
      throw new Error(`Slack API error: ${response.data.error}`);
    }

    return {
      channels: response.data.channels.map((channel: any) => ({
        id: channel.id,
        name: channel.name,
        isChannel: channel.is_channel,
        isPrivate: channel.is_private,
        created: channel.created,
        numMembers: channel.num_members,
        topic: channel.topic?.value || '',
        purpose: channel.purpose?.value || '',
      })),
      responseMetadata: response.data.response_metadata,
    };
  }

  private async deleteMessage(
    context: NodeExecutionContext,
    credentials: SlackCredentials
  ): Promise<any> {
    const { channel, messageTs } = context.parameters;

    const response = await lastValueFrom(
      this.httpService.post(
        'https://slack.com/api/chat.delete',
        {
          channel: this.replaceVariables(channel, context),
          ts: this.replaceVariables(messageTs, context),
        },
        {
          headers: {
            'Authorization': `Bearer ${credentials.token}`,
            'Content-Type': 'application/json',
          },
        }
      )
    );

    if (!response.data.ok) {
      throw new Error(`Slack API error: ${response.data.error}`);
    }

    return {
      channel,
      ts: messageTs,
      status: 'deleted',
    };
  }

  private async uploadFile(
    context: NodeExecutionContext,
    credentials: SlackCredentials
  ): Promise<any> {
    const { channel, fileContent, fileName } = context.parameters;

    const formData = new FormData();
    formData.append('channels', this.replaceVariables(channel, context));
    formData.append('content', this.replaceVariables(fileContent, context));

    if (fileName) {
      formData.append('filename', this.replaceVariables(fileName, context));
    }

    const response = await lastValueFrom(
      this.httpService.post('https://slack.com/api/files.upload', formData, {
        headers: {
          'Authorization': `Bearer ${credentials.token}`,
        },
      })
    );

    if (!response.data.ok) {
      throw new Error(`Slack API error: ${response.data.error}`);
    }

    return {
      fileId: response.data.file.id,
      fileName: response.data.file.name,
      title: response.data.file.title,
      permalink: response.data.file.permalink,
      status: 'uploaded',
    };
  }

  private async getUserInfo(
    context: NodeExecutionContext,
    credentials: SlackCredentials
  ): Promise<any> {
    const userId = this.replaceVariables(context.parameters.userId, context);

    const response = await lastValueFrom(
      this.httpService.get(
        `https://slack.com/api/users.info?user=${encodeURIComponent(userId)}`,
        {
          headers: {
            'Authorization': `Bearer ${credentials.token}`,
          },
        }
      )
    );

    if (!response.data.ok) {
      throw new Error(`Slack API error: ${response.data.error}`);
    }

    const user = response.data.user;
    return {
      id: user.id,
      name: user.name,
      realName: user.real_name,
      displayName: user.profile?.display_name,
      email: user.profile?.email,
      isBot: user.is_bot,
      isAdmin: user.is_admin,
      isOwner: user.is_owner,
      timezone: user.tz,
      status: user.profile?.status_text,
    };
  }

  private async setChannelTopic(
    context: NodeExecutionContext,
    credentials: SlackCredentials
  ): Promise<any> {
    const { channel, topic } = context.parameters;

    const response = await lastValueFrom(
      this.httpService.post(
        'https://slack.com/api/conversations.setTopic',
        {
          channel: this.replaceVariables(channel, context),
          topic: this.replaceVariables(topic, context),
        },
        {
          headers: {
            'Authorization': `Bearer ${credentials.token}`,
            'Content-Type': 'application/json',
          },
        }
      )
    );

    if (!response.data.ok) {
      throw new Error(`Slack API error: ${response.data.error}`);
    }

    return {
      channel,
      topic,
      status: 'updated',
    };
  }
}