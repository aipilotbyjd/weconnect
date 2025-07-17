import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { WorkflowNode } from '../../../domain/entities/workflow-node.entity';
import { NodeExecutor } from '../node-executor.interface';
import { CredentialIntegrationService } from '../../../../credentials/application/services/credential-integration.service';

export interface TelegramConfig {
  operation:
    | 'sendMessage'
    | 'sendPhoto'
    | 'sendDocument'
    | 'editMessage'
    | 'deleteMessage';
  botToken?: string;
  credentialId?: string;
  chatId?: string;
  messageId?: string;
  text?: string;
  parseMode?: 'Markdown' | 'HTML';
  disableWebPagePreview?: boolean;
  disableNotification?: boolean;
  replyToMessageId?: string;
  // Photo/Document fields
  photo?: string;
  document?: string;
  caption?: string;
  fileName?: string;
}

@Injectable()
export class TelegramNodeExecutor implements NodeExecutor {
  private readonly logger = new Logger(TelegramNodeExecutor.name);

  constructor(
    private httpService: HttpService,
    private credentialService: CredentialIntegrationService,
  ) {}

  async execute(
    node: WorkflowNode,
    inputData: Record<string, any>,
    executionId: string,
  ): Promise<Record<string, any>> {
    const config = node.configuration as TelegramConfig;
    this.logger.log(`Executing Telegram operation: ${config.operation}`);

    try {
      const botToken = await this.getBotToken(config, inputData);
      let result: any;

      switch (config.operation) {
        case 'sendMessage':
          result = await this.sendMessage(config, inputData, botToken);
          break;
        case 'sendPhoto':
          result = await this.sendPhoto(config, inputData, botToken);
          break;
        case 'sendDocument':
          result = await this.sendDocument(config, inputData, botToken);
          break;
        case 'editMessage':
          result = await this.editMessage(config, inputData, botToken);
          break;
        case 'deleteMessage':
          result = await this.deleteMessage(config, inputData, botToken);
          break;
        default:
          throw new Error(
            `Unsupported Telegram operation: ${config.operation}`,
          );
      }

      return {
        ...inputData,
        telegram: result,
        _telegram: {
          nodeId: node.id,
          nodeName: node.name,
          operation: config.operation,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.logger.error(`Telegram operation failed: ${error.message}`);

      return {
        ...inputData,
        telegram: null,
        telegramError: error.message,
        _telegram: {
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
    const config = configuration as TelegramConfig;

    if (!config.operation) return false;
    if (!config.botToken && !config.credentialId) return false;
    if (!config.chatId) return false;

    switch (config.operation) {
      case 'sendMessage':
        return !!config.text;
      case 'sendPhoto':
        return !!config.photo;
      case 'sendDocument':
        return !!config.document;
      case 'editMessage':
        return !!(config.messageId && config.text);
      case 'deleteMessage':
        return !!config.messageId;
      default:
        return false;
    }
  }

  private async getBotToken(
    config: TelegramConfig,
    inputData: Record<string, any>,
  ): Promise<string> {
    // First try direct bot token
    if (config.botToken) {
      return this.replaceVariables(config.botToken, inputData);
    }

    // Then try credential ID
    if (config.credentialId) {
      try {
        const credential = await this.credentialService.getCredentialById(
          config.credentialId,
          inputData._credentialContext,
        );
        const token = credential.data.botToken || credential.data.token;
        if (!token) {
          throw new Error('Telegram credential is missing botToken or token');
        }
        return token;
      } catch (error) {
        this.logger.error(
          `Failed to get Telegram credential: ${error.message}`,
        );
        throw new Error(
          `Failed to retrieve Telegram credentials: ${error.message}`,
        );
      }
    }

    // Finally try service-based credential lookup
    if (inputData._credentialContext) {
      try {
        const credential = await this.credentialService.getCredentialByService(
          'telegram',
          inputData._credentialContext,
        );
        const token = credential.data.botToken || credential.data.token;
        if (!token) {
          throw new Error('Telegram credential is missing botToken or token');
        }
        return token;
      } catch (error) {
        this.logger.error(
          `Failed to get Telegram credential by service: ${error.message}`,
        );
      }
    }

    throw new Error(
      'No Telegram bot token, credential ID, or valid service credentials provided',
    );
  }

  private async sendMessage(
    config: TelegramConfig,
    inputData: Record<string, any>,
    botToken: string,
  ): Promise<any> {
    const payload: any = {
      chat_id: this.replaceVariables(config.chatId!, inputData),
      text: this.replaceVariables(config.text!, inputData),
    };

    if (config.parseMode) {
      payload.parse_mode = config.parseMode;
    }

    if (config.disableWebPagePreview) {
      payload.disable_web_page_preview = config.disableWebPagePreview;
    }

    if (config.disableNotification) {
      payload.disable_notification = config.disableNotification;
    }

    if (config.replyToMessageId) {
      payload.reply_to_message_id = this.replaceVariables(
        config.replyToMessageId,
        inputData,
      );
    }

    const response = await lastValueFrom(
      this.httpService.post(
        `https://api.telegram.org/bot${botToken}/sendMessage`,
        payload,
      ),
    );

    if (!response.data.ok) {
      throw new Error(`Telegram API error: ${response.data.description}`);
    }

    return {
      messageId: response.data.result.message_id,
      chatId: response.data.result.chat.id,
      text: response.data.result.text,
      date: response.data.result.date,
      status: 'sent',
    };
  }

  private async sendPhoto(
    config: TelegramConfig,
    inputData: Record<string, any>,
    botToken: string,
  ): Promise<any> {
    const payload: any = {
      chat_id: this.replaceVariables(config.chatId!, inputData),
      photo: this.replaceVariables(config.photo!, inputData),
    };

    if (config.caption) {
      payload.caption = this.replaceVariables(config.caption, inputData);
    }

    if (config.parseMode) {
      payload.parse_mode = config.parseMode;
    }

    if (config.disableNotification) {
      payload.disable_notification = config.disableNotification;
    }

    if (config.replyToMessageId) {
      payload.reply_to_message_id = this.replaceVariables(
        config.replyToMessageId,
        inputData,
      );
    }

    const response = await lastValueFrom(
      this.httpService.post(
        `https://api.telegram.org/bot${botToken}/sendPhoto`,
        payload,
      ),
    );

    if (!response.data.ok) {
      throw new Error(`Telegram API error: ${response.data.description}`);
    }

    return {
      messageId: response.data.result.message_id,
      chatId: response.data.result.chat.id,
      photoId: response.data.result.photo[0].file_id,
      caption: response.data.result.caption,
      status: 'sent',
    };
  }

  private async sendDocument(
    config: TelegramConfig,
    inputData: Record<string, any>,
    botToken: string,
  ): Promise<any> {
    const payload: any = {
      chat_id: this.replaceVariables(config.chatId!, inputData),
      document: this.replaceVariables(config.document!, inputData),
    };

    if (config.caption) {
      payload.caption = this.replaceVariables(config.caption, inputData);
    }

    if (config.fileName) {
      payload.filename = this.replaceVariables(config.fileName, inputData);
    }

    if (config.parseMode) {
      payload.parse_mode = config.parseMode;
    }

    if (config.disableNotification) {
      payload.disable_notification = config.disableNotification;
    }

    if (config.replyToMessageId) {
      payload.reply_to_message_id = this.replaceVariables(
        config.replyToMessageId,
        inputData,
      );
    }

    const response = await lastValueFrom(
      this.httpService.post(
        `https://api.telegram.org/bot${botToken}/sendDocument`,
        payload,
      ),
    );

    if (!response.data.ok) {
      throw new Error(`Telegram API error: ${response.data.description}`);
    }

    return {
      messageId: response.data.result.message_id,
      chatId: response.data.result.chat.id,
      documentId: response.data.result.document.file_id,
      fileName: response.data.result.document.file_name,
      status: 'sent',
    };
  }

  private async editMessage(
    config: TelegramConfig,
    inputData: Record<string, any>,
    botToken: string,
  ): Promise<any> {
    const payload: any = {
      chat_id: this.replaceVariables(config.chatId!, inputData),
      message_id: this.replaceVariables(config.messageId!, inputData),
      text: this.replaceVariables(config.text!, inputData),
    };

    if (config.parseMode) {
      payload.parse_mode = config.parseMode;
    }

    if (config.disableWebPagePreview) {
      payload.disable_web_page_preview = config.disableWebPagePreview;
    }

    const response = await lastValueFrom(
      this.httpService.post(
        `https://api.telegram.org/bot${botToken}/editMessageText`,
        payload,
      ),
    );

    if (!response.data.ok) {
      throw new Error(`Telegram API error: ${response.data.description}`);
    }

    return {
      messageId: response.data.result.message_id,
      chatId: response.data.result.chat.id,
      text: response.data.result.text,
      status: 'edited',
    };
  }

  private async deleteMessage(
    config: TelegramConfig,
    inputData: Record<string, any>,
    botToken: string,
  ): Promise<any> {
    const payload = {
      chat_id: this.replaceVariables(config.chatId!, inputData),
      message_id: this.replaceVariables(config.messageId!, inputData),
    };

    const response = await lastValueFrom(
      this.httpService.post(
        `https://api.telegram.org/bot${botToken}/deleteMessage`,
        payload,
      ),
    );

    if (!response.data.ok) {
      throw new Error(`Telegram API error: ${response.data.description}`);
    }

    return {
      messageId: payload.message_id,
      chatId: payload.chat_id,
      status: 'deleted',
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
