import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { WorkflowNode } from '../../../domain/entities/workflow-node.entity';
import { NodeExecutor } from '../node-executor.interface';
import { CredentialIntegrationService } from '../../../../credentials/application/services/credential-integration.service';

export interface DiscordConfig {
  operation: 'sendMessage' | 'sendEmbed' | 'editMessage' | 'deleteMessage' | 'getChannel';
  // Authentication
  webhookUrl?: string;
  botToken?: string;
  credentialId?: string;
  // Channel/Message fields
  channelId?: string;
  messageId?: string;
  content?: string;
  username?: string;
  avatarUrl?: string;
  tts?: boolean;
  // Embed fields
  embed?: {
    title?: string;
    description?: string;
    color?: number;
    url?: string;
    timestamp?: string;
    footer?: {
      text: string;
      iconUrl?: string;
    };
    image?: {
      url: string;
    };
    thumbnail?: {
      url: string;
    };
    author?: {
      name: string;
      iconUrl?: string;
      url?: string;
    };
    fields?: Array<{
      name: string;
      value: string;
      inline?: boolean;
    }>;
  };
}

@Injectable()
export class DiscordNodeExecutor implements NodeExecutor {
  private readonly logger = new Logger(DiscordNodeExecutor.name);

  constructor(
    private httpService: HttpService,
    private credentialIntegrationService: CredentialIntegrationService,
  ) {}

