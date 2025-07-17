import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Execution,
  ExecutionStatus,
  ExecutionMode,
} from '../../domain/entities/execution.entity';
import { Workflow } from '../../../workflows/domain/entities/workflow.entity';
import { StartExecutionDto } from '../../presentation/dto/start-execution.dto';
import { WorkflowExecutionService } from '../services/workflow-execution.service';

@Injectable()
export class StartExecutionUseCase {
  constructor(
    @InjectRepository(Execution)
    private readonly executionRepository: Repository<Execution>,
    @InjectRepository(Workflow)
    private readonly workflowRepository: Repository<Workflow>,
    private readonly workflowExecutionService: WorkflowExecutionService,
  ) {}

  async execute(
    workflowId: string,
    startExecutionDto: StartExecutionDto,
    userId: string,
  ): Promise<Execution> {
    // Validate workflow
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

    // Start execution in background
    this.workflowExecutionService
      .executeWorkflow(savedExecution.id)
      .catch((error) => {
        console.error('Execution failed:', error);
      });

    return savedExecution;
  }
}
