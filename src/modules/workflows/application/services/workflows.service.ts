import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workflow } from '../../domain/entities/workflow.entity';
import { WorkflowNode } from '../../domain/entities/workflow-node.entity';
import {
  WorkflowNodeConnection,
  ConnectionType,
} from '../../domain/entities/workflow-node-connection.entity';
import { CreateWorkflowDto } from '../../presentation/dto/create-workflow.dto';
import { UpdateWorkflowDto } from '../../presentation/dto/update-workflow.dto';
import { CreateWorkflowUseCase } from '../use-cases/create-workflow.use-case';
import { GetWorkflowsUseCase } from '../use-cases/get-workflows.use-case';
import { ConnectionValidator } from '../utils/connection-validator';

@Injectable()
export class WorkflowsService {
  constructor(
    @InjectRepository(Workflow)
    private readonly workflowRepository: Repository<Workflow>,
    @InjectRepository(WorkflowNode)
    private readonly workflowNodeRepository: Repository<WorkflowNode>,
    @InjectRepository(WorkflowNodeConnection)
    private readonly connectionRepository: Repository<WorkflowNodeConnection>,
  ) {}

  async create(
    createWorkflowDto: CreateWorkflowDto,
    userId: string,
    organizationId?: string,
  ): Promise<Workflow> {
    const { nodes, connections, ...workflowData } = createWorkflowDto;

    // Debugging - Log the organizationId
    console.log('Organization ID provided:', organizationId);
    if (!organizationId) {
      throw new Error(
        'Please provide a valid organization ID. It seems to be default or missing.',
      );
    }

    return await this.workflowRepository.manager.transaction(
      async (manager) => {
        // Get transactional repositories
        const transactionalWorkflowRepo = manager.getRepository(Workflow);
        const transactionalNodeRepo = manager.getRepository(WorkflowNode);
        const transactionalConnectionRepo = manager.getRepository(
          WorkflowNodeConnection,
        );

        // Create workflow
        const workflow = transactionalWorkflowRepo.create({
          ...workflowData,
          userId,
          organizationId,
        });

        const savedWorkflow = await transactionalWorkflowRepo.save(workflow);

        // Create nodes if provided
        const nodeIdMap = new Map<string, string>(); // temp ID -> real ID

        if (nodes && nodes.length > 0) {
          for (let i = 0; i < nodes.length; i++) {
            const nodeData = nodes[i];
            const node = transactionalNodeRepo.create({
              ...nodeData,
              workflowId: savedWorkflow.id,
            });
            // Save node to get real ID
            const savedNode = await transactionalNodeRepo.save(node);
            // Map both index and any existing ID to the real ID
            nodeIdMap.set(i.toString(), savedNode.id);
            // If the node has an ID field, also map that
            if ((nodeData as any).id) {
              nodeIdMap.set((nodeData as any).id, savedNode.id);
            }
          }
        }

        // Create connections if provided
        if (connections && connections.length > 0) {
          const workflowConnections: WorkflowNodeConnection[] = [];

          // Debug: Log available node mappings
          console.log(
            'Available node mappings:',
            Object.fromEntries(nodeIdMap),
          );
          console.log('Connection data:', connections);

          for (const connData of connections) {
            const sourceNodeId = nodeIdMap.get(connData.sourceNodeId);
            const targetNodeId = nodeIdMap.get(connData.targetNodeId);

            if (!sourceNodeId || !targetNodeId) {
              throw new Error(
                `Connection references non-existent node ID: source('${connData.sourceNodeId}') or target('${connData.targetNodeId}'). Available mappings: ${JSON.stringify(Object.fromEntries(nodeIdMap))}`,
              );
            }

            const connection = transactionalConnectionRepo.create({
              sourceNodeId,
              targetNodeId,
              type: connData.type || ConnectionType.MAIN,
              sourceOutputIndex: connData.sourceOutputIndex || 0,
              targetInputIndex: connData.targetInputIndex || 0,
            });

            workflowConnections.push(connection);
          }

          await transactionalConnectionRepo.save(workflowConnections);
        }

        // Use transactional manager to fetch the created workflow with relations
        const createdWorkflow = await manager.findOne(Workflow, {
          where: { id: savedWorkflow.id },
          relations: [
            'nodes',
            'nodes.outgoingConnections',
            'nodes.incomingConnections',
            'nodes.outgoingConnections.targetNode',
            'nodes.incomingConnections.sourceNode',
            'user',
          ],
        });

        if (!createdWorkflow) {
          throw new NotFoundException('Created workflow not found');
        }

        return createdWorkflow;
      },
    );
  }

