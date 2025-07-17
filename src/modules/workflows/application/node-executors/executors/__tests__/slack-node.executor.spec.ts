import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { AxiosResponse } from 'axios';
import { SlackNodeExecutor } from '../slack-node.executor';
import { CredentialIntegrationService } from '../../../../../credentials/application/services/credential-integration.service';
import {
  WorkflowNode,
  NodeType,
} from '../../../../domain/entities/workflow-node.entity';

describe('SlackNodeExecutor', () => {
  let executor: SlackNodeExecutor;
  let httpService: jest.Mocked<HttpService>;
  let credentialService: jest.Mocked<CredentialIntegrationService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SlackNodeExecutor,
        {
          provide: HttpService,
          useValue: {
            post: jest.fn(),
            get: jest.fn(),
          },
        },
        {
          provide: CredentialIntegrationService,
          useValue: {
            getCredentialById: jest.fn(),
            getCredentialByService: jest.fn(),
          },
        },
      ],
    }).compile();

    executor = module.get<SlackNodeExecutor>(SlackNodeExecutor);
    httpService = module.get(HttpService);
    credentialService = module.get(CredentialIntegrationService);
  });

  describe('sendMessage with credential ID', () => {
    it('should send message using credential from credential service', async () => {
      const node: Partial<WorkflowNode> = {
        id: 'node-1',
        name: 'Send Slack Message',
        type: NodeType.ACTION,
        configuration: {
          operation: 'sendMessage',
          credentialId: 'slack-cred-1',
          channel: '#general',
          text: 'Hello World',
        },
      };

      const inputData = {
        _credentialContext: {
          userId: 'user-123',
          workflowId: 'workflow-123',
          executionId: 'exec-123',
          nodeId: 'node-1',
        },
      };

      const mockCredential = {
        id: 'slack-cred-1',
        data: {
          service: 'slack',
          type: 'bot_token',
          token: 'xoxb-slack-bot-token',
        },
      };

      const mockSlackResponse: AxiosResponse = {
        data: {
          ok: true,
          ts: '1234567890.123456',
          channel: 'C1234567890',
          message: {
            permalink:
              'https://workspace.slack.com/archives/C1234567890/p1234567890123456',
          },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {
          headers: {},
        } as any,
      } as AxiosResponse;

      credentialService.getCredentialById.mockResolvedValue(mockCredential);
      httpService.post.mockReturnValue(of(mockSlackResponse));

      const result = await executor.execute(
        node as WorkflowNode,
        inputData,
        'exec-123',
      );

      expect(credentialService.getCredentialById).toHaveBeenCalledWith(
        'slack-cred-1',
        inputData._credentialContext,
      );

      expect(httpService.post).toHaveBeenCalledWith(
        'https://slack.com/api/chat.postMessage',
        {
          channel: '#general',
          text: 'Hello World',
        },
        {
          headers: {
            Authorization: 'Bearer xoxb-slack-bot-token',
            'Content-Type': 'application/json',
          },
        },
      );

      expect(result.slack).toEqual({
        messageTs: '1234567890.123456',
        channel: 'C1234567890',
        text: 'Hello World',
        permalink:
          'https://workspace.slack.com/archives/C1234567890/p1234567890123456',
        status: 'sent',
      });
    });

    it('should fall back to service-based credential lookup', async () => {
      const node: Partial<WorkflowNode> = {
        id: 'node-1',
        name: 'Send Slack Message',
        type: NodeType.ACTION,
        configuration: {
          operation: 'sendMessage',
          channel: '#general',
          text: 'Hello World',
        },
      };

      const inputData = {
        _credentialContext: {
          userId: 'user-123',
          workflowId: 'workflow-123',
          executionId: 'exec-123',
          nodeId: 'node-1',
        },
      };

      const mockCredential = {
        id: 'slack-cred-auto',
        data: {
          service: 'slack',
          type: 'bot_token',
          bot_token: 'xoxb-slack-auto-token',
        },
      };

      const mockSlackResponse: AxiosResponse = {
        data: {
          ok: true,
          ts: '1234567890.123456',
          channel: 'C1234567890',
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {
          headers: {},
        } as any,
      } as AxiosResponse;

      credentialService.getCredentialByService.mockResolvedValue(
        mockCredential,
      );
      httpService.post.mockReturnValue(of(mockSlackResponse));

      const result = await executor.execute(
        node as WorkflowNode,
        inputData,
        'exec-123',
      );

      expect(credentialService.getCredentialByService).toHaveBeenCalledWith(
        'slack',
        inputData._credentialContext,
      );

      expect(httpService.post).toHaveBeenCalledWith(
        'https://slack.com/api/chat.postMessage',
        {
          channel: '#general',
          text: 'Hello World',
        },
        {
          headers: {
            Authorization: 'Bearer xoxb-slack-auto-token',
            'Content-Type': 'application/json',
          },
        },
      );
    });

    it('should handle credential service errors gracefully', async () => {
      const node: Partial<WorkflowNode> = {
        id: 'node-1',
        name: 'Send Slack Message',
        type: NodeType.ACTION,
        configuration: {
          operation: 'sendMessage',
          credentialId: 'invalid-cred',
          channel: '#general',
          text: 'Hello World',
        },
      };

      const inputData = {
        _credentialContext: {
          userId: 'user-123',
        },
      };

      credentialService.getCredentialById.mockRejectedValue(
        new Error('Credential not found'),
      );

      const result = await executor.execute(
        node as WorkflowNode,
        inputData,
        'exec-123',
      );

      expect(result.slack).toBeNull();
      expect(result.slackError).toContain(
        'Failed to retrieve Slack credentials',
      );
      expect(result._slack.error).toBeDefined();
    });
  });

  describe('validation', () => {
    it('should validate sendMessage configuration with credential ID', async () => {
      const config = {
        operation: 'sendMessage',
        credentialId: 'slack-cred-1',
        channel: '#general',
        text: 'Hello',
      };

      const isValid = await executor.validate(config);
      expect(isValid).toBe(true);
    });

    it('should fail validation without credentials', async () => {
      const config = {
        operation: 'sendMessage',
        channel: '#general',
        text: 'Hello',
      };

      const isValid = await executor.validate(config);
      expect(isValid).toBe(false);
    });

    it('should fail validation without required fields', async () => {
      const config = {
        operation: 'sendMessage',
        credentialId: 'slack-cred-1',
        channel: '#general',
        // missing text
      };

      const isValid = await executor.validate(config);
      expect(isValid).toBe(false);
    });
  });
});
