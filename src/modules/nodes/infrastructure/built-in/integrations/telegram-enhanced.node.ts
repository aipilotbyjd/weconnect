import { NodeDefinition } from '../../../domain/entities/node-definition.entity';
import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '../../../../../core/abstracts/base-node.interface';
import axios, { AxiosInstance } from 'axios';

export const TelegramNodeDefinition = new NodeDefinition({
  name: 'Telegram',
  displayName: 'Telegram Bot',
  description: 'Send messages and interact with Telegram Bot API',
  version: 1,
  group: ['communication', 'integrations'],
  icon: 'simple-icons:telegram',
  defaults: {
    name: 'Telegram',
    color: '#0088cc',
  },
  inputs: ['main'],
  outputs: ['main'],
  credentials: [
    {
      name: 'telegram',
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
        { name: 'Send Video', value: 'sendVideo' },
        { name: 'Send Audio', value: 'sendAudio' },
        { name: 'Send Location', value: 'sendLocation' },
        { name: 'Send Poll', value: 'sendPoll' },
        { name: 'Edit Message', value: 'editMessage' },
        { name: 'Delete Message', value: 'deleteMessage' },
        { name: 'Forward Message', value: 'forwardMessage' },
        { name: 'Get Chat Info', value: 'getChatInfo' },
        { name: 'Get Updates', value: 'getUpdates' },
        { name: 'Answer Callback Query', value: 'answerCallbackQuery' },
      ],
      default: 'sendMessage',
      required: true,
    },
    {
      name: 'chatId',
      displayName: 'Chat ID',
      type: 'string',
      displayOptions: {
        show: {
          operation: ['sendMessage', 'sendPhoto', 'sendDocument', 'sendVideo', 'sendAudio', 'sendLocation', 'sendPoll', 'editMessage', 'deleteMessage', 'getChatInfo'],
        },
      },
      required: true,
      placeholder: '@channel_name or 123456789',
      description: 'Telegram chat ID, channel username, or group ID',
    },
    {
      name: 'text',
      displayName: 'Message Text',
      type: 'string',
      displayOptions: {
        show: {
          operation: ['sendMessage', 'editMessage'],
        },
      },
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
        { name: 'MarkdownV2', value: 'MarkdownV2' },
        { name: 'HTML', value: 'HTML' },
      ],
      default: '',
      displayOptions: {
        show: {
          operation: ['sendMessage', 'sendPhoto', 'sendDocument', 'sendVideo', 'sendAudio', 'editMessage'],
        },
      },
      description: 'Message formatting mode',
    },
    {
      name: 'disableWebPagePreview',
      displayName: 'Disable Web Page Preview',
      type: 'boolean',
      default: false,
      displayOptions: {
        show: {
          operation: ['sendMessage', 'editMessage'],
        },
      },
      description: 'Disable link previews for web links',
    },
    {
      name: 'disableNotification',
      displayName: 'Silent Message',
      type: 'boolean',
      default: false,
      displayOptions: {
        show: {
          operation: ['sendMessage', 'sendPhoto', 'sendDocument', 'sendVideo', 'sendAudio', 'sendLocation', 'sendPoll'],
        },
      },
      description: 'Send message silently without notification',
    },
    {
      name: 'replyToMessageId',
      displayName: 'Reply to Message ID',
      type: 'string',
      default: '',
      displayOptions: {
        show: {
          operation: ['sendMessage', 'sendPhoto', 'sendDocument', 'sendVideo', 'sendAudio', 'sendLocation', 'sendPoll'],
        },
      },
      description: 'ID of the message to reply to',
    },
    {
      name: 'messageId',
      displayName: 'Message ID',
      type: 'string',
      displayOptions: {
        show: {
          operation: ['editMessage', 'deleteMessage'],
        },
      },
      required: true,
      description: 'ID of the message to edit or delete',
    },
    {
      name: 'fromChatId',
      displayName: 'From Chat ID',
      type: 'string',
      displayOptions: {
        show: {
          operation: ['forwardMessage'],
        },
      },
      required: true,
      description: 'Chat ID where the message is from',
    },
    {
      name: 'messageToForward',
      displayName: 'Message ID to Forward',
      type: 'string',
      displayOptions: {
        show: {
          operation: ['forwardMessage'],
        },
      },
      required: true,
      description: 'ID of the message to forward',
    },
    {
      name: 'mediaUrl',
      displayName: 'Media URL',
      type: 'string',
      displayOptions: {
        show: {
          operation: ['sendPhoto', 'sendDocument', 'sendVideo', 'sendAudio'],
        },
      },
      required: true,
      placeholder: 'https://example.com/file.jpg',
      description: 'URL of the media file to send',
    },
    {
      name: 'caption',
      displayName: 'Caption',
      type: 'string',
      displayOptions: {
        show: {
          operation: ['sendPhoto', 'sendDocument', 'sendVideo', 'sendAudio'],
        },
      },
      description: 'Caption for the media file',
    },
    {
      name: 'latitude',
      displayName: 'Latitude',
      type: 'number',
      displayOptions: {
        show: {
          operation: ['sendLocation'],
        },
      },
      required: true,
      description: 'Latitude of the location',
    },
    {
      name: 'longitude',
      displayName: 'Longitude',
      type: 'number',
      displayOptions: {
        show: {
          operation: ['sendLocation'],
        },
      },
      required: true,
      description: 'Longitude of the location',
    },
    {
      name: 'question',
      displayName: 'Poll Question',
      type: 'string',
      displayOptions: {
        show: {
          operation: ['sendPoll'],
        },
      },
      required: true,
      description: 'The poll question',
    },
    {
      name: 'pollOptions',
      displayName: 'Poll Options',
      type: 'json',
      default: [],
      displayOptions: {
        show: {
          operation: ['sendPoll'],
        },
      },
      required: true,
      description: 'Array of poll options (strings)',
    },
    {
      name: 'isAnonymous',
      displayName: 'Anonymous Poll',
      type: 'boolean',
      default: true,
      displayOptions: {
        show: {
          operation: ['sendPoll'],
        },
      },
      description: 'Whether the poll is anonymous',
    },
    {
      name: 'allowsMultipleAnswers',
      displayName: 'Multiple Answers',
      type: 'boolean',
      default: false,
      displayOptions: {
        show: {
          operation: ['sendPoll'],
        },
      },
      description: 'Allow multiple answers',
    },
    {
      name: 'callbackQueryId',
      displayName: 'Callback Query ID',
      type: 'string',
      displayOptions: {
        show: {
          operation: ['answerCallbackQuery'],
        },
      },
      required: true,
      description: 'ID of the callback query to answer',
    },
    {
      name: 'callbackText',
      displayName: 'Callback Text',
      type: 'string',
      displayOptions: {
        show: {
          operation: ['answerCallbackQuery'],
        },
      },
      description: 'Text to show in notification',
    },
    {
      name: 'showAlert',
      displayName: 'Show Alert',
      type: 'boolean',
      default: false,
      displayOptions: {
        show: {
          operation: ['answerCallbackQuery'],
        },
      },
      description: 'Show an alert instead of notification',
    },
    {
      name: 'inlineKeyboard',
      displayName: 'Inline Keyboard',
      type: 'json',
      default: [],
      displayOptions: {
        show: {
          operation: ['sendMessage', 'sendPhoto', 'sendDocument', 'sendVideo', 'sendAudio', 'editMessage'],
        },
      },
      description: 'Inline keyboard markup as JSON array',
    },
    {
      name: 'offset',
      displayName: 'Updates Offset',
      type: 'number',
      default: 0,
      displayOptions: {
        show: {
          operation: ['getUpdates'],
        },
      },
      description: 'Offset for getting updates',
    },
    {
      name: 'limit',
      displayName: 'Updates Limit',
      type: 'number',
      default: 100,
      displayOptions: {
        show: {
          operation: ['getUpdates'],
        },
      },
      description: 'Limit number of updates to retrieve',
    },
  ],
});

