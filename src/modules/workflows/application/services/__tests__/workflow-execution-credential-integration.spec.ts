import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { WorkflowExecutionService } from '../workflow-execution.service';
import { WorkflowCredentialContextService } from '../../../../credentials/application/services/workflow-credential-context.service';
import { NodeExecutorFactory } from '../../node-executors/node-executor.factory';
import { WorkflowExecution } from '../../../domain/entities/workflow-execution.entity';
import { WorkflowExecutionLog } from '../../../domain/entities/workflow-execution-log.entity';
import {
  WorkflowNode,
  NodeType,
} from '../../../domain/entities/workflow-node.entity';
import { NodeExecutor } from '../../node-executors/node-executor.interface';

describe('WorkflowExecutionService - Credential Integration', () => {
  let service: WorkflowExecutionService;
  let credentialContextService: jest.Mocked<WorkflowCredentialContextService>;
  let nodeExecutorFactory: jest.Mocked<NodeExecutorFactory>;
  let executionRepository: jest.Mocked<Repository<WorkflowExecution>>;
  let logRepository: jest.Mocked<Repository<WorkflowExecutionLog>>;
  let mockNodeExecutor: jest.Mocked<NodeExecutor>;

  beforeEach(async () => {
    mockNodeExecutor = {
      execute: jest.fn(),
      validate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkflowExecutionService,
        {
          provide: WorkflowCredentialContextService,
          useValue: {
            createContext: jest.fn(),
            injectContext: jest.fn(),
            extractContext: jest.fn(),
          },
        },
        {
          provide: NodeExecutorFactory,
          useValue: {
            getExecutor: jest.fn().mockReturnValue(mockNodeExecutor),
          },
        },
        {
          provide: getRepositoryToken(WorkflowExecution),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(WorkflowExecutionLog),
          useValue: {
            save: jest.fn(),
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<WorkflowExecutionService>(WorkflowExecutionService);
    credentialContextService = module.get(WorkflowCredentialContextService);
    nodeExecutorFactory = module.get(NodeExecutorFactory);
    executionRepository = module.get(getRepositoryToken(WorkflowExecution));
    logRepository = module.get(getRepositoryToken(WorkflowExecutionLog));
  });

  describe('executeNode with credential context', () => {
    it('should inject credential context into node execution', async () => {
      const node: Partial<WorkflowNode> = {
        id: 'node-1',
        name: 'Slack Node',
        type: NodeType.ACTION,
        configuration: {
          operation: 'sendMessage',
          credentialId: 'slack-cred-1',
          channel: '#general',
          text: 'Hello World',
        },
      };

      const execution = {
        id: 'exec-123',
        workflowId: 'workflow-123',
        metadata: {
          userId: 'user-123',
        },
        workflow: {
          organizationId: 'org-123',
        },
      };

      const inputData = {
        message: 'Test input',
      };

      const credentialContext = {
        userId: 'user-123',
        workflowId: 'workflow-123',
        executionId: 'exec-123',
        nodeId: 'node-1',
        organizationId: 'org-123',
        timestamp: new Date().toISOString(),
      };

      const contextualInputData = {
        message: 'Test input',
        _credentialContext: credentialContext,
      };

      const nodeResult = {
        message: 'Test input',
        slack: {
          messageId: 'msg-123',
          status: 'sent',
        },
      };

      executionRepository.findOne.mockResolvedValue(execution as any);
      credentialContextService.createContext.mockReturnValue(credentialContext);
      credentialContextService.injectContext.mockReturnValue(
        contextualInputData,
      );
      mockNodeExecutor.execute.mockResolvedValue(nodeResult);
      logRepository.save.mockResolvedValue({} as any);

      const result = await service.executeNode(
        node as WorkflowNode,
        'exec-123',
        inputData,
      );

      expect(executionRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'exec-123' },
        relations: ['workflow'],
      });

      expect(credentialContextService.createContext).toHaveBeenCalledWith(
        'user-123',
        'workflow-123',
        'exec-123',
        'node-1',
        'org-123',
      );

      expect(credentialContextService.injectContext).toHaveBeenCalledWith(
        inputData,
        credentialContext,
      );

      expect(mockNodeExecutor.execute).toHaveBeenCalledWith(
        node,
        contextualInputData,
        'exec-123',
      );

      expect(result).toEqual(nodeResult);
    });

    it('should handle missing user context gracefully', async () => {
      const node: Partial<WorkflowNode> = {
        id: 'node-1',
        name: 'Simple Node',
        type: NodeType.ACTION,
        configuration: {
          operation: 'transform',
        },
      };

      const execution = {
        id: 'exec-123',
        workflowId: 'workflow-123',
        metadata: {}, // No userId
        workflow: {
          organizationId: 'org-123',
        },
      };

      const inputData = {
        data: 'test',
      };

      const credentialContext = {
        userId: 'unknown',
        workflowId: 'workflow-123',
        executionId: 'exec-123',
        nodeId: 'node-1',
        organizationId: 'org-123',
        timestamp: new Date().toISOString(),
      };

      const contextualInputData = {
        data: 'test',
        _credentialContext: credentialContext,
      };

      executionRepository.findOne.mockResolvedValue(execution as any);
      credentialContextService.createContext.mockReturnValue(credentialContext);
      credentialContextService.injectContext.mockReturnValue(
        contextualInputData,
      );
      mockNodeExecutor.execute.mockResolvedValue({ data: 'processed' });
      logRepository.save.mockResolvedValue({} as any);

      const result = await service.executeNode(
        node as WorkflowNode,
        'exec-123',
        inputData,
      );

      expect(credentialContextService.createContext).toHaveBeenCalledWith(
        'unknown',
        'workflow-123',
        'exec-123',
        'node-1',
        'org-123',
      );

      expect(result).toEqual({ data: 'processed' });
    });

    it('should handle execution not found error', async () => {
      const node: Partial<WorkflowNode> = {
        id: 'node-1',
        name: 'Test Node',
        type: NodeType.ACTION,
        configuration: {},
      };

      executionRepository.findOne.mockResolvedValue(null);

      await expect(
        service.executeNode(node as WorkflowNode, 'invalid-exec', {}),
      ).rejects.toThrow('Execution invalid-exec not found');
    });

    it('should log node execution without exposing credential context', async () => {
      const node: Partial<WorkflowNode> = {
        id: 'node-1',
        name: 'Secure Node',
        type: NodeType.ACTION,
        configuration: {
          credentialId: 'secret-cred',
        },
      };

      const execution = {
        id: 'exec-123',
        workflowId: 'workflow-123',
        metadata: { userId: 'user-123' },
        workflow: { organizationId: 'org-123' },
      };

      const inputData = { data: 'test' };
      const contextualInputData = {
        data: 'test',
        _credentialContext: { userId: 'user-123' },
      };

      executionRepository.findOne.mockResolvedValue(execution as any);
      credentialContextService.createContext.mockReturnValue({
        userId: 'user-123',
      } as any);
      credentialContextService.injectContext.mockReturnValue(
        contextualInputData,
      );
      mockNodeExecutor.execute.mockResolvedValue({ result: 'success' });
      logRepository.save.mockResolvedValue({} as any);

      await service.executeNode(node as WorkflowNode, 'exec-123', inputData);

      expect(logRepository.save).toHaveBeenCalledWith({
        executionId: 'exec-123',
        nodeId: 'node-1',
        level: 'INFO',
        message: 'Starting node execution: Secure Node',
        nodeInput: inputData, // Original input without context
      });
    });
  });
});
