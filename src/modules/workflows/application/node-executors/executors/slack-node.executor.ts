import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { WorkflowNode } from '../../../domain/entities/workflow-node.entity';
import { NodeExecutor } from '../node-executor.interface';
import { CredentialIntegrationService } from '../../../../credentials/application/services/credential-integration.service';

export interface SlackConfig {
  operation:
    | 'sendMessage'
    | 'getChannelInfo'
    | 'listChannels'
    | 'deleteMessage'
    | 'uploadFile';
  // Authentication
  token?: string;
  credentialId?: string;
  // Message fields
  channel?: string;
  text?: string;
  username?: string;
  iconEmoji?: string;
  iconUrl?: string;
  threadTs?: string;
  blocks?: any[];
  attachments?: any[];
  // File upload fields
  filePath?: string;
  fileName?: string;
  fileContent?: string;
  fileType?: string;
  title?: string;
  initialComment?: string;
  // Get/Delete message fields
  messageTs?: string;
}

@Injectable()
export class SlackNodeExecutor implements NodeExecutor {
  private readonly logger = new Logger(SlackNodeExecutor.name);

  constructor(
    private httpService: HttpService,
    private credentialIntegrationService: CredentialIntegrationService,
  ) {}

  async execute(
    node: WorkflowNode,
    inputData: Record<string, any>,
    executionId: string,
  ): Promise<Record<string, any>> {
    const config = node.configuration as SlackConfig;
    this.logger.log(`Executing Slack operation: ${config.operation}`);

    try {
      const token = await this.getToken(config, inputData);
      let result: any;

      switch (config.operation) {
        case 'sendMessage':
          result = await this.sendMessage(config, inputData, token);
          break;
        case 'getChannelInfo':
          result = await this.getChannelInfo(config, inputData, token);
          break;
        case 'listChannels':
          result = await this.listChannels(config, inputData, token);
          break;
        case 'deleteMessage':
          result = await this.deleteMessage(config, inputData, token);
          break;
        case 'uploadFile':
          result = await this.uploadFile(config, inputData, token);
          break;
        default:
          throw new Error(`Unsupported Slack operation: ${config.operation}`);
      }

      return {
        ...inputData,
        slack: result,
        _slack: {
          nodeId: node.id,
          nodeName: node.name,
          operation: config.operation,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.logger.error(`Slack operation failed: ${error.message}`);

      return {
        ...inputData,
        slack: null,
        slackError: error.message,
        _slack: {
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
    const config = configuration as SlackConfig;

    if (!config.operation) return false;
    if (!config.token && !config.credentialId) return false;

    switch (config.operation) {
      case 'sendMessage':
        return !!(config.channel && config.text);
      case 'getChannelInfo':
        return !!config.channel;
      case 'listChannels':
        return true; // No additional validation needed
      case 'deleteMessage':
        return !!(config.channel && config.messageTs);
      case 'uploadFile':
        return !!(config.channel && (config.filePath || config.fileContent));
      default:
        return false;
    }
  }

  private async getToken(
    config: SlackConfig,
    inputData: Record<string, any>,
  ): Promise<string> {
    if (config.token) {
      return this.replaceVariables(config.token, inputData);
    }

    if (config.credentialId) {
      try {
        const credential =
          await this.credentialIntegrationService.getCredentialById(
            config.credentialId,
            inputData._credentialContext,
          );
        return credential.data.token || credential.data.bot_token;
      } catch (error) {
        this.logger.error(`Failed to get Slack credential: ${error.message}`);
        throw new Error(
          `Failed to retrieve Slack credentials: ${error.message}`,
        );
      }
    }

    // Try to get credential by service name
    if (inputData._credentialContext) {
      try {
        const credential =
          await this.credentialIntegrationService.getCredentialByService(
            'slack',
            inputData._credentialContext,
          );
        return credential.data.token || credential.data.bot_token;
      } catch (error) {
        this.logger.error(
          `Failed to get Slack credential by service: ${error.message}`,
        );
      }
    }

    throw new Error('No Slack token or credential ID provided');
  }

  private async sendMessage(
    config: SlackConfig,
    inputData: Record<string, any>,
    token: string,
  ): Promise<any> {
    const payload: any = {
      channel: this.replaceVariables(config.channel!, inputData),
      text: this.replaceVariables(config.text!, inputData),
    };

    if (config.username) {
      payload.username = this.replaceVariables(config.username, inputData);
    }

    if (config.iconEmoji) {
      payload.icon_emoji = this.replaceVariables(config.iconEmoji, inputData);
    }

    if (config.iconUrl) {
      payload.icon_url = this.replaceVariables(config.iconUrl, inputData);
    }

    if (config.threadTs) {
      payload.thread_ts = this.replaceVariables(config.threadTs, inputData);
    }

    if (config.blocks) {
      payload.blocks = config.blocks;
    }

    if (config.attachments) {
      payload.attachments = config.attachments;
    }

    const response = await lastValueFrom(
      this.httpService.post('https://slack.com/api/chat.postMessage', payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }),
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
    config: SlackConfig,
    inputData: Record<string, any>,
    token: string,
  ): Promise<any> {
    const channel = this.replaceVariables(config.channel!, inputData);

    const response = await lastValueFrom(
      this.httpService.get(
        `https://slack.com/api/conversations.info?channel=${encodeURIComponent(channel)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      ),
    );

    if (!response.data.ok) {
      throw new Error(`Slack API error: ${response.data.error}`);
    }

    const channelInfo = response.data.channel;

    return {
      id: channelInfo.id,
      name: channelInfo.name,
      isChannel: channelInfo.is_channel,
      isGroup: channelInfo.is_group,
      isPrivate: channelInfo.is_private,
      created: channelInfo.created,
      creator: channelInfo.creator,
      isArchived: channelInfo.is_archived,
      isGeneral: channelInfo.is_general,
      numMembers: channelInfo.num_members,
      topic: channelInfo.topic,
      purpose: channelInfo.purpose,
    };
  }

  private async listChannels(
    config: SlackConfig,
    inputData: Record<string, any>,
    token: string,
  ): Promise<any> {
    const response = await lastValueFrom(
      this.httpService.get(
        'https://slack.com/api/conversations.list?types=public_channel,private_channel',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      ),
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
    config: SlackConfig,
    inputData: Record<string, any>,
    token: string,
  ): Promise<any> {
    const channel = this.replaceVariables(config.channel!, inputData);
    const ts = this.replaceVariables(config.messageTs!, inputData);

    const response = await lastValueFrom(
      this.httpService.post(
        'https://slack.com/api/chat.delete',
        {
          channel,
          ts,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      ),
    );

    if (!response.data.ok) {
      throw new Error(`Slack API error: ${response.data.error}`);
    }

    return {
      channel,
      ts,
      status: 'deleted',
    };
  }

  private async uploadFile(
    config: SlackConfig,
    inputData: Record<string, any>,
    token: string,
  ): Promise<any> {
    const formData = new FormData();

    formData.append(
      'channels',
      this.replaceVariables(config.channel!, inputData),
    );

    if (config.title) {
      formData.append('title', this.replaceVariables(config.title, inputData));
    }

    if (config.fileName) {
      formData.append(
        'filename',
        this.replaceVariables(config.fileName, inputData),
      );
    }

    if (config.fileType) {
      formData.append(
        'filetype',
        this.replaceVariables(config.fileType, inputData),
      );
    }

    if (config.initialComment) {
      formData.append(
        'initial_comment',
        this.replaceVariables(config.initialComment, inputData),
      );
    }

    // Handle file content
    if (config.fileContent) {
      const content = this.replaceVariables(config.fileContent, inputData);
      formData.append('content', content);
    } else if (config.filePath) {
      // For file path, we'd need to read the file from the filesystem
      // This is a simplified implementation
      formData.append('content', `File content from: ${config.filePath}`);
    }

    const response = await lastValueFrom(
      this.httpService.post('https://slack.com/api/files.upload', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
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