export class TelegramNodeExecutor implements INodeExecutor {
  private client: AxiosInstance | null = null;

  async execute(context: NodeExecutionContext): Promise<NodeExecutionResult> {
    const startTime = Date.now();
    const credentials = context.credentials?.telegram;
    
    if (!credentials) {
      return {
        success: false,
        error: 'Telegram credentials not configured',
        metadata: {
          executionTime: Date.now() - startTime,
        },
      };
    }

    try {
      // Initialize Telegram Bot API client
      this.client = axios.create({
        baseURL: `https://api.telegram.org/bot${credentials.botToken}`,
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      });

      const { operation } = context.parameters;
      let result: any;

      switch (operation) {
        case 'sendMessage':
          result = await this.sendMessage(context);
          break;
        case 'sendPhoto':
          result = await this.sendPhoto(context);
          break;
        case 'sendDocument':
          result = await this.sendDocument(context);
          break;
        case 'sendVideo':
          result = await this.sendVideo(context);
          break;
        case 'sendAudio':
          result = await this.sendAudio(context);
          break;
        case 'sendLocation':
          result = await this.sendLocation(context);
          break;
        case 'sendPoll':
          result = await this.sendPoll(context);
          break;
        case 'editMessage':
          result = await this.editMessage(context);
          break;
        case 'deleteMessage':
          result = await this.deleteMessage(context);
          break;
        case 'forwardMessage':
          result = await this.forwardMessage(context);
          break;
        case 'getChatInfo':
          result = await this.getChatInfo(context);
          break;
        case 'getUpdates':
          result = await this.getUpdates(context);
          break;
        case 'answerCallbackQuery':
          result = await this.answerCallbackQuery(context);
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
          chatId: context.parameters.chatId,
        },
      };

    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.description || error.message,
        metadata: {
          executionTime: Date.now() - startTime,
        },
      };
    }
  }

  private async sendMessage(context: NodeExecutionContext): Promise<any> {
    const {
      chatId,
      text,
      parseMode,
      disableWebPagePreview,
      disableNotification,
      replyToMessageId,
      inlineKeyboard,
    } = context.parameters;

    const payload: any = {
      chat_id: chatId,
      text: text,
    };

    if (parseMode) payload.parse_mode = parseMode;
    if (disableWebPagePreview) payload.disable_web_page_preview = true;
    if (disableNotification) payload.disable_notification = true;
    if (replyToMessageId) payload.reply_to_message_id = parseInt(replyToMessageId);
    if (inlineKeyboard && inlineKeyboard.length > 0) {
      payload.reply_markup = { inline_keyboard: inlineKeyboard };
    }

    const response = await this.client!.post('/sendMessage', payload);
    return response.data;
  }

  private async sendPhoto(context: NodeExecutionContext): Promise<any> {
    const {
      chatId,
      mediaUrl,
      caption,
      parseMode,
      disableNotification,
      replyToMessageId,
      inlineKeyboard,
    } = context.parameters;

    const payload: any = {
      chat_id: chatId,
      photo: mediaUrl,
    };

    if (caption) payload.caption = caption;
    if (parseMode) payload.parse_mode = parseMode;
    if (disableNotification) payload.disable_notification = true;
    if (replyToMessageId) payload.reply_to_message_id = parseInt(replyToMessageId);
    if (inlineKeyboard && inlineKeyboard.length > 0) {
      payload.reply_markup = { inline_keyboard: inlineKeyboard };
    }

    const response = await this.client!.post('/sendPhoto', payload);
    return response.data;
  }

  private async sendDocument(context: NodeExecutionContext): Promise<any> {
    const {
      chatId,
      mediaUrl,
      caption,
      parseMode,
      disableNotification,
      replyToMessageId,
      inlineKeyboard,
    } = context.parameters;

    const payload: any = {
      chat_id: chatId,
      document: mediaUrl,
    };

    if (caption) payload.caption = caption;
    if (parseMode) payload.parse_mode = parseMode;
    if (disableNotification) payload.disable_notification = true;
    if (replyToMessageId) payload.reply_to_message_id = parseInt(replyToMessageId);
    if (inlineKeyboard && inlineKeyboard.length > 0) {
      payload.reply_markup = { inline_keyboard: inlineKeyboard };
    }

    const response = await this.client!.post('/sendDocument', payload);
    return response.data;
  }

  private async sendVideo(context: NodeExecutionContext): Promise<any> {
    const {
      chatId,
      mediaUrl,
      caption,
      parseMode,
      disableNotification,
      replyToMessageId,
      inlineKeyboard,
    } = context.parameters;

    const payload: any = {
      chat_id: chatId,
      video: mediaUrl,
    };

    if (caption) payload.caption = caption;
    if (parseMode) payload.parse_mode = parseMode;
    if (disableNotification) payload.disable_notification = true;
    if (replyToMessageId) payload.reply_to_message_id = parseInt(replyToMessageId);
    if (inlineKeyboard && inlineKeyboard.length > 0) {
      payload.reply_markup = { inline_keyboard: inlineKeyboard };
    }

    const response = await this.client!.post('/sendVideo', payload);
    return response.data;
  }

  private async sendAudio(context: NodeExecutionContext): Promise<any> {
    const {
      chatId,
      mediaUrl,
      caption,
      parseMode,
      disableNotification,
      replyToMessageId,
      inlineKeyboard,
    } = context.parameters;

    const payload: any = {
      chat_id: chatId,
      audio: mediaUrl,
    };

    if (caption) payload.caption = caption;
    if (parseMode) payload.parse_mode = parseMode;
    if (disableNotification) payload.disable_notification = true;
    if (replyToMessageId) payload.reply_to_message_id = parseInt(replyToMessageId);
    if (inlineKeyboard && inlineKeyboard.length > 0) {
      payload.reply_markup = { inline_keyboard: inlineKeyboard };
    }

    const response = await this.client!.post('/sendAudio', payload);
    return response.data;
  }

  private async sendLocation(context: NodeExecutionContext): Promise<any> {
    const {
      chatId,
      latitude,
      longitude,
      disableNotification,
      replyToMessageId,
    } = context.parameters;

    const payload: any = {
      chat_id: chatId,
      latitude: latitude,
      longitude: longitude,
    };

    if (disableNotification) payload.disable_notification = true;
    if (replyToMessageId) payload.reply_to_message_id = parseInt(replyToMessageId);

    const response = await this.client!.post('/sendLocation', payload);
    return response.data;
  }

  private async sendPoll(context: NodeExecutionContext): Promise<any> {
    const {
      chatId,
      question,
      pollOptions,
      isAnonymous,
      allowsMultipleAnswers,
      disableNotification,
      replyToMessageId,
    } = context.parameters;

    const payload: any = {
      chat_id: chatId,
      question: question,
      options: pollOptions,
      is_anonymous: isAnonymous,
      allows_multiple_answers: allowsMultipleAnswers,
    };

    if (disableNotification) payload.disable_notification = true;
    if (replyToMessageId) payload.reply_to_message_id = parseInt(replyToMessageId);

    const response = await this.client!.post('/sendPoll', payload);
    return response.data;
  }

  private async editMessage(context: NodeExecutionContext): Promise<any> {
    const {
      chatId,
      messageId,
      text,
      parseMode,
      disableWebPagePreview,
      inlineKeyboard,
    } = context.parameters;

    const payload: any = {
      chat_id: chatId,
      message_id: parseInt(messageId),
      text: text,
    };

    if (parseMode) payload.parse_mode = parseMode;
    if (disableWebPagePreview) payload.disable_web_page_preview = true;
    if (inlineKeyboard && inlineKeyboard.length > 0) {
      payload.reply_markup = { inline_keyboard: inlineKeyboard };
    }

    const response = await this.client!.post('/editMessageText', payload);
    return response.data;
  }

  private async deleteMessage(context: NodeExecutionContext): Promise<any> {
    const { chatId, messageId } = context.parameters;

    const payload = {
      chat_id: chatId,
      message_id: parseInt(messageId),
    };

    const response = await this.client!.post('/deleteMessage', payload);
    return response.data;
  }

  private async forwardMessage(context: NodeExecutionContext): Promise<any> {
    const {
      chatId,
      fromChatId,
      messageToForward,
      disableNotification,
    } = context.parameters;

    const payload: any = {
      chat_id: chatId,
      from_chat_id: fromChatId,
      message_id: parseInt(messageToForward),
    };

    if (disableNotification) payload.disable_notification = true;

    const response = await this.client!.post('/forwardMessage', payload);
    return response.data;
  }

  private async getChatInfo(context: NodeExecutionContext): Promise<any> {
    const { chatId } = context.parameters;

    const response = await this.client!.post('/getChat', {
      chat_id: chatId,
    });

    return response.data;
  }

  private async getUpdates(context: NodeExecutionContext): Promise<any> {
    const { offset, limit } = context.parameters;

    const payload: any = {};
    if (offset) payload.offset = offset;
    if (limit) payload.limit = limit;

    const response = await this.client!.post('/getUpdates', payload);
    return response.data;
  }

  private async answerCallbackQuery(context: NodeExecutionContext): Promise<any> {
    const { callbackQueryId, callbackText, showAlert } = context.parameters;

    const payload: any = {
      callback_query_id: callbackQueryId,
    };

    if (callbackText) payload.text = callbackText;
    if (showAlert) payload.show_alert = true;

    const response = await this.client!.post('/answerCallbackQuery', payload);
    return response.data;
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