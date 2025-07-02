import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Execution, ExecutionStatus, ExecutionMode } from '../../domain/entities/execution.entity';
import { ExecutionLog, LogLevel } from '../../domain/entities/execution-log.entity';
import { Workflow } from '../../../workflows/domain/entities/workflow.entity';
import { WorkflowNode, NodeType } from '../../../workflows/domain/entities/workflow-node.entity';
import { StartExecutionDto } from '../../presentation/dto/start-execution.dto';
import { StartExecutionUseCase } from '../use-cases/start-execution.use-case';

@Injectable()
export class ExecutionsService {
  constructor(
    @InjectRepository(Execution)
    private readonly executionRepository: Repository<Execution>,
    @InjectRepository(ExecutionLog)
    private readonly executionLogRepository: Repository<ExecutionLog>,
    @InjectRepository(Workflow)
    private readonly workflowRepository: Repository<Workflow>,
    @InjectRepository(WorkflowNode)
    private readonly workflowNodeRepository: Repository<WorkflowNode>,
  ) {}

  async startExecution(workflowId: string, startExecutionDto: StartExecutionDto, userId: string): Promise<Execution> {
    const workflow = await this.workflowRepository.findOne({
      where: { id: workflowId, userId },
      relations: ['nodes'],
    });

    if (!workflow) {
      throw new NotFoundException('Workflow not found');
    }

    if (!workflow.isActive) {
      throw new BadRequestException('Workflow is not active');
    }

    // Create execution record
    const execution = this.executionRepository.create({
      workflowId,
      userId,
      mode: startExecutionDto.mode || ExecutionMode.MANUAL,
      inputData: startExecutionDto.inputData || {},
      status: ExecutionStatus.PENDING,
    });

    const savedExecution = await this.executionRepository.save(execution);

    // Log execution start
    await this.addLog(savedExecution.id, LogLevel.INFO, 'Execution started', undefined, 'System');

    // Start execution in background
    this.executeWorkflow(savedExecution.id).catch(error => {
      console.error('Execution failed:', error);
    });

    return savedExecution;
  }

  async findAll(userId: string): Promise<Execution[]> {
    return this.executionRepository.find({
      where: { userId },
      relations: ['workflow'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Execution> {
    const execution = await this.executionRepository.findOne({
      where: { id },
      relations: ['workflow', 'logs', 'user'],
    });

    if (!execution) {
      throw new NotFoundException('Execution not found');
    }

    return execution;
  }

  async getExecutionLogs(executionId: string): Promise<ExecutionLog[]> {
    return this.executionLogRepository.find({
      where: { executionId },
      order: { createdAt: 'ASC' },
    });
  }

  async cancelExecution(id: string, userId: string): Promise<Execution> {
    const execution = await this.findOne(id);
    
    if (execution.userId !== userId) {
      throw new BadRequestException('You can only cancel your own executions');
    }

    if (execution.isCompleted) {
      throw new BadRequestException('Cannot cancel completed execution');
    }

    execution.status = ExecutionStatus.CANCELLED;
    execution.finishedAt = new Date();
    execution.duration = execution.startedAt 
      ? Date.now() - execution.startedAt.getTime() 
      : 0;

    await this.executionRepository.save(execution);
    await this.addLog(id, LogLevel.INFO, 'Execution cancelled by user');

    return execution;
  }

  private async executeWorkflow(executionId: string): Promise<void> {
    const execution = await this.findOne(executionId);
    
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
          // Execute the node (simplified for now)
          currentData = await this.executeNode(node, currentData, executionId);
          
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
      
      // Update workflow execution stats
      await this.workflowRepository.update(execution.workflowId, {
        executionCount: () => 'execution_count + 1',
        lastExecutedAt: new Date(),
      });

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

  private async executeNode(node: WorkflowNode, inputData: any, executionId: string): Promise<any> {
    const startTime = Date.now();
    
    // Simple node execution logic (will be expanded later)
    switch (node.type) {
      case NodeType.TRIGGER:
        return { ...inputData, triggered: true, timestamp: new Date() };
        
      case NodeType.HTTP_REQUEST:
        // Simulate HTTP request
        await this.delay(1000); // Simulate request time
        return { ...inputData, httpResponse: { status: 200, data: 'Mock response' } };
        
      case NodeType.EMAIL:
        // Simulate email sending
        await this.delay(500);
        return { ...inputData, emailSent: true, recipient: inputData.email || 'test@example.com' };
        
      case NodeType.CONDITION:
        // Simple condition check
        const conditionResult = inputData.value > 10; // Simple condition
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