  async execute(
    node: WorkflowNode,
    inputData: Record<string, any>,
    executionId: string,
  ): Promise<Record<string, any>> {
    const config = node.configuration as DiscordConfig;
    this.logger.log(`Executing Discord operation: ${config.operation}`);

    try {
      let result: any;

      switch (config.operation) {
        case 'sendMessage':
          result = await this.sendMessage(config, inputData);
          break;
        case 'sendEmbed':
          result = await this.sendEmbed(config, inputData);
          break;
        case 'editMessage':
          result = await this.editMessage(config, inputData);
          break;
        case 'deleteMessage':
          result = await this.deleteMessage(config, inputData);
          break;
        case 'getChannel':
          result = await this.getChannel(config, inputData);
          break;
        default:
          throw new Error(`Unsupported Discord operation: ${config.operation}`);
      }

      return {
        ...inputData,
        discord: result,
        _discord: {
          nodeId: node.id,
          nodeName: node.name,
          operation: config.operation,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.logger.error(`Discord operation failed: ${error.message}`);
      
      return {
        ...inputData,
        discord: null,
        discordError: error.message,
        _discord: {
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
    const config = configuration as DiscordConfig;
    
    if (!config.operation) return false;

    // For webhook operations, webhookUrl is required
    const webhookOps = ['sendMessage', 'sendEmbed'];
    if (webhookOps.includes(config.operation) && !config.webhookUrl) {
      return false;
    }

    // For bot operations, bot token is required
    const botOps = ['editMessage', 'deleteMessage', 'getChannel'];
    if (botOps.includes(config.operation) && !config.botToken && !config.credentialId) {
      return false;
    }

    switch (config.operation) {
      case 'sendMessage':
        return !!config.content;
      case 'sendEmbed':
        return !!(config.embed && (config.embed.title || config.embed.description));
      case 'editMessage':
        return !!(config.channelId && config.messageId && config.content);
      case 'deleteMessage':
        return !!(config.channelId && config.messageId);
      case 'getChannel':
        return !!config.channelId;
      default:
        return false;
    }
  }

  private async sendMessage(
    config: DiscordConfig,
    inputData: Record<string, any>,
  ): Promise<any> {
    const webhookUrl = this.replaceVariables(config.webhookUrl!, inputData);
    
    const payload: any = {
      content: this.replaceVariables(config.content!, inputData),
    };

    if (config.username) {
      payload.username = this.replaceVariables(config.username, inputData);
    }

    if (config.avatarUrl) {
      payload.avatar_url = this.replaceVariables(config.avatarUrl, inputData);
    }

    if (config.tts) {
      payload.tts = config.tts;
    }

    const response = await lastValueFrom(
      this.httpService.post(webhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
    );

    return {
      messageId: response.data?.id,
      channelId: response.data?.channel_id,
      content: payload.content,
      status: 'sent',
    };
  }

  private async sendEmbed(
    config: DiscordConfig,
    inputData: Record<string, any>,
  ): Promise<any> {
    const webhookUrl = this.replaceVariables(config.webhookUrl!, inputData);
    
    const embed = this.processEmbed(config.embed!, inputData);
    
    const payload: any = {
      embeds: [embed],
    };

    if (config.content) {
      payload.content = this.replaceVariables(config.content, inputData);
    }

    if (config.username) {
      payload.username = this.replaceVariables(config.username, inputData);
    }

    if (config.avatarUrl) {
      payload.avatar_url = this.replaceVariables(config.avatarUrl, inputData);
    }

    const response = await lastValueFrom(
      this.httpService.post(webhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
    );

    return {
      messageId: response.data?.id,
      channelId: response.data?.channel_id,
      embed,
      status: 'sent',
    };
  }

  private async editMessage(
    config: DiscordConfig,
    inputData: Record<string, any>,
  ): Promise<any> {
    const botToken = await this.getBotToken(config, inputData);
    const channelId = this.replaceVariables(config.channelId!, inputData);
    const messageId = this.replaceVariables(config.messageId!, inputData);
    
    const payload: any = {
      content: this.replaceVariables(config.content!, inputData),
    };

    const response = await lastValueFrom(
      this.httpService.patch(
        `https://discord.com/api/v10/channels/${channelId}/messages/${messageId}`,
        payload,
        {
          headers: {
            'Authorization': `Bot ${botToken}`,
            'Content-Type': 'application/json',
          },
        }
      )
    );

    return {
      messageId: response.data.id,
      channelId: response.data.channel_id,
      content: response.data.content,
      status: 'edited',
    };
  }

  private async deleteMessage(
    config: DiscordConfig,
    inputData: Record<string, any>,
  ): Promise<any> {
    const botToken = await this.getBotToken(config, inputData);
    const channelId = this.replaceVariables(config.channelId!, inputData);
    const messageId = this.replaceVariables(config.messageId!, inputData);

    await lastValueFrom(
      this.httpService.delete(
        `https://discord.com/api/v10/channels/${channelId}/messages/${messageId}`,
        {
          headers: {
            'Authorization': `Bot ${botToken}`,
          },
        }
      )
    );

    return {
      messageId,
      channelId,
      status: 'deleted',
    };
  }

  private async getChannel(
    config: DiscordConfig,
    inputData: Record<string, any>,
  ): Promise<any> {
    const botToken = await this.getBotToken(config, inputData);
    const channelId = this.replaceVariables(config.channelId!, inputData);

    const response = await lastValueFrom(
      this.httpService.get(
        `https://discord.com/api/v10/channels/${channelId}`,
        {
          headers: {
            'Authorization': `Bot ${botToken}`,
          },
        }
      )
    );

    const channel = response.data;

    return {
      id: channel.id,
      name: channel.name,
      type: channel.type,
      guildId: channel.guild_id,
      position: channel.position,
      topic: channel.topic,
      nsfw: channel.nsfw,
      parentId: channel.parent_id,
    };
  }

  private async getBotToken(config: DiscordConfig, inputData: Record<string, any>): Promise<string> {
    if (config.botToken) {
      return this.replaceVariables(config.botToken, inputData);
    }

    if (config.credentialId) {
      // TODO: Integrate with credential management system
      this.logger.warn('Using mock Discord bot token - implement credential management');
      return 'mock_discord_bot_token';
    }

    throw new Error('No Discord bot token or credential ID provided');
  }

  private processEmbed(embed: any, inputData: Record<string, any>): any {
    const processedEmbed: any = {};

    if (embed.title) {
      processedEmbed.title = this.replaceVariables(embed.title, inputData);
    }

    if (embed.description) {
      processedEmbed.description = this.replaceVariables(embed.description, inputData);
    }

    if (embed.color !== undefined) {
      processedEmbed.color = embed.color;
    }

    if (embed.url) {
      processedEmbed.url = this.replaceVariables(embed.url, inputData);
    }

    if (embed.timestamp) {
      processedEmbed.timestamp = this.replaceVariables(embed.timestamp, inputData);
    }

    if (embed.footer) {
      processedEmbed.footer = {
        text: this.replaceVariables(embed.footer.text, inputData),
      };
      if (embed.footer.iconUrl) {
        processedEmbed.footer.icon_url = this.replaceVariables(embed.footer.iconUrl, inputData);
      }
    }

    if (embed.image) {
      processedEmbed.image = {
        url: this.replaceVariables(embed.image.url, inputData),
      };
    }

    if (embed.thumbnail) {
      processedEmbed.thumbnail = {
        url: this.replaceVariables(embed.thumbnail.url, inputData),
      };
    }

    if (embed.author) {
      processedEmbed.author = {
        name: this.replaceVariables(embed.author.name, inputData),
      };
      if (embed.author.iconUrl) {
        processedEmbed.author.icon_url = this.replaceVariables(embed.author.iconUrl, inputData);
      }
      if (embed.author.url) {
        processedEmbed.author.url = this.replaceVariables(embed.author.url, inputData);
      }
    }

    if (embed.fields && Array.isArray(embed.fields)) {
      processedEmbed.fields = embed.fields.map((field: any) => ({
        name: this.replaceVariables(field.name, inputData),
        value: this.replaceVariables(field.value, inputData),
        inline: field.inline || false,
      }));
    }

    return processedEmbed;
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
