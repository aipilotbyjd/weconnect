import { NodeDefinition } from '../../../domain/entities/node-definition.entity';
import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '../../../../../core/abstracts/base-node.interface';
import axios, { AxiosInstance } from 'axios';

export const TeamsNodeDefinition = new NodeDefinition({
  name: 'Microsoft Teams',
  displayName: 'Microsoft Teams',
  description: 'Send messages and interact with Microsoft Teams',
  version: 1,
  group: ['communication', 'integrations'],
  icon: 'simple-icons:microsoftteams',
  defaults: {
    name: 'Microsoft Teams',
    color: '#6264A7',
  },
  inputs: ['main'],
  outputs: ['main'],
  credentials: [
    {
      name: 'microsoftTeams',
      required: true,
    },
  ],
  properties: [
    {
      name: 'operation',
      displayName: 'Operation',
      type: 'options',
      options: [
        { name: 'Send Channel Message', value: 'sendChannelMessage' },
        { name: 'Send Chat Message', value: 'sendChatMessage' },
        { name: 'Send Webhook Message', value: 'sendWebhookMessage' },
        { name: 'Reply to Message', value: 'replyToMessage' },
        { name: 'Update Message', value: 'updateMessage' },
        { name: 'Delete Message', value: 'deleteMessage' },
        { name: 'Get Team Info', value: 'getTeamInfo' },
        { name: 'List Teams', value: 'listTeams' },
        { name: 'Get Channel Info', value: 'getChannelInfo' },
        { name: 'List Channels', value: 'listChannels' },
        { name: 'Create Channel', value: 'createChannel' },
        { name: 'Get Chat Info', value: 'getChatInfo' },
        { name: 'List Chats', value: 'listChats' },
        { name: 'Add Team Member', value: 'addTeamMember' },
        { name: 'Remove Team Member', value: 'removeTeamMember' },
      ],
      default: 'sendChannelMessage',
      required: true,
    },
    {
      name: 'teamId',
      displayName: 'Team ID',
      type: 'string',
      displayOptions: {
        show: {
          operation: ['sendChannelMessage', 'getTeamInfo', 'listChannels', 'createChannel', 'addTeamMember', 'removeTeamMember'],
        },
      },
      required: true,
      description: 'Microsoft Teams team ID',
    },
    {
      name: 'channelId',
      displayName: 'Channel ID',
      type: 'string',
      displayOptions: {
        show: {
          operation: ['sendChannelMessage', 'replyToMessage', 'updateMessage', 'deleteMessage', 'getChannelInfo'],
        },
      },
      required: true,
      description: 'Microsoft Teams channel ID',
    },
    {
      name: 'chatId',
      displayName: 'Chat ID',
      type: 'string',
      displayOptions: {
        show: {
          operation: ['sendChatMessage', 'getChatInfo'],
        },
      },
      required: true,
      description: 'Microsoft Teams chat ID',
    },
    {
      name: 'webhookUrl',
      displayName: 'Webhook URL',
      type: 'string',
      displayOptions: {
        show: {
          operation: ['sendWebhookMessage'],
        },
      },
      required: true,
      description: 'Teams incoming webhook URL',
    },
    {
      name: 'messageId',
      displayName: 'Message ID',
      type: 'string',
      displayOptions: {
        show: {
          operation: ['replyToMessage', 'updateMessage', 'deleteMessage'],
        },
      },
      required: true,
      description: 'ID of the message to reply to, update, or delete',
    },
    {
      name: 'content',
      displayName: 'Message Content',
      type: 'string',
      displayOptions: {
        show: {
          operation: ['sendChannelMessage', 'sendChatMessage', 'replyToMessage', 'updateMessage'],
        },
      },
      required: true,
      placeholder: 'Hello from Microsoft Teams!',
      description: 'Message content (supports HTML and markdown)',
    },
    {
      name: 'contentType',
      displayName: 'Content Type',
      type: 'options',
      options: [
        { name: 'HTML', value: 'html' },
        { name: 'Text', value: 'text' },
      ],
      default: 'html',
      displayOptions: {
        show: {
          operation: ['sendChannelMessage', 'sendChatMessage', 'replyToMessage', 'updateMessage'],
        },
      },
      description: 'Format of the message content',
    },
    {
      name: 'subject',
      displayName: 'Subject',
      type: 'string',
      displayOptions: {
        show: {
          operation: ['sendChannelMessage'],
        },
      },
      description: 'Subject/title for the message',
    },
    {
      name: 'importance',
      displayName: 'Importance',
      type: 'options',
      options: [
        { name: 'Normal', value: 'normal' },
        { name: 'High', value: 'high' },
        { name: 'Urgent', value: 'urgent' },
      ],
      default: 'normal',
      displayOptions: {
        show: {
          operation: ['sendChannelMessage', 'sendChatMessage'],
        },
      },
      description: 'Importance level of the message',
    },
    {
      name: 'mentionedUsers',
      displayName: 'Mentioned Users',
      type: 'json',
      default: [],
      displayOptions: {
        show: {
          operation: ['sendChannelMessage', 'sendChatMessage'],
        },
      },
      description: 'Array of user IDs to mention',
    },
    {
      name: 'attachments',
      displayName: 'Attachments',
      type: 'json',
      default: [],
      displayOptions: {
        show: {
          operation: ['sendChannelMessage', 'sendChatMessage'],
        },
      },
      description: 'Array of attachment objects',
    },
    {
      name: 'webhookTitle',
      displayName: 'Webhook Title',
      type: 'string',
      displayOptions: {
        show: {
          operation: ['sendWebhookMessage'],
        },
      },
      description: 'Title for the webhook message',
    },
    {
      name: 'webhookText',
      displayName: 'Webhook Text',
      type: 'string',
      displayOptions: {
        show: {
          operation: ['sendWebhookMessage'],
        },
      },
      required: true,
      description: 'Text content for the webhook message',
    },
    {
      name: 'webhookColor',
      displayName: 'Webhook Color',
      type: 'string',
      default: '#0078d4',
      displayOptions: {
        show: {
          operation: ['sendWebhookMessage'],
        },
      },
      description: 'Color theme for the webhook message (hex color)',
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
      name: 'channelDescription',
      displayName: 'Channel Description',
      type: 'string',
      displayOptions: {
        show: {
          operation: ['createChannel'],
        },
      },
      description: 'Description for the new channel',
    },
    {
      name: 'channelType',
      displayName: 'Channel Type',
      type: 'options',
      options: [
        { name: 'Standard', value: 'standard' },
        { name: 'Private', value: 'private' },
      ],
      default: 'standard',
      displayOptions: {
        show: {
          operation: ['createChannel'],
        },
      },
      description: 'Type of channel to create',
    },
    {
      name: 'userId',
      displayName: 'User ID',
      type: 'string',
      displayOptions: {
        show: {
          operation: ['addTeamMember', 'removeTeamMember'],
        },
      },
      required: true,
      description: 'ID of the user to add or remove',
    },
    {
      name: 'memberRole',
      displayName: 'Member Role',
      type: 'options',
      options: [
        { name: 'Member', value: 'member' },
        { name: 'Owner', value: 'owner' },
      ],
      default: 'member',
      displayOptions: {
        show: {
          operation: ['addTeamMember'],
        },
      },
      description: 'Role for the new team member',
    },
  ],
});

