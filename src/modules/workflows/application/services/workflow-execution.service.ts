import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Workflow } from '../../domain/entities/workflow.entity';
import { WorkflowNode, NodeType } from '../../domain/entities/workflow-node.entity';
import { WorkflowExecution, ExecutionStatus, ExecutionMode } from '../../domain/entities/workflow-execution.entity';
import { WorkflowExecutionLog, LogLevel } from '../../domain/entities/workflow-execution-log.entity';
import { WorkflowNodeConnection, ConnectionType } from '../../domain/entities/workflow-node-connection.entity';
import { WORKFLOW_EXECUTION_QUEUE, WORKFLOW_NODE_QUEUE, WorkflowJobType, NodeJobType } from '../../infrastructure/queues/constants';
import { NodeExecutorFactory } from '../node-executors/node-executor.factory';
import { WorkflowCredentialContextService } from './workflow-credential-context.service';

@Injectable()
export class WorkflowExecutionService {
  private readonly logger = new Logger(WorkflowExecutionService.name);
  private readonly executingNodes = new Map<string, Set<string>>(); // executionId -> nodeIds
  private readonly executionTimeouts = new Map<string, NodeJS.Timeout>(); // executionId -> timeout

  constructor(
    @InjectRepository(WorkflowExecution)
    private executionRepository: Repository<WorkflowExecution>,
    @InjectRepository(WorkflowExecutionLog)
    private logRepository: Repository<WorkflowExecutionLog>,
    @InjectRepository(WorkflowNode)
    private nodeRepository: Repository<WorkflowNode>,
    @InjectRepository(WorkflowNodeConnection)
    private connectionRepository: Repository<WorkflowNodeConnection>,
    @InjectQueue(WORKFLOW_EXECUTION_QUEUE)
    private workflowQueue: Queue,
    @InjectQueue(WORKFLOW_NODE_QUEUE)
    private nodeQueue: Queue,
    private nodeExecutorFactory: NodeExecutorFactory,
    private credentialContextService: WorkflowCredentialContextService,
  ) {}

  async startExecution(
    workflowId: string,
    userId: string,
    mode: ExecutionMode = ExecutionMode.MANUAL,
    inputData?: Record<string, any>,
    timeout = 300000, // 5 minutes default
  ): Promise<WorkflowExecution> {
    return await this.executionRepository.manager.transaction(async manager => {
      // Create execution record
      const execution = await manager.save(WorkflowExecution, {
        workflowId,
        status: ExecutionStatus.PENDING,
        mode,
        data: inputData || {},
        metadata: {
          userId,
          startedBy: mode,
          timeout,
        },
      });

      try {
        // Add to queue
        await this.workflowQueue.add(
          WorkflowJobType.EXECUTE_WORKFLOW,
          {
            executionId: execution.id,
            workflowId,
            userId,
            inputData,
            timeout,
          },
          {
            priority: mode === ExecutionMode.MANUAL ? 1 : 0,
          },
        );

        this.logger.log(`Created workflow execution ${execution.id} for workflow ${workflowId}`);
        return execution;
      } catch (queueError) {
        // If queue fails, mark execution as failed
        await manager.update(WorkflowExecution, execution.id, {
          status: ExecutionStatus.FAILED,
          error: { 
            message: 'Failed to queue execution', 
            details: queueError.message 
          } as any,
        });
        throw queueError;
      }
    });
  }

