import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WORKFLOW_EXECUTION_QUEUE, WorkflowJobType } from '../constants';
import { WorkflowExecution, ExecutionStatus } from '../../../domain/entities/workflow-execution.entity';
import { Workflow } from '../../../domain/entities/workflow.entity';
import { WorkflowExecutionService } from '../../../application/services/workflow-execution.service';

interface WorkflowExecutionJobData {
  executionId: string;
  workflowId: string;
  userId: string;
  inputData?: Record<string, any>;
}

@Processor(WORKFLOW_EXECUTION_QUEUE)
export class WorkflowExecutionProcessor {
  private readonly logger = new Logger(WorkflowExecutionProcessor.name);

  constructor(
    @InjectRepository(WorkflowExecution)
    private executionRepository: Repository<WorkflowExecution>,
    @InjectRepository(Workflow)
    private workflowRepository: Repository<Workflow>,
    private workflowExecutionService: WorkflowExecutionService,
  ) {}

  @Process(WorkflowJobType.EXECUTE_WORKFLOW)
  async handleExecuteWorkflow(job: Job<WorkflowExecutionJobData>) {
    const { executionId, workflowId, inputData } = job.data;
    this.logger.log(`Starting workflow execution ${executionId}`);

    try {
      // Update execution status to running
      await this.executionRepository.update(executionId, {
        status: ExecutionStatus.RUNNING,
        startedAt: new Date(),
      });

      // Get workflow with nodes
      const workflow = await this.workflowRepository.findOne({
        where: { id: workflowId },
        relations: ['nodes', 'nodes.outgoingConnections', 'nodes.incomingConnections'],
      });

      if (!workflow) {
        throw new Error(`Workflow ${workflowId} not found`);
      }

      // Execute the workflow
      const result = await this.workflowExecutionService.executeWorkflow(
        workflow,
        executionId,
        inputData,
      );

      // Update execution status to success
      await this.executionRepository.update(executionId, {
        status: ExecutionStatus.SUCCESS,
        finishedAt: new Date(),
        data: result,
      });

      this.logger.log(`Workflow execution ${executionId} completed successfully`);
      return result;
    } catch (error) {
      this.logger.error(`Workflow execution ${executionId} failed:`, error);
      
      // Update execution status to failed
      await this.executionRepository.update(executionId, {
        status: ExecutionStatus.FAILED,
        finishedAt: new Date(),
        error: {
          message: error.message,
          stack: error.stack,
        },
      });

      throw error;
    }
  }

  @Process(WorkflowJobType.CANCEL_WORKFLOW)
  async handleCancelWorkflow(job: Job<{ executionId: string }>) {
    const { executionId } = job.data;
    this.logger.log(`Cancelling workflow execution ${executionId}`);

    await this.executionRepository.update(executionId, {
      status: ExecutionStatus.CANCELLED,
      finishedAt: new Date(),
    });

    // Cancel any pending node executions
    await this.workflowExecutionService.cancelExecution(executionId);
  }

  @Process(WorkflowJobType.RESUME_WORKFLOW)
  async handleResumeWorkflow(job: Job<WorkflowExecutionJobData>) {
    const { executionId } = job.data;
    this.logger.log(`Resuming workflow execution ${executionId}`);

    const execution = await this.executionRepository.findOne({
      where: { id: executionId },
      relations: ['workflow', 'workflow.nodes'],
    });

    if (!execution) {
      throw new Error(`Execution ${executionId} not found`);
    }

    await this.workflowExecutionService.resumeExecution(execution);
  }
}
