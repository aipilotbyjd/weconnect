import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkflowsService } from './workflows.service';
import { Workflow } from '../../domain/entities/workflow.entity';
import { WorkflowNode, NodeType } from '../../domain/entities/workflow-node.entity';
import { WorkflowNodeConnection, ConnectionType } from '../../domain/entities/workflow-node-connection.entity';
import { CreateWorkflowDto } from '../../presentation/dto/create-workflow.dto';

describe('WorkflowsService - Connections', () => {
  let service: WorkflowsService;
  let workflowRepository: Repository<Workflow>;
  let nodeRepository: Repository<WorkflowNode>;
  let connectionRepository: Repository<WorkflowNodeConnection>;

  const mockWorkflowRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    manager: {
      transaction: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockNodeRepository = {
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const mockConnectionRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkflowsService,
        {
          provide: getRepositoryToken(Workflow),
          useValue: mockWorkflowRepository,
        },
        {
          provide: getRepositoryToken(WorkflowNode),
          useValue: mockNodeRepository,
        },
        {
          provide: getRepositoryToken(WorkflowNodeConnection),
          useValue: mockConnectionRepository,
        },
      ],
    }).compile();

    service = module.get<WorkflowsService>(WorkflowsService);
    workflowRepository = module.get<Repository<Workflow>>(getRepositoryToken(Workflow));
    nodeRepository = module.get<Repository<WorkflowNode>>(getRepositoryToken(WorkflowNode));
    connectionRepository = module.get<Repository<WorkflowNodeConnection>>(getRepositoryToken(WorkflowNodeConnection));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create workflow with connections', () => {
    it('should create workflow with nodes and connections', async () => {
      const createWorkflowDto: CreateWorkflowDto = {
        name: 'Test Workflow',
        description: 'A test workflow with connections',
        nodes: [
          {
            name: 'Trigger',
            type: NodeType.TRIGGER,
            position: { x: 100, y: 100 },
            configuration: {},
          },
          {
            name: 'Action',
            type: NodeType.ACTION,
            position: { x: 300, y: 100 },
            configuration: {},
          },
        ],
        connections: [
          {
            sourceNodeId: '0', // index-based ID
            targetNodeId: '1',
            type: ConnectionType.MAIN,
          },
        ],
      };

      const mockWorkflow = {
        id: 'workflow-1',
        name: 'Test Workflow',
        userId: 'user-1',
        organizationId: 'org-1',
      };

      const mockNodes = [
        {
          id: 'node-1',
          name: 'Trigger',
          type: NodeType.TRIGGER,
          workflowId: 'workflow-1',
        },
        {
          id: 'node-2',
          name: 'Action',
          type: NodeType.ACTION,
          workflowId: 'workflow-1',
        },
      ];

      const mockConnection = {
        id: 'connection-1',
        sourceNodeId: 'node-1',
        targetNodeId: 'node-2',
        type: ConnectionType.MAIN,
      };

      // Mock the transaction
      mockWorkflowRepository.manager.transaction.mockImplementation(async (callback) => {
        const manager = {
          save: jest.fn()
            .mockResolvedValueOnce(mockWorkflow) // Save workflow
            .mockResolvedValueOnce(mockNodes) // Save nodes
            .mockResolvedValueOnce([mockConnection]), // Save connections
        };
        return callback(manager);
      });

      // Mock repository methods
      mockWorkflowRepository.create.mockReturnValue(mockWorkflow);
      mockNodeRepository.create
        .mockReturnValueOnce(mockNodes[0])
        .mockReturnValueOnce(mockNodes[1]);
      mockConnectionRepository.create.mockReturnValue(mockConnection);

      // Mock findOne to return complete workflow
      mockWorkflowRepository.findOne.mockResolvedValue({
        ...mockWorkflow,
        nodes: mockNodes,
        connections: [mockConnection],
      });

      const result = await service.create(createWorkflowDto, 'user-1', 'org-1');

      // Verify workflow creation
      expect(mockWorkflowRepository.create).toHaveBeenCalledWith({
        name: 'Test Workflow',
        description: 'A test workflow with connections',
        userId: 'user-1',
        organizationId: 'org-1',
      });

      // Verify transaction was used
      expect(mockWorkflowRepository.manager.transaction).toHaveBeenCalled();

      // Verify nodes were created
      expect(mockNodeRepository.create).toHaveBeenCalledTimes(2);

      // Verify connection was created
      expect(mockConnectionRepository.create).toHaveBeenCalledWith({
        sourceNodeId: 'node-1', // Should be mapped from index '0'
        targetNodeId: 'node-2', // Should be mapped from index '1'
        type: ConnectionType.MAIN,
        sourceOutputIndex: 0,
        targetInputIndex: 0,
      });
    });

    it('should handle empty connections array', async () => {
      const createWorkflowDto: CreateWorkflowDto = {
        name: 'Test Workflow',
        nodes: [
          {
            name: 'Trigger',
            type: NodeType.TRIGGER,
            position: { x: 100, y: 100 },
          },
        ],
        connections: [], // Empty connections
      };

      const mockWorkflow = {
        id: 'workflow-1',
        name: 'Test Workflow',
        userId: 'user-1',
      };

      mockWorkflowRepository.manager.transaction.mockImplementation(async (callback) => {
        const manager = {
          save: jest.fn().mockResolvedValue(mockWorkflow),
        };
        return callback(manager);
      });

      mockWorkflowRepository.create.mockReturnValue(mockWorkflow);
      mockWorkflowRepository.findOne.mockResolvedValue(mockWorkflow);

      await service.create(createWorkflowDto, 'user-1');

      // Should not create any connections
      expect(mockConnectionRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('findOne with connections', () => {
    it('should load workflow with all related data', async () => {
      const workflowId = 'workflow-1';

      mockWorkflowRepository.findOne.mockResolvedValue({
        id: workflowId,
        nodes: [],
      });

      await service.findOne(workflowId);

      expect(mockWorkflowRepository.findOne).toHaveBeenCalledWith({
        where: { id: workflowId },
        relations: [
          'nodes',
          'nodes.outgoingConnections',
          'nodes.incomingConnections',
          'nodes.outgoingConnections.targetNode',
          'nodes.incomingConnections.sourceNode',
          'user',
        ],
      });
    });
  });
});
