import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Execution, ExecutionStatus } from '../../domain/entities/execution.entity';
import { ExecutionLog, LogLevel } from '../../domain/entities/execution-log.entity';
import { WorkflowNode, NodeType } from '../../../workflows/domain/entities/workflow-node.entity';

@Injectable()
export class WorkflowExecutionService {
  constructor(
    @InjectRepository(Execution)
    private readonly executionRepository: Repository<Execution>,
    @InjectRepository(ExecutionLog)
    private readonly executionLogRepository: Repository<ExecutionLog>,
    @InjectRepository(WorkflowNode)
    private readonly workflowNodeRepository: Repository<WorkflowNode>,
  ) {}

  async executeWorkflow(executionId: string): Promise<void> {
    const execution = await this.executionRepository.findOne({
      where: { id: executionId },
      relations: ['workflow', 'user'],
    });

    if (!execution) {
      throw new Error('Execution not found');
    }

    try {
      // Update status to running
      execution.status = ExecutionStatus.RUNNING;
      execution.startedAt = new Date();
      await this.executionRepository.save(execution);

      await this.addLog(executionId, LogLevel.INFO, 'Workflow execution started');

      // Get workflow nodes ordered by execution order
      const nodes = await this.workflowNodeRepository.find({
        where: { workflowId: execution.workflowId, isEnabled: true },
        order: { executionOrder: 'ASC' },
      });

      if (nodes.length === 0) {
        throw new Error('No enabled nodes found in workflow');
      }

      let currentData = execution.inputData;
      
      // Execute each node sequentially
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const progress = Math.round(((i + 1) / nodes.length) * 100);
        
        execution.currentNodeId = node.id;
        execution.progress = progress;
        await this.executionRepository.save(execution);

        await this.addLog(executionId, LogLevel.INFO, `Executing node: ${node.name}`, node.id, node.name);

        try {
          // Execute the node
          currentData = await this.executeNode(node, currentData);
          
          await this.addLog(
            executionId, 
            LogLevel.INFO, 
            `Node executed successfully`, 
            node.id, 
            node.name,
            { outputData: currentData }
          );
        } catch (nodeError) {
          await this.addLog(
            executionId, 
            LogLevel.ERROR, 
            `Node execution failed: ${nodeError.message}`, 
            node.id, 
            node.name,
            { error: nodeError.message }
          );
          throw nodeError;
        }
      }

      // Mark as completed
      execution.status = ExecutionStatus.COMPLETED;
      execution.outputData = currentData;
      execution.finishedAt = new Date();
      execution.duration = execution.startedAt 
        ? Date.now() - execution.startedAt.getTime() 
        : 0;
      execution.progress = 100;
      execution.currentNodeId = undefined;
      
      await this.executionRepository.save(execution);
      await this.addLog(executionId, LogLevel.INFO, 'Workflow execution completed successfully');

    } catch (error) {
      // Mark as failed
      execution.status = ExecutionStatus.FAILED;
      execution.errorMessage = error.message;
      execution.errorStack = error.stack;
      execution.finishedAt = new Date();
      execution.duration = execution.startedAt 
        ? Date.now() - execution.startedAt.getTime() 
        : 0;
      execution.currentNodeId = undefined;
      
      await this.executionRepository.save(execution);
      await this.addLog(executionId, LogLevel.ERROR, `Workflow execution failed: ${error.message}`);
    }
  }

  private async executeNode(node: WorkflowNode, inputData: any): Promise<any> {
    // Simple node execution logic
    switch (node.type) {
      case NodeType.TRIGGER:
        return { ...inputData, triggered: true, timestamp: new Date() };
        
      case NodeType.HTTP_REQUEST:
        await this.delay(1000);
        return { ...inputData, httpResponse: { status: 200, data: 'Mock response' } };
        
      case NodeType.EMAIL:
        await this.delay(500);
        return { ...inputData, emailSent: true, recipient: inputData.email || 'test@example.com' };
        
      case NodeType.CONDITION:
        const conditionResult = inputData.value > 10;
        return { ...inputData, conditionResult };
        
      case NodeType.DELAY:
        const delayMs = node.configuration?.delayMs || 1000;
        await this.delay(delayMs);
        return { ...inputData, delayed: true };
        
      default:
        return { ...inputData, processed: true };
    }
  }

  private async addLog(
    executionId: string, 
    level: LogLevel, 
    message: string, 
    nodeId?: string, 
    nodeName?: string,
    data?: any
  ): Promise<void> {
    const log = this.executionLogRepository.create({
      executionId,
      level,
      message,
      nodeId,
      nodeName,
      data: data || {},
    });
    
    await this.executionLogRepository.save(log);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