export class TeamsNodeExecutor implements INodeExecutor {
  private client: AxiosInstance | null = null;

  async execute(context: NodeExecutionContext): Promise<NodeExecutionResult> {
    const startTime = Date.now();
    const credentials = context.credentials?.microsoftTeams;
    
    if (!credentials) {
      return {
        success: false,
        error: 'Microsoft Teams credentials not configured',
        metadata: {
          executionTime: Date.now() - startTime,
        },
      };
    }

    try {
      // Initialize Microsoft Graph API client
      this.client = axios.create({
        baseURL: 'https://graph.microsoft.com/v1.0',
        headers: {
          'Authorization': `Bearer ${credentials.accessToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      });

      const { operation } = context.parameters;
      let result: any;

      switch (operation) {
        case 'sendChannelMessage':
          result = await this.sendChannelMessage(context);
          break;
        case 'sendChatMessage':
          result = await this.sendChatMessage(context);
          break;
        case 'sendWebhookMessage':
          result = await this.sendWebhookMessage(context);
          break;
        case 'replyToMessage':
          result = await this.replyToMessage(context);
          break;
        case 'updateMessage':
          result = await this.updateMessage(context);
          break;
        case 'deleteMessage':
          result = await this.deleteMessage(context);
          break;
        case 'getTeamInfo':
          result = await this.getTeamInfo(context);
          break;
        case 'listTeams':
          result = await this.listTeams(context);
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
        case 'getChatInfo':
          result = await this.getChatInfo(context);
          break;
        case 'listChats':
          result = await this.listChats(context);
          break;
        case 'addTeamMember':
          result = await this.addTeamMember(context);
          break;
        case 'removeTeamMember':
          result = await this.removeTeamMember(context);
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
          teamId: context.parameters.teamId,
          channelId: context.parameters.channelId,
        },
      };

    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
        metadata: {
          executionTime: Date.now() - startTime,
        },
      };
    }
  }

  private async sendChannelMessage(context: NodeExecutionContext): Promise<any> {
    const {
      teamId,
      channelId,
      content,
      contentType,
      subject,
      importance,
      mentionedUsers,
      attachments,
    } = context.parameters;

    const message: any = {
      body: {
        contentType: contentType || 'html',
        content: content,
      },
      importance: importance || 'normal',
    };

    if (subject) message.subject = subject;
    if (attachments && attachments.length > 0) message.attachments = attachments;

    // Add mentions if specified
    if (mentionedUsers && mentionedUsers.length > 0) {
      message.mentions = mentionedUsers.map((userId: string, index: number) => ({
        id: index,
        mentionText: `@${userId}`,
        mentioned: {
          user: {
            id: userId,
          },
        },
      }));
    }

    const response = await this.client!.post(
      `/teams/${teamId}/channels/${channelId}/messages`,
      message
    );

    return response.data;
  }

  private async sendChatMessage(context: NodeExecutionContext): Promise<any> {
    const {
      chatId,
      content,
      contentType,
      importance,
      mentionedUsers,
      attachments,
    } = context.parameters;

    const message: any = {
      body: {
        contentType: contentType || 'html',
        content: content,
      },
      importance: importance || 'normal',
    };

    if (attachments && attachments.length > 0) message.attachments = attachments;

    // Add mentions if specified
    if (mentionedUsers && mentionedUsers.length > 0) {
      message.mentions = mentionedUsers.map((userId: string, index: number) => ({
        id: index,
        mentionText: `@${userId}`,
        mentioned: {
          user: {
            id: userId,
          },
        },
      }));
    }

    const response = await this.client!.post(`/chats/${chatId}/messages`, message);
    return response.data;
  }

  private async sendWebhookMessage(context: NodeExecutionContext): Promise<any> {
    const { webhookUrl, webhookTitle, webhookText, webhookColor } = context.parameters;

    const payload: any = {
      '@type': 'MessageCard',
      '@context': 'https://schema.org/extensions',
      summary: webhookTitle || 'Message from WeConnect',
      themeColor: webhookColor || '#0078d4',
      sections: [
        {
          activityTitle: webhookTitle || 'WeConnect Notification',
          activitySubtitle: new Date().toISOString(),
          text: webhookText,
        },
      ],
    };

    const webhookClient = axios.create({
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await webhookClient.post(webhookUrl, payload);
    return { success: true, status: response.status };
  }

  private async replyToMessage(context: NodeExecutionContext): Promise<any> {
    const { teamId, channelId, messageId, content, contentType } = context.parameters;

    const reply = {
      body: {
        contentType: contentType || 'html',
        content: content,
      },
    };

    const response = await this.client!.post(
      `/teams/${teamId}/channels/${channelId}/messages/${messageId}/replies`,
      reply
    );

    return response.data;
  }

  private async updateMessage(context: NodeExecutionContext): Promise<any> {
    const { teamId, channelId, messageId, content, contentType } = context.parameters;

    const updatedMessage = {
      body: {
        contentType: contentType || 'html',
        content: content,
      },
    };

    const response = await this.client!.patch(
      `/teams/${teamId}/channels/${channelId}/messages/${messageId}`,
      updatedMessage
    );

    return response.data;
  }

  private async deleteMessage(context: NodeExecutionContext): Promise<any> {
    const { teamId, channelId, messageId } = context.parameters;

    await this.client!.delete(
      `/teams/${teamId}/channels/${channelId}/messages/${messageId}`
    );

    return { deleted: true, messageId };
  }

  private async getTeamInfo(context: NodeExecutionContext): Promise<any> {
    const { teamId } = context.parameters;

    const response = await this.client!.get(`/teams/${teamId}`);
    return response.data;
  }

  private async listTeams(context: NodeExecutionContext): Promise<any> {
    const response = await this.client!.get('/me/joinedTeams');
    return response.data;
  }

  private async getChannelInfo(context: NodeExecutionContext): Promise<any> {
    const { teamId, channelId } = context.parameters;

    const response = await this.client!.get(`/teams/${teamId}/channels/${channelId}`);
    return response.data;
  }

  private async listChannels(context: NodeExecutionContext): Promise<any> {
    const { teamId } = context.parameters;

    const response = await this.client!.get(`/teams/${teamId}/channels`);
    return response.data;
  }

  private async createChannel(context: NodeExecutionContext): Promise<any> {
    const { teamId, channelName, channelDescription, channelType } = context.parameters;

    const channel = {
      displayName: channelName,
      description: channelDescription || '',
      membershipType: channelType || 'standard',
    };

    const response = await this.client!.post(`/teams/${teamId}/channels`, channel);
    return response.data;
  }

  private async getChatInfo(context: NodeExecutionContext): Promise<any> {
    const { chatId } = context.parameters;

    const response = await this.client!.get(`/chats/${chatId}`);
    return response.data;
  }

  private async listChats(context: NodeExecutionContext): Promise<any> {
    const response = await this.client!.get('/me/chats');
    return response.data;
  }

  private async addTeamMember(context: NodeExecutionContext): Promise<any> {
    const { teamId, userId, memberRole } = context.parameters;

    const member = {
      '@odata.type': '#microsoft.graph.aadUserConversationMember',
      'user@odata.bind': `https://graph.microsoft.com/v1.0/users('${userId}')`,
      roles: memberRole === 'owner' ? ['owner'] : ['member'],
    };

    const response = await this.client!.post(`/teams/${teamId}/members`, member);
    return response.data;
  }

  private async removeTeamMember(context: NodeExecutionContext): Promise<any> {
    const { teamId, userId } = context.parameters;

    // First, get the membership ID
    const membersResponse = await this.client!.get(`/teams/${teamId}/members`);
    const member = membersResponse.data.value.find((m: any) => m.userId === userId);

    if (!member) {
      throw new Error('User is not a member of this team');
    }

    await this.client!.delete(`/teams/${teamId}/members/${member.id}`);
    return { removed: true, userId };
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