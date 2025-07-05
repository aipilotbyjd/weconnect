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

@Injectable()
export class WorkflowExecutionService {
  private readonly logger = new Logger(WorkflowExecutionService.name);

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
  ) {}

  async startExecution(
    workflowId: string,
    userId: string,
    mode: ExecutionMode = ExecutionMode.MANUAL,
    inputData?: Record<string, any>,
  ): Promise<WorkflowExecution> {
    // Create execution record
    const execution = await this.executionRepository.save({
      workflowId,
      status: ExecutionStatus.PENDING,
      mode,
      data: inputData || {},
      metadata: {
        userId,
        startedBy: mode,
      },
    });

    // Add to queue
    await this.workflowQueue.add(
      WorkflowJobType.EXECUTE_WORKFLOW,
      {
        executionId: execution.id,
        workflowId,
        userId,
        inputData,
      },
      {
        priority: mode === ExecutionMode.MANUAL ? 1 : 0,
      },
    );

    this.logger.log(`Created workflow execution ${execution.id} for workflow ${workflowId}`);
    return execution;
  }

  async executeWorkflow(
    workflow: Workflow,
    executionId: string,
    inputData?: Record<string, any>,
  ): Promise<Record<string, any>> {
    this.logger.log(`Executing workflow ${workflow.id} with execution ${executionId}`);

    // Find trigger nodes
    const triggerNodes = workflow.nodes.filter(node => node.type === NodeType.TRIGGER);
    
    if (triggerNodes.length === 0) {
      throw new Error('No trigger node found in workflow');
    }

    // Execute from trigger nodes
    const results = {};
    for (const triggerNode of triggerNodes) {
      const result = await this.executeNodeAndContinue(triggerNode, executionId, inputData);
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
      
      // Log node start
      await this.logRepository.save({
        executionId,
        nodeId: node.id,
        level: LogLevel.INFO,
        message: `Starting node execution: ${node.name}`,
        nodeInput: inputData,
      });

      // Execute node
      const result = await executor.execute(node, inputData || {}, executionId);

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
  ): Promise<Record<string, any>> {
    // Execute current node
    const result = await this.executeNode(node, executionId, inputData);

    // Find outgoing connections
    const connections = await this.connectionRepository.find({
      where: { sourceNodeId: node.id },
      relations: ['targetNode'],
    });

    // Execute connected nodes
    for (const connection of connections) {
      if (connection.targetNode && connection.targetNode.isEnabled) {
        // Check if this is a conditional branch
        const shouldExecute = this.shouldExecuteConnection(connection, result);
        
        if (shouldExecute) {
          await this.nodeQueue.add(
            NodeJobType.EXECUTE,
            {
              nodeId: connection.targetNode.id,
              executionId,
              inputData: result,
            },
          );
        }
      }
    }

    return result;
  }

  async cancelExecution(executionId: string): Promise<void> {
    // Remove pending jobs from queue
    const jobs = await this.nodeQueue.getJobs(['waiting', 'delayed']);
    for (const job of jobs) {
      if (job.data.executionId === executionId) {
        await job.remove();
      }
    }

    // Update execution status
    await this.executionRepository.update(executionId, {
      status: ExecutionStatus.CANCELLED,
    });
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

  private shouldExecuteConnection(
    connection: WorkflowNodeConnection,
    nodeOutput: Record<string, any>,
  ): boolean {
    // For condition nodes, check the branch
    if (nodeOutput._conditionBranch) {
      return connection.type === nodeOutput._conditionBranch;
    }
    
    // For error connections, check if there was an error
    if (connection.type === ConnectionType.ERROR) {
      return nodeOutput.error || nodeOutput.webhookError || nodeOutput.emailStatus === 'failed';
    }
    
    // For main connections, execute if no specific condition
    return connection.type === ConnectionType.MAIN;
  }
}