  async findAll(userId: string): Promise<Workflow[]> {
    return this.workflowRepository.find({
      where: { userId },
      relations: ['nodes'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Workflow> {
    const workflow = await this.workflowRepository.findOne({
      where: { id },
      relations: [
        'nodes',
        'nodes.outgoingConnections',
        'nodes.incomingConnections',
        'nodes.outgoingConnections.targetNode',
        'nodes.incomingConnections.sourceNode',
        'user',
      ],
    });

    if (!workflow) {
      throw new NotFoundException('Workflow not found');
    }

    return workflow;
  }

  async findOneWithAuth(id: string, userId: string): Promise<Workflow> {
    const workflow = await this.workflowRepository.findOne({
      where: { id, userId },
      relations: [
        'nodes',
        'nodes.outgoingConnections',
        'nodes.incomingConnections',
        'nodes.outgoingConnections.targetNode',
        'nodes.incomingConnections.sourceNode',
        'user',
      ],
    });

    if (!workflow) {
      throw new NotFoundException('Workflow not found or access denied');
    }

    return workflow;
  }

  async update(
    id: string,
    updateWorkflowDto: UpdateWorkflowDto,
    userId: string,
  ): Promise<Workflow> {
    const workflow = await this.findOne(id);

    if (workflow.userId !== userId) {
      throw new ForbiddenException('You can only update your own workflows');
    }

    const { nodes, connections, ...workflowData } = updateWorkflowDto;

    return await this.workflowRepository.manager.transaction(
      async (manager) => {
        // Update workflow data
        await manager.update(Workflow, id, workflowData);

        if (nodes) {
          // Remove existing nodes and their connections
          await manager.delete(WorkflowNodeConnection, {
            sourceNode: { workflowId: id },
          });
          await manager.delete(WorkflowNode, { workflowId: id });

          // Create nodes with ID mapping
          const nodeIdMap = new Map<string, string>();

          if (nodes.length > 0) {
            const workflowNodes = nodes.map((nodeData, index) => {
              const node = this.workflowNodeRepository.create({
                ...nodeData,
                workflowId: id,
              });

              // Map temporary ID to actual ID for connections
              nodeIdMap.set(index.toString(), node.id);
              return node;
            });

            await manager.save(workflowNodes);
          }

          // Create connections if provided
          if (connections && connections.length > 0) {
            const workflowConnections = connections.map((connData) => {
              const sourceNodeId =
                nodeIdMap.get(connData.sourceNodeId) || connData.sourceNodeId;
              const targetNodeId =
                nodeIdMap.get(connData.targetNodeId) || connData.targetNodeId;

              return this.connectionRepository.create({
                sourceNodeId,
                targetNodeId,
                type: connData.type,
                sourceOutputIndex: connData.sourceOutputIndex || 0,
                targetInputIndex: connData.targetInputIndex || 0,
              });
            });

            await manager.save(workflowConnections);
          }
        }

        return this.findOne(id);
      },
    );
  }

  async remove(id: string, userId: string): Promise<void> {
    const workflow = await this.findOne(id);

    if (workflow.userId !== userId) {
      throw new ForbiddenException('You can only delete your own workflows');
    }

    await this.workflowRepository.remove(workflow);
  }

  async activate(id: string, userId: string): Promise<Workflow> {
    const workflow = await this.findOne(id);

    if (workflow.userId !== userId) {
      throw new ForbiddenException('You can only activate your own workflows');
    }

    workflow.isActive = true;
    await this.workflowRepository.save(workflow);

    return workflow;
  }

  async deactivate(id: string, userId: string): Promise<Workflow> {
    const workflow = await this.findOne(id);

    if (workflow.userId !== userId) {
      throw new ForbiddenException(
        'You can only deactivate your own workflows',
      );
    }

    workflow.isActive = false;
    await this.workflowRepository.save(workflow);

    return workflow;
  }

  async validateConnections(workflowId: string, userId: string): Promise<any> {
    const workflow = await this.findOneWithAuth(workflowId, userId);

    // Extract connections from nodes
    const connections: WorkflowNodeConnection[] = [];
    workflow.nodes.forEach((node) => {
      if (node.outgoingConnections) {
        connections.push(...node.outgoingConnections);
      }
    });

    const validationResult = ConnectionValidator.validateConnections(
      workflow.nodes,
      connections,
    );

    const executionOrder = validationResult.isValid
      ? ConnectionValidator.getExecutionOrder(workflow.nodes, connections)
      : [];

    return {
      ...validationResult,
      executionOrder,
      nodeCount: workflow.nodes.length,
      connectionCount: connections.length,
    };
  }
}
