import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { TelegramNodeExecutor, TelegramConfig } from './telegram-node.executor';
import { WorkflowNode } from '../../../domain/entities/workflow-node.entity';

describe('TelegramNodeExecutor', () => {
  let executor: TelegramNodeExecutor;
  let httpService: HttpService;

  const mockHttpService = {
    post: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TelegramNodeExecutor,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
      ],
    }).compile();

    executor = module.get<TelegramNodeExecutor>(TelegramNodeExecutor);
    httpService = module.get<HttpService>(HttpService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validate', () => {
    it('should validate sendMessage configuration', async () => {
      const config: TelegramConfig = {
        operation: 'sendMessage',
        botToken: 'test-token',
        chatId: '123456',
        text: 'Hello World',
      };

      const result = await executor.validate(config);
      expect(result).toBe(true);
    });

    it('should reject invalid configuration without botToken', async () => {
      const config: TelegramConfig = {
        operation: 'sendMessage',
        chatId: '123456',
        text: 'Hello World',
      };

      const result = await executor.validate(config);
      expect(result).toBe(false);
    });

    it('should reject configuration without required text for sendMessage', async () => {
      const config: TelegramConfig = {
        operation: 'sendMessage',
        botToken: 'test-token',
        chatId: '123456',
      };

      const result = await executor.validate(config);
      expect(result).toBe(false);
    });
  });

  describe('execute', () => {
    const mockNode: WorkflowNode = {
      id: 'node-1',
      name: 'Test Telegram Node',
      type: 'telegram',
      configuration: {},
      position: { x: 0, y: 0 },
      workflowId: 'workflow-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as WorkflowNode;

    it('should send a message successfully', async () => {
      const config: TelegramConfig = {
        operation: 'sendMessage',
        botToken: 'test-bot-token',
        chatId: '123456',
        text: 'Hello {{name}}!',
        parseMode: 'Markdown',
      };

      const inputData = { name: 'World' };

      const mockResponse = {
        data: {
          ok: true,
          result: {
            message_id: 123,
            chat: { id: 123456 },
            text: 'Hello World!',
            date: 1234567890,
          },
        },
      };

      mockHttpService.post.mockReturnValue(of(mockResponse));

      const result = await executor.execute(
        { ...mockNode, configuration: config },
        inputData,
        'execution-1',
      );

      expect(mockHttpService.post).toHaveBeenCalledWith(
        'https://api.telegram.org/bot' + config.botToken + '/sendMessage',
        {
          chat_id: '123456',
          text: 'Hello World!',
          parse_mode: 'Markdown',
        },
      );

      expect(result.telegram).toEqual({
        messageId: 123,
        chatId: 123456,
        text: 'Hello World!',
        date: 1234567890,
        status: 'sent',
      });

      expect(result._telegram.operation).toBe('sendMessage');
    });

    it('should send a photo successfully', async () => {
      const config: TelegramConfig = {
        operation: 'sendPhoto',
        botToken: 'test-bot-token',
        chatId: '123456',
        photo: 'https://example.com/photo.jpg',
        caption: 'A nice photo',
      };

      const inputData = {};

      const mockResponse = {
        data: {
          ok: true,
          result: {
            message_id: 124,
            chat: { id: 123456 },
            photo: [{ file_id: 'photo_123' }],
            caption: 'A nice photo',
          },
        },
      };

      mockHttpService.post.mockReturnValue(of(mockResponse));

      const result = await executor.execute(
        { ...mockNode, configuration: config },
        inputData,
        'execution-1',
      );

      expect(mockHttpService.post).toHaveBeenCalledWith(
        'https://api.telegram.org/bot' + config.botToken + '/sendPhoto',
        {
          chat_id: '123456',
          photo: 'https://example.com/photo.jpg',
          caption: 'A nice photo',
        },
      );

      expect(result.telegram).toEqual({
        messageId: 124,
        chatId: 123456,
        photoId: 'photo_123',
        caption: 'A nice photo',
        status: 'sent',
      });
    });

    it('should handle API errors gracefully', async () => {
      const config: TelegramConfig = {
        operation: 'sendMessage',
        botToken: 'invalid-token',
        chatId: '123456',
        text: 'Hello World',
      };

      const inputData = {};

      const mockResponse = {
        data: {
          ok: false,
          description: 'Unauthorized',
        },
      };

      mockHttpService.post.mockReturnValue(of(mockResponse));

      const result = await executor.execute(
        { ...mockNode, configuration: config },
        inputData,
        'execution-1',
      );

      expect(result.telegram).toBeNull();
      expect(result.telegramError).toContain('Telegram API error: Unauthorized');
      expect(result._telegram.error).toContain('Telegram API error: Unauthorized');
    });

    it('should delete a message successfully', async () => {
      const config: TelegramConfig = {
        operation: 'deleteMessage',
        botToken: 'test-bot-token',
        chatId: '123456',
        messageId: '789',
      };

      const inputData = {};

      const mockResponse = {
        data: {
          ok: true,
        },
      };

      mockHttpService.post.mockReturnValue(of(mockResponse));

      const result = await executor.execute(
        { ...mockNode, configuration: config },
        inputData,
        'execution-1',
      );

      expect(mockHttpService.post).toHaveBeenCalledWith(
        'https://api.telegram.org/bot' + config.botToken + '/deleteMessage',
        {
          chat_id: '123456',
          message_id: '789',
        },
      );

      expect(result.telegram).toEqual({
        messageId: '789',
        chatId: '123456',
        status: 'deleted',
      });
    });

    it('should replace variables in configuration', async () => {
      const config: TelegramConfig = {
        operation: 'sendMessage',
        botToken: '{{telegram.botToken}}',
        chatId: '{{user.chatId}}',
        text: 'Hello {{user.name}}!',
      };

      const inputData = {
        telegram: { botToken: 'real-bot-token' },
        user: { chatId: '987654', name: 'Alice' },
      };

      const mockResponse = {
        data: {
          ok: true,
          result: {
            message_id: 125,
            chat: { id: 987654 },
            text: 'Hello Alice!',
            date: 1234567890,
          },
        },
      };

      mockHttpService.post.mockReturnValue(of(mockResponse));

      const result = await executor.execute(
        { ...mockNode, configuration: config },
        inputData,
        'execution-1',
      );

      expect(mockHttpService.post).toHaveBeenCalledWith(
        'https://api.telegram.org/botreal-bot-token/sendMessage',
        {
          chat_id: '987654',
          text: 'Hello Alice!',
        },
      );

      expect(result.telegram.text).toBe('Hello Alice!');
    });
  });
});
