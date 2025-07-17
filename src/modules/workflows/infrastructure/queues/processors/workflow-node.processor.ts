import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job, Queue } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Repository } from 'typeorm';
import { WORKFLOW_NODE_QUEUE, NodeJobType } from '../constants';
import { WorkflowNode } from '../../../domain/entities/workflow-node.entity';
import {
  WorkflowExecutionLog,
  LogLevel,
} from '../../../domain/entities/workflow-execution-log.entity';
import { WorkflowExecutionService } from '../../../application/services/workflow-execution.service';

interface NodeExecutionJobData {
  nodeId: string;
  executionId: string;
  inputData?: Record<string, any>;
  visitedNodes?: string[];
  retryCount?: number;
}

@Processor(WORKFLOW_NODE_QUEUE)
export class WorkflowNodeProcessor {
  private readonly logger = new Logger(WorkflowNodeProcessor.name);

  constructor(
    @InjectRepository(WorkflowNode)
    private nodeRepository: Repository<WorkflowNode>,
    @InjectRepository(WorkflowExecutionLog)
    private logRepository: Repository<WorkflowExecutionLog>,
    @InjectQueue(WORKFLOW_NODE_QUEUE)
    private nodeQueue: Queue,
    private workflowExecutionService: WorkflowExecutionService,
  ) {}

  @Process(NodeJobType.EXECUTE)
  async handleExecuteNode(job: Job<NodeExecutionJobData>) {
    const {
      nodeId,
      executionId,
      inputData,
      visitedNodes = [],
      retryCount = 0,
    } = job.data;
    this.logger.log(`Executing node ${nodeId} for execution ${executionId}`);

    try {
      const node = await this.nodeRepository.findOne({
        where: { id: nodeId },
        relations: ['workflow'],
      });

      if (!node) {
        throw new Error(`Node ${nodeId} not found`);
      }

      const result = await this.workflowExecutionService.executeNode(
        node,
        executionId,
        inputData,
      );

      // Proper logging without TypeScript 'as any'
      await this.logRepository.save({
        executionId,
        nodeId,
        level: LogLevel.INFO,
        message: `Node ${node.name} executed successfully`,
        nodeOutput: result,
      });

      this.logger.log(`Node ${nodeId} executed successfully`);
      return result;
    } catch (error) {
      this.logger.error(`Node execution ${nodeId} failed:`, error);

      // Enhanced error logging
      await this.logRepository.save({
        executionId,
        nodeId,
        level: LogLevel.ERROR,
        message: `Node execution failed: ${error.message}`,
        data: {
          error: error.message,
          stack: error.stack,
          retryCount,
          visitedNodes,
        },
      });

      // Handle retries with exponential backoff
      if (retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff

        await this.nodeQueue.add(
          NodeJobType.RETRY,
          {
            ...job.data,
            retryCount: retryCount + 1,
          },
          { delay },
        );

        this.logger.log(
          `Scheduling retry ${retryCount + 1} for node ${nodeId} in ${delay}ms`,
        );
        return;
      }

      throw error;
    }
  }

  @Process(NodeJobType.RETRY)
  async handleRetryNode(job: Job<NodeExecutionJobData>) {
    const { nodeId, executionId } = job.data;
    this.logger.log(`Retrying node ${nodeId} for execution ${executionId}`);
    await this.handleExecuteNode(job);
  }
}
