import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workflow } from '../../domain/entities/workflow.entity';
import { WorkflowNode } from '../../domain/entities/workflow-node.entity';
import { CreateWorkflowDto } from '../../presentation/dto/create-workflow.dto';

@Injectable()
export class CreateWorkflowUseCase {
  constructor(
    @InjectRepository(Workflow)
    private readonly workflowRepository: Repository<Workflow>,
    @InjectRepository(WorkflowNode)
    private readonly workflowNodeRepository: Repository<WorkflowNode>,
  ) {}

  async execute(createWorkflowDto: CreateWorkflowDto, userId: string): Promise<Workflow> {
    const { nodes, ...workflowData } = createWorkflowDto;
    
    // Create workflow
    const workflow = this.workflowRepository.create({
      ...workflowData,
      userId,
    });
    
    const savedWorkflow = await this.workflowRepository.save(workflow);
    
    // Create nodes if provided
    if (nodes && nodes.length > 0) {
      const workflowNodes = nodes.map(nodeData =>
        this.workflowNodeRepository.create({
          ...nodeData,
          workflowId: savedWorkflow.id,
        })
      );
      
      await this.workflowNodeRepository.save(workflowNodes);
    }
    
    // Return workflow with nodes
    const fullWorkflow = await this.workflowRepository.findOne({
      where: { id: savedWorkflow.id },
      relations: ['nodes', 'user'],
    });
    
    if (!fullWorkflow) {
      throw new Error('Failed to retrieve created workflow');
    }
    
    return fullWorkflow;
  }
}
