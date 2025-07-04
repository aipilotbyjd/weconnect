import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WORKFLOW_NODE_QUEUE, NodeJobType } from '../constants';
import { WorkflowNode } from '../../../domain/entities/workflow-node.entity';
import { WorkflowExecutionLog } from '../../../domain/entities/workflow-execution-log.entity';
import { WorkflowExecutionService } from '../../../application/services/workflow-execution.service';

interface NodeExecutionJobData {
  nodeId: string;
  executionId: string;
  inputData?: Record<string, any>;
}

@Processor(WORKFLOW_NODE_QUEUE)
export class WorkflowNodeProcessor {
  private readonly logger = new Logger(WorkflowNodeProcessor.name);

  constructor(
    @InjectRepository(WorkflowNode)
    private nodeRepository: Repository<WorkflowNode>,
    @InjectRepository(WorkflowExecutionLog)
    private logRepository: Repository<WorkflowExecutionLog>,
    private workflowExecutionService: WorkflowExecutionService,
  ) {}

  @Process(NodeJobType.EXECUTE)
  async handleExecuteNode(job: Job<NodeExecutionJobData>) {
    const { nodeId, executionId, inputData } = job.data;
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

      await this.logRepository.save({
        executionId,
        nodeId,
        level: 'info',
        message: `Node ${node.name} executed successfully`,
        nodeOutput: result,
      });

      this.logger.log(`Node ${nodeId} executed successfully`);
      return result;
    } catch (error) {
      this.logger.error(`Node execution ${nodeId} failed:`, error);

      await this.logRepository.save({
        executionId,
        nodeId,
        level: 'error',
        message: `Node execution failed: ${error.message}`,
        nodeOutput: error,
      });

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