  async executeWorkflow(
    workflow: Workflow,
    executionId: string,
    inputData?: Record<string, any>,
    timeout = 300000, // 5 minutes default
  ): Promise<Record<string, any>> {
    this.logger.log(`Executing workflow ${workflow.id} with execution ${executionId}`);

    // Set up timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Workflow execution timeout'));
      }, timeout);
      this.executionTimeouts.set(executionId, timeoutId);
    });

    const executionPromise = this.executeWorkflowInternal(workflow, executionId, inputData);

    try {
      return await Promise.race([executionPromise, timeoutPromise]);
    } catch (error) {
      // Cancel execution on timeout
      if (error.message === 'Workflow execution timeout') {
        await this.cancelExecution(executionId);
      }
      throw error;
    } finally {
      // Clear timeout
      const timeoutId = this.executionTimeouts.get(executionId);
      if (timeoutId) {
        clearTimeout(timeoutId);
        this.executionTimeouts.delete(executionId);
      }
    }
  }

  private async executeWorkflowInternal(
    workflow: Workflow,
    executionId: string,
    inputData?: Record<string, any>,
  ): Promise<Record<string, any>> {
    // Initialize execution tracking
    this.executingNodes.set(executionId, new Set());

    // Find trigger nodes
    const triggerNodes = workflow.nodes.filter(node => node.type === NodeType.TRIGGER);
    
    if (triggerNodes.length === 0) {
      throw new Error('No trigger node found in workflow');
    }

    // Execute from trigger nodes
    const results = {};
    for (const triggerNode of triggerNodes) {
      const result = await this.executeNodeAndContinue(
        triggerNode, 
        executionId, 
        inputData,
        new Set<string>()
      );
      results[triggerNode.id] = result;
    }

    return results;
  }

  async executeNode(
    node: WorkflowNode,
    executionId: string,
    inputData?: Record<string, any>,
  ): Promise<Record<string, any>> {
    const startTime = Date.now();
    
    try {
      // Get node executor
      const executor = this.nodeExecutorFactory.getExecutor(node.type);
      
      // Get execution to extract user context
      const execution = await this.executionRepository.findOne({
        where: { id: executionId },
        relations: ['workflow'],
      });
      
      if (!execution) {
        throw new Error(`Execution ${executionId} not found`);
      }
      
      // Inject credential context into input data
      const context = this.credentialContextService.createContext(
        execution.metadata?.userId || 'unknown',
        execution.workflowId,
        executionId,
        node.id,
        execution.workflow?.organizationId
      );
      
      const contextualInputData = this.credentialContextService.injectContext(
        inputData || {},
        context
      );
      
      // Log node start
      await this.logRepository.save({
        executionId,
        nodeId: node.id,
        level: LogLevel.INFO,
        message: `Starting node execution: ${node.name}`,
        nodeInput: inputData, // Don't log context for security
      });

      // Execute node with contextual data
      const result = await executor.execute(node, contextualInputData, executionId);

      // Log node completion
      await this.logRepository.save({
        executionId,
        nodeId: node.id,
        level: LogLevel.INFO,
        message: `Node execution completed: ${node.name}`,
        nodeOutput: result,
        executionTime: Date.now() - startTime,
      });

      return result;
    } catch (error) {
      // Log node error
      await this.logRepository.save({
        executionId,
        nodeId: node.id,
        level: LogLevel.ERROR,
        message: `Node execution failed: ${node.name}`,
        data: {
          error: error.message,
          stack: error.stack,
        },
        executionTime: Date.now() - startTime,
      });

      throw error;
    }
  }

  private async executeNodeAndContinue(
    node: WorkflowNode,
    executionId: string,
    inputData?: Record<string, any>,
    visitedNodes = new Set<string>(),
  ): Promise<Record<string, any>> {
    // Cycle detection
    if (visitedNodes.has(node.id)) {
      throw new Error(`Cycle detected at node: ${node.id}`);
    }
    visitedNodes.add(node.id);

    // Execution tracking
    if (!this.executingNodes.has(executionId)) {
      this.executingNodes.set(executionId, new Set());
    }
    const nodeSet = this.executingNodes.get(executionId)!;

    // Execute current node
    const result = await this.executeNode(node, executionId, inputData);

    // Find outgoing connections
    const connections = await this.connectionRepository.find({
      where: { sourceNodeId: node.id },
      relations: ['targetNode'],
    });

    // Execute connected nodes with duplicate prevention
    const nodePromises: Promise<any>[] = [];
    for (const connection of connections) {
      if (connection.targetNode?.isEnabled && 
          !nodeSet.has(connection.targetNode.id)) {
        
        const shouldExecute = this.shouldExecuteConnection(connection, result);
        if (shouldExecute) {
          nodeSet.add(connection.targetNode.id);
          
          const promise = this.nodeQueue.add(
            NodeJobType.EXECUTE,
            {
              nodeId: connection.targetNode.id,
              executionId,
              inputData: result,
              visitedNodes: Array.from(visitedNodes),
            },
          );
          nodePromises.push(promise);
        }
      }
    }

    // Wait for all nodes to be queued
    await Promise.allSettled(nodePromises);
    return result;
  }

  async cancelExecution(executionId: string): Promise<void> {
    // Clean up tracking
    this.executingNodes.delete(executionId);
    
    // Clear timeout if exists
    const timeoutId = this.executionTimeouts.get(executionId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.executionTimeouts.delete(executionId);
    }
    
    // Remove pending jobs from both queues
    const nodeJobs = await this.nodeQueue.getJobs(['waiting', 'delayed', 'active']);
    const workflowJobs = await this.workflowQueue.getJobs(['waiting', 'delayed', 'active']);
    
    const allJobs = [...nodeJobs, ...workflowJobs];
    
    for (const job of allJobs) {
      if (job.data.executionId === executionId) {
        try {
          await job.remove();
        } catch (error) {
          this.logger.warn(`Failed to remove job ${job.id}: ${error.message}`);
        }
      }
    }

    // Update execution status
    await this.executionRepository.update(executionId, {
      status: ExecutionStatus.CANCELLED,
      finishedAt: new Date(),
    });
    
    this.logger.log(`Cancelled execution ${executionId}`);
  }

  async resumeExecution(execution: WorkflowExecution): Promise<void> {
    if (execution.currentNodeId) {
      const node = await this.nodeRepository.findOne({
        where: { id: execution.currentNodeId },
      });

      if (node) {
        await this.executeNodeAndContinue(node, execution.id, execution.data);
      }
    }
  }

  async getExecutionLogs(executionId: string): Promise<WorkflowExecutionLog[]> {
    return this.logRepository.find({
      where: { executionId },
      relations: ['node'],
      order: { createdAt: 'ASC' },
    });
  }

  async findWorkflowExecutions(
    workflowId: string,
    userId: string,
    options: { status?: string; limit?: number } = {}
  ): Promise<WorkflowExecution[]> {
    const query = this.executionRepository.createQueryBuilder('execution')
      .leftJoinAndSelect('execution.workflow', 'workflow')
      .where('execution.workflowId = :workflowId', { workflowId })
      .andWhere('workflow.userId = :userId', { userId })
      .orderBy('execution.createdAt', 'DESC');

    if (options.status) {
      query.andWhere('execution.status = :status', { status: options.status });
    }

    if (options.limit) {
      query.take(options.limit);
    }

    return query.getMany();
  }

  async findOneWithAuth(
    executionId: string,
    workflowId: string,
    userId: string
  ): Promise<WorkflowExecution> {
    const execution = await this.executionRepository.findOne({
      where: { id: executionId, workflowId },
      relations: ['workflow', 'logs'],
    });

    if (!execution) {
      throw new Error('Execution not found');
    }

    // Check authorization
    if (execution.workflow.userId !== userId) {
      throw new Error('Access denied');
    }

    return execution;
  }

  private shouldExecuteConnection(
    connection: WorkflowNodeConnection,
    nodeOutput: Record<string, any>,
  ): boolean {
    // Check for explicit branch routing first
    if (nodeOutput._conditionBranch) {
      return connection.type === nodeOutput._conditionBranch;
    }
    
    // Generic error detection
    if (connection.type === ConnectionType.ERROR) {
      return nodeOutput.error === true || 
             nodeOutput.success === false ||
             nodeOutput.status === 'failed' ||
             nodeOutput.statusCode >= 400;
    }
    
    // Success path
    if (connection.type === ConnectionType.MAIN) {
      return nodeOutput.error !== true && 
             nodeOutput.success !== false &&
             nodeOutput.status !== 'failed' &&
             (nodeOutput.statusCode === undefined || nodeOutput.statusCode < 400);
    }
    
    // TRUE/FALSE for condition nodes
    if (connection.type === ConnectionType.TRUE) {
      return nodeOutput.result === true || nodeOutput.condition === true;
    }
    
    if (connection.type === ConnectionType.FALSE) {
      return nodeOutput.result === false || nodeOutput.condition === false;
    }
    
    return false;
  }
}
